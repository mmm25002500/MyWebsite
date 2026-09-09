/**
 * 把匯入文章裡引用的本地圖片搬進 Supabase Storage，並改寫內文連結。
 *
 *   pnpm import:images -- --source <legacy repo 目錄> [--dry-run]
 *
 * 需要 SUPABASE_SERVICE_ROLE_KEY：Storage 上傳只能走 API，而 RLS 規定
 * 只有 editor 以上能寫入 media bucket，一次性的匯入腳本沒有登入 session。
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { createClient } from '@supabase/supabase-js';
import { Client } from 'pg';

const args = process.argv.slice(2);
const sourceRoot = args[args.indexOf('--source') + 1];
const dryRun = args.includes('--dry-run');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const dbPassword = process.env.SUPABASE_DB_PASSWORD;

if (!sourceRoot || sourceRoot.startsWith('--') || !supabaseUrl || !serviceKey || !dbPassword) {
  console.error(
    '用法：pnpm import:images -- --source <目錄>\n需要 NEXT_PUBLIC_SUPABASE_URL、SUPABASE_SERVICE_ROLE_KEY、SUPABASE_DB_PASSWORD',
  );
  process.exit(1);
}

const BUCKET = 'media';
const mimeByExt: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.avif': 'image/avif',
};

/**
 * 舊站的圖片路徑對應到 clone 下來的實體檔案。
 *
 * VuePress 把 `docs/.vuepress/public` 當網站根目錄，因此文章裡的 `/img/post/x.png`
 * 實際上是 `blog/docs/.vuepress/public/img/post/x.png`；Docusaurus 則是
 * 文章旁的相對路徑與 `static/`。
 */
function candidatePaths(reference: string): string[] {
  const clean = reference.split(/[?#]/)[0]!.replace(/^\.?\//, '');
  return [
    path.join(sourceRoot!, 'blog', 'docs', '.vuepress', 'public', clean),
    path.join(sourceRoot!, 'notes', 'static', clean),
    path.join(sourceRoot!, 'notes', 'docs', clean),
    path.join(sourceRoot!, 'blog', 'docs', clean),
  ];
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false },
});

const ref = new URL(supabaseUrl).hostname.split('.')[0]!;
const db = new Client({
  host: `db.${ref}.supabase.co`,
  user: 'postgres',
  password: dbPassword,
  database: 'postgres',
  ssl: { rejectUnauthorized: false },
});

await db.connect();

const { rows: posts } = await db.query<{ post_id: string; slug: string; content_md: string }>(
  `select i.post_id, p.slug, i.content_md
     from public.posts_i18n i
     join public.posts p on p.id = i.post_id
    where i.locale = 'zh-TW' and i.content_md like '%](%'`,
);

// Markdown 圖片與 HTML img 都要處理；只挑非 http/data 的本地路徑。
const imagePattern = /!\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)|<img[^>]+src="([^"]+)"/g;

const uploads = new Map<string, string>(); // 原始路徑 → Storage 公開網址
let missing = 0;

for (const post of posts) {
  for (const match of post.content_md.matchAll(imagePattern)) {
    const reference = (match[1] ?? match[2] ?? '').trim();
    if (!reference || /^(https?:|data:|mailto:)/.test(reference)) continue;
    if (uploads.has(reference)) continue;

    let buffer: Buffer | null = null;
    let found = '';
    for (const candidate of candidatePaths(reference)) {
      try {
        buffer = await readFile(candidate);
        found = candidate;
        break;
      } catch {
        continue;
      }
    }

    if (!buffer) {
      console.log(`  ✗ 找不到檔案：${reference}（${post.slug}）`);
      missing += 1;
      continue;
    }

    const ext = path.extname(reference).toLowerCase();
    const mime = mimeByExt[ext];
    if (!mime) {
      console.log(`  ✗ 不支援的格式：${reference}`);
      missing += 1;
      continue;
    }

    // 以文章 slug 分目錄，檔名沿用原本的，方便日後對照舊站。
    const objectPath = `posts/${post.slug}/${path.basename(reference)}`;

    if (dryRun) {
      console.log(`  → ${reference}  ←  ${path.relative(sourceRoot!, found)}`);
      uploads.set(reference, `[dry-run]/${objectPath}`);
      continue;
    }

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(objectPath, buffer, { contentType: mime, upsert: true });

    if (error) {
      console.log(`  ✗ 上傳失敗 ${objectPath}：${error.message}`);
      missing += 1;
      continue;
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(objectPath);
    uploads.set(reference, data.publicUrl);
    console.log(`  ✓ ${objectPath}`);
  }
}

console.log(`\n可上傳 ${uploads.size} 張，找不到或不支援 ${missing} 張。`);

if (dryRun) {
  await db.end();
  process.exit(0);
}

// 改寫內文連結。html 一併重算，前台讀的是預渲染好的 content_html。
const { renderMarkdown } = await import('../src/lib/content/markdown.js');
let rewritten = 0;

await db.query('begin');
try {
  for (const post of posts) {
    let markdown = post.content_md;
    let changed = false;

    for (const [reference, url] of uploads) {
      if (!markdown.includes(reference)) continue;
      markdown = markdown.split(reference).join(url);
      changed = true;
    }

    if (!changed) continue;

    const rendered = await renderMarkdown(markdown);
    await db.query(
      `update public.posts_i18n
          set content_md = $2, content_html = $3, content_text = $4, toc = $5
        where post_id = $1 and locale = 'zh-TW'`,
      [post.post_id, markdown, rendered.html, rendered.text, JSON.stringify(rendered.toc)],
    );
    rewritten += 1;
  }
  await db.query('commit');
  console.log(`改寫 ${rewritten} 篇文章的圖片連結。`);
} catch (error) {
  await db.query('rollback');
  console.error('改寫失敗，已 rollback：', error);
  process.exitCode = 1;
} finally {
  await db.end();
}
