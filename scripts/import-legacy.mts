/**
 * 把舊站的 Markdown 匯入 `posts`（規格 §8.2.1、附錄 B）。
 *
 * 來源（公開 repo，執行前需先 clone 到 --source 指定的目錄）：
 *   <user>/blog                VuePress
 *   <user>/notes               Docusaurus
 *   <user>/learning-note       Obsidian
 *
 *   pnpm import:legacy -- --source <目錄> [--dry-run] [--publish]
 *
 * 依規格 §8.2.1，匯入的文章預設一律先進 draft，確認後再批次發佈；
 * 加 --publish 可在匯入當下直接發佈。
 */
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';

import { Client } from 'pg';
import { parse as parseYaml } from 'yaml';

import { renderMarkdown } from '../src/lib/content/markdown.js';

const execFileAsync = promisify(execFile);

/**
 * 該檔案在 repo 內最後一次被修改的時間。
 *
 * clone 下來的檔案 mtime 一律是 clone 的當下，直接拿來當發佈時間會讓
 * 所有文章都變成今天。git 紀錄才是這批內容真正的時間。
 */
async function gitLastModified(repoRoot: string, absolute: string): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync(
      'git',
      ['-C', repoRoot, 'log', '-1', '--format=%aI', '--', absolute],
      { timeout: 15_000 },
    );
    const value = stdout.trim();
    if (!value) return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
  } catch {
    return null;
  }
}

interface Frontmatter {
  title?: string;
  date?: string | Date;
  permalink?: string;
  slug?: string;
  categories?: string[] | string;
  tags?: string[] | string;
  sidebar_position?: number;
  draft?: boolean;
}

interface Candidate {
  source: string;      // repo 名稱
  file: string;        // 相對路徑
  title: string;
  markdown: string;
  frontmatter: Frontmatter;
  categorySlugs: string[];
  primaryCategory: string;
  tagNames: string[];
  seriesSlug: string | null;
  seriesOrder: number | null;
  publishedAt: string;
  slug: string;
}

// ---------------------------------------------------------------------------
// 要略過的檔案
//
// Docusaurus 與 VuePress 建立專案時附帶的示範內容，以及 README／範本／語系檔。
// 這些不是站長寫的東西，匯進來只會變成需要人工清掉的雜訊。
// ---------------------------------------------------------------------------
const SKIP_PATTERNS: RegExp[] = [
  /(^|\/)README\.md(\.md)?$/i,
  /(^|\/)en_US\.md$/,
  /(^|\/)範本\.md(\.md)?$/,
  /\/@pages\//,
  /\/src\/pages\//,
  /\/\.vuepress\//,
  /\/node_modules\//,
  // Docusaurus 的教學樣板
  /\/(congratulations|create-a-blog-post|create-a-page|create-a-document|deploy-your-site|markdown-features|manage-docs-versions|translate-your-site)\.mdx?$/,
  /\/blog\/\d{4}-\d{2}-\d{2}-(long-blog-post|welcome)/,
  /\/ArchLinux\/aasdtest\.md$/,
];

/** 內容過短、只有標題沒有內文的殘稿。 */
const MIN_BODY_CHARS = 200;

// ---------------------------------------------------------------------------
// 分類對應（附錄 B：LeetCode 文章歸入 algorithm 並建立系列）
// ---------------------------------------------------------------------------
function classify(file: string, frontmatter: Frontmatter): {
  categories: string[];
  primary: string;
  series: string | null;
} {
  const p = file.toLowerCase();

  if (p.includes('leetcode')) {
    return { categories: ['algorithm', 'tech'], primary: 'algorithm', series: 'leetcode' };
  }
  if (p.includes('/vue/') || p.includes('vue.js')) {
    return { categories: ['tech'], primary: 'tech', series: 'vue' };
  }
  if (p.includes('/react/')) {
    return { categories: ['tech'], primary: 'tech', series: 'react' };
  }
  if (p.includes('/web3/') || p.includes('/ton/')) {
    return { categories: ['blockchain', 'tech'], primary: 'blockchain', series: null };
  }
  if (p.includes('/website/') || p.includes('/github/')) {
    return { categories: ['tech'], primary: 'tech', series: null };
  }
  if (p.includes('/archlinux/') || p.includes('/ubuntu/')) {
    return { categories: ['tech'], primary: 'tech', series: null };
  }
  if (p.includes('/隨筆/') || p.includes('/life/')) {
    return { categories: ['life'], primary: 'life', series: null };
  }
  if (p.includes('/紀錄/')) {
    return { categories: ['til'], primary: 'til', series: null };
  }

  const fmCategories = normalizeList(frontmatter.categories).map((c) => c.toLowerCase());
  if (fmCategories.includes('教學')) return { categories: ['tech'], primary: 'tech', series: null };

  return { categories: ['tech'], primary: 'tech', series: null };
}

/** 從既有的標籤庫比對內容關鍵字，避免產生一堆只用一次的標籤。 */
const TAG_RULES: [RegExp, string][] = [
  [/vue/i, 'Vue'],
  [/react native/i, 'React Native'],
  [/\breact\b/i, 'React'],
  [/next\.?js/i, 'Next.js'],
  [/typescript/i, 'TypeScript'],
  [/tailwind/i, 'Tailwind'],
  [/leetcode|刷題/i, 'LeetCode'],
  [/hugo|vuepress|docusaurus|github.?page/i, '架站'],
  [/arch\s?linux|ubuntu|linux/i, 'Linux'],
  [/docker/i, 'Docker'],
  [/python/i, 'Python'],
  [/node\.?js/i, 'Node.js'],
  [/solidity/i, 'Solidity'],
  [/\bton\b/i, 'TON'],
  [/bitcoin|比特幣/i, 'Bitcoin'],
  [/ethereum|以太/i, 'Ethereum'],
];

function normalizeList(value: string[] | string | undefined): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean);
  return String(value)
    .split(/[,、]/)
    .map((v) => v.trim())
    .filter(Boolean);
}

/**
 * 標籤只從標題、frontmatter 與檔案路徑推導。
 *
 * 早期版本連內文一起掃，結果〈關於我〉因為文中提到用過的技術而被打上
 * Vue／Linux／Python，〈Daily Routine〉因為提到刷題而被打上 LeetCode。
 * 內文的順帶提及不等於文章主題，因此不納入判斷。
 */
function deriveTags(title: string, file: string, frontmatter: Frontmatter): string[] {
  const found = new Set<string>();
  const haystack = `${title}\n${file}\n${normalizeList(frontmatter.categories).join(' ')}`;

  for (const [pattern, tag] of TAG_RULES) {
    if (pattern.test(haystack)) found.add(tag);
  }

  for (const raw of normalizeList(frontmatter.tags)) {
    for (const [pattern, tag] of TAG_RULES) {
      if (pattern.test(raw)) found.add(tag);
    }
  }

  return [...found];
}

/** slug：優先用 VuePress 的 permalink 雜湊，其次 frontmatter slug，最後由標題產生。 */
function deriveSlug(title: string, frontmatter: Frontmatter): string {
  if (typeof frontmatter.slug === 'string' && frontmatter.slug.trim()) {
    return frontmatter.slug.trim().replace(/^\/+|\/+$/g, '');
  }
  if (typeof frontmatter.permalink === 'string') {
    const tail = frontmatter.permalink.split('/').filter(Boolean).pop();
    if (tail && /^[a-z0-9]{6,}$/i.test(tail)) return tail.toLowerCase();
  }
  return title
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[.:/\\?#[\]@!$&'()*+,;=]/g, ' ')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

const CJK_NUMERALS: Record<string, number> = {
  一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10,
};

/** 系列序號：從「第01篇」「第 3 章」「學習筆記三」「1480.」這類標題推出順序。 */
function deriveSeriesOrder(title: string, frontmatter: Frontmatter): number | null {
  const arabic = /第\s*(\d+)\s*[篇章]/.exec(title);
  if (arabic?.[1]) return Number(arabic[1]);

  const cjk = /第\s*([一二三四五六七八九十]+)\s*[篇章]/.exec(title);
  if (cjk?.[1] && CJK_NUMERALS[cjk[1]]) return CJK_NUMERALS[cjk[1]]!;

  // 「Vue.JS 學習筆記一」「學習筆記二 - Vue API」這種序號接在「筆記」後面的寫法
  const afterNote = /筆記\s*([一二三四五六七八九十]|\d+)/.exec(title);
  if (afterNote?.[1]) {
    return CJK_NUMERALS[afterNote[1]] ?? Number(afterNote[1]);
  }

  // LeetCode 以題號排序：「Leetcode 747. 至少是…」「1480. 一維陣列累積和」
  const problemNumber = /(?:^|\s)(\d{1,4})\s*[.．]/.exec(title);
  if (problemNumber?.[1]) return Number(problemNumber[1]);

  const leading = /^(\d+)[.\s]/.exec(title.trim());
  if (leading?.[1]) return Number(leading[1]);

  if (typeof frontmatter.sidebar_position === 'number') return frontmatter.sidebar_position;
  return null;
}

/**
 * 改寫舊站的站內連結。
 *
 * VuePress 時期的文章互相以 `/pages/<hash>/` 連結，而匯入後這些文章沿用同一組
 * hash 當 slug，因此只要把路徑前綴換掉就能接回去，不必逐篇人工修。
 */
function rewriteInternalLinks(markdown: string): string {
  return markdown.replace(/\]\(\/pages\/([a-z0-9]+)\/?\)/gi, '](/notes/p/$1)');
}

function splitFrontmatter(raw: string): { frontmatter: Frontmatter; body: string } {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(raw);
  if (!match) return { frontmatter: {}, body: raw };

  try {
    const parsed = (parseYaml(match[1] ?? '') ?? {}) as Frontmatter;
    return { frontmatter: parsed, body: raw.slice(match[0].length) };
  } catch {
    return { frontmatter: {}, body: raw.slice(match[0].length) };
  }
}

function deriveTitle(body: string, frontmatter: Frontmatter, file: string): string {
  if (typeof frontmatter.title === 'string' && frontmatter.title.trim()) {
    return frontmatter.title.trim();
  }
  const heading = /^#\s+(.+)$/m.exec(body);
  if (heading?.[1]) return heading[1].trim();
  return path.basename(file).replace(/\.mdx?$/i, '').replace(/\.md$/i, '');
}

/**
 * 發佈時間：frontmatter 的 date 最準；其次從路徑或檔名的日期推；
 * 都沒有時退回檔案的 mtime，讓文章至少有穩定的排序依據。
 */
async function derivePublishedAt(
  absolute: string,
  file: string,
  frontmatter: Frontmatter,
  repoRoot: string,
): Promise<string> {
  if (frontmatter.date) {
    const parsed = new Date(frontmatter.date as string);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  }

  const fromPath = /(\d{4})[-/](\d{2})[-/](\d{2})/.exec(file);
  if (fromPath) {
    const parsed = new Date(`${fromPath[1]}-${fromPath[2]}-${fromPath[3]}T09:00:00+08:00`);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  }

  const yearMonth = /\/(\d{4})\/(\d{2})\//.exec(file);
  if (yearMonth) {
    return new Date(`${yearMonth[1]}-${yearMonth[2]}-01T09:00:00+08:00`).toISOString();
  }

  const fromGit = await gitLastModified(repoRoot, absolute);
  if (fromGit) return fromGit;

  const info = await stat(absolute);
  return info.mtime.toISOString();
}

async function walk(dir: string): Promise<string[]> {
  const out: string[] = [];
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }

  for (const entry of entries) {
    if (entry.name === '.git' || entry.name === 'node_modules') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else if (/\.mdx?$/i.test(entry.name)) out.push(full);
  }
  return out;
}

// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const sourceRoot = args[args.indexOf('--source') + 1];
const dryRun = args.includes('--dry-run');
const publish = args.includes('--publish');

if (!sourceRoot || sourceRoot.startsWith('--')) {
  console.error('用法：pnpm import:legacy -- --source <clone 後的目錄> [--dry-run] [--publish]');
  process.exit(1);
}

const repos = [
  { name: 'blog', root: path.join(sourceRoot, 'blog', 'docs', '_posts') },
  { name: 'notes', root: path.join(sourceRoot, 'notes', 'docs') },
  { name: 'notes', root: path.join(sourceRoot, 'notes', 'life') },
  { name: 'learning-note', root: path.join(sourceRoot, 'learning-note', '紀錄') },
];

const candidates: Candidate[] = [];
const skipped: { file: string; reason: string }[] = [];

for (const repo of repos) {
  for (const absolute of await walk(repo.root)) {
    const file = path.relative(sourceRoot, absolute);

    if (SKIP_PATTERNS.some((pattern) => pattern.test(`/${file}`))) {
      skipped.push({ file, reason: '樣板／非文章檔' });
      continue;
    }

    const raw = await readFile(absolute, 'utf8');
    const { frontmatter, body } = splitFrontmatter(raw);

    if (frontmatter.draft === true) {
      skipped.push({ file, reason: 'frontmatter draft: true' });
      continue;
    }

    const stripped = body.replace(/^#\s+.+$/m, '').trim();
    if (stripped.length < MIN_BODY_CHARS) {
      skipped.push({ file, reason: `內容過短（${stripped.length} 字）` });
      continue;
    }

    const title = deriveTitle(body, frontmatter, file);
    const { categories, primary, series } = classify(file, frontmatter);

    candidates.push({
      source: repo.name,
      file,
      title,
      markdown: rewriteInternalLinks(body.trim()),
      frontmatter,
      categorySlugs: categories,
      primaryCategory: primary,
      tagNames: deriveTags(title, file, frontmatter),
      seriesSlug: series,
      seriesOrder: series ? deriveSeriesOrder(title, frontmatter) : null,
      publishedAt: await derivePublishedAt(absolute, file, frontmatter, path.join(sourceRoot, repo.name)),
      slug: deriveSlug(title, frontmatter),
    });
  }
}

// 同標題去重：保留 frontmatter 較完整的那份（有 date／categories 的優先）。
const byTitle = new Map<string, Candidate>();
const byContent = new Map<string, Candidate>();
const duplicates: { kept: string; dropped: string; title: string }[] = [];

const richness = (c: Candidate) =>
  (c.frontmatter.date ? 2 : 0) +
  (c.frontmatter.categories ? 1 : 0) +
  (c.frontmatter.permalink ? 1 : 0);

/**
 * 標題去重鍵。
 *
 * 同一篇 LeetCode 題解在 blog 叫「Leetcode 747. 至少是…」，在 notes 叫
 * 「747. 至少是…」，只比對原標題會漏掉，因此先去掉站台前綴與標點再比。
 */
function titleKey(title: string): string {
  return title
    .toLowerCase()
    .replace(/^(leetcode|leet\s?code)\s*/i, '')
    .replace(/[.．、,，:：\-—_()（）\s]/g, '');
}

/**
 * 內容去重鍵。
 *
 * 站台從 VuePress 搬到 Docusaurus 時，同一篇文章被改了標題
 * （「Vue.JS 學習筆記一」→「第01篇 前言和起手式」），內文卻一字未改，
 * 只有舊版結尾多一段「相關文章」連結。因此比對正規化後的開頭而非整篇，
 * 否則結尾的差異會讓同一篇被當成兩篇匯入。
 */
const CONTENT_KEY_CHARS = 400;

function contentKey(markdown: string): string {
  const normalized = markdown
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
    .slice(0, CONTENT_KEY_CHARS);
  return createHash('sha1').update(normalized).digest('hex');
}

for (const candidate of candidates) {
  const tKey = titleKey(candidate.title);
  const cKey = contentKey(candidate.markdown);

  const existing = byTitle.get(tKey) ?? byContent.get(cKey);

  if (!existing) {
    byTitle.set(tKey, candidate);
    byContent.set(cKey, candidate);
    continue;
  }

  const [kept, dropped] =
    richness(candidate) > richness(existing) ? [candidate, existing] : [existing, candidate];

  // 兩個索引都指向保留的那一份，避免後續候選再撞到已被捨棄的項目。
  byTitle.set(titleKey(kept.title), kept);
  byTitle.set(tKey, kept);
  byContent.set(contentKey(kept.markdown), kept);
  byContent.set(cKey, kept);

  duplicates.push({ kept: kept.file, dropped: dropped.file, title: kept.title });
}

const posts = [...new Set(byTitle.values())];

// slug 衝突時加序號（規格 §8.2.1）。
const usedSlugs = new Map<string, number>();
for (const post of posts) {
  const base = post.slug || 'post';
  const seen = usedSlugs.get(base) ?? 0;
  usedSlugs.set(base, seen + 1);
  if (seen > 0) post.slug = `${base}-${seen + 1}`;
}

posts.sort((a, b) => a.publishedAt.localeCompare(b.publishedAt));

// ---------------------------------------------------------------------------
// 報表
// ---------------------------------------------------------------------------
console.log(`\n來源掃描：${candidates.length + skipped.length} 個檔案`);
console.log(`  匯入      ${posts.length}`);
console.log(`  略過      ${skipped.length}`);
console.log(`  重複合併  ${duplicates.length}`);

const bySeries = new Map<string, number>();
const byCategory = new Map<string, number>();
for (const post of posts) {
  if (post.seriesSlug) bySeries.set(post.seriesSlug, (bySeries.get(post.seriesSlug) ?? 0) + 1);
  byCategory.set(post.primaryCategory, (byCategory.get(post.primaryCategory) ?? 0) + 1);
}
console.log('\n主分類：', [...byCategory].map(([k, v]) => `${k}=${v}`).join('  '));
console.log('系列：  ', [...bySeries].map(([k, v]) => `${k}=${v}`).join('  ') || '(無)');

const withLocalImages = posts.filter((p) =>
  /!\[[^\]]*\]\((?!https?:|data:)/.test(p.markdown),
);
if (withLocalImages.length > 0) {
  console.log(`\n引用本地圖片、需另行上傳 Storage 的文章：${withLocalImages.length}`);
  for (const post of withLocalImages) console.log(`  - ${post.title}`);
}

if (dryRun) {
  console.log('\n--dry-run，以下為將寫入的文章：\n');
  for (const post of posts) {
    console.log(
      `  ${post.publishedAt.slice(0, 10)}  [${post.primaryCategory}]${post.seriesSlug ? `[${post.seriesSlug}#${post.seriesOrder ?? '?'}]` : ''}  ${post.title}`,
    );
    console.log(`      slug=${post.slug}  tags=${post.tagNames.join(',') || '-'}  ← ${post.file}`);
  }
  console.log('\n略過的檔案：');
  for (const item of skipped) console.log(`  ${item.reason.padEnd(18)} ${item.file}`);
  if (duplicates.length > 0) {
    console.log('\n重複合併：');
    for (const d of duplicates) console.log(`  ${d.title}\n    保留 ${d.kept}\n    捨棄 ${d.dropped}`);
  }
  process.exit(0);
}

// ---------------------------------------------------------------------------
// 寫入
// ---------------------------------------------------------------------------
const password = process.env.SUPABASE_DB_PASSWORD;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!password || !supabaseUrl) {
  console.error('缺少 SUPABASE_DB_PASSWORD 或 NEXT_PUBLIC_SUPABASE_URL');
  process.exit(1);
}

const ref = new URL(supabaseUrl).hostname.split('.')[0]!;
const client = new Client({
  host: `db.${ref}.supabase.co`,
  user: 'postgres',
  password,
  database: 'postgres',
  ssl: { rejectUnauthorized: false },
  statement_timeout: 300_000,
});

await client.connect();
console.log(`\n連線到 ${ref}，開始寫入…`);

try {
  await client.query('begin');

  // 系列
  const seriesTitles: Record<string, { zh: string; en: string; description: string }> = {
    leetcode: { zh: 'LeetCode 解題', en: 'LeetCode', description: '逐題的解法與思路整理。' },
    vue: { zh: 'Vue 學習筆記', en: 'Learning Vue', description: '從起手式到專案實作的 Vue 系列筆記。' },
    react: { zh: 'React 學習筆記', en: 'Learning React', description: 'React 的基礎與實作紀錄。' },
  };

  for (const [slug, meta] of Object.entries(seriesTitles)) {
    if (!bySeries.has(slug)) continue;
    await client.query(
      `insert into public.series (slug, is_visible) values ($1, true)
       on conflict (slug) do nothing`,
      [slug],
    );
    for (const [locale, title] of [
      ['zh-TW', meta.zh],
      ['en', meta.en],
    ] as const) {
      await client.query(
        `insert into public.series_i18n (series_id, locale, title, description)
         select id, $2, $3, $4 from public.series where slug = $1
         on conflict (series_id, locale) do update set title = excluded.title`,
        [slug, locale, title, locale === 'zh-TW' ? meta.description : null],
      );
    }
  }

  // 標籤（不存在的自動建立，規格 §8.2.1）
  const allTags = [...new Set(posts.flatMap((p) => p.tagNames))];
  for (const name of allTags) {
    const slug = name
      .toLowerCase()
      .replace(/\./g, '')
      .replace(/[^a-z0-9一-鿿]+/g, '-')
      .replace(/^-+|-+$/g, '');
    await client.query(
      `insert into public.tags (slug) values ($1) on conflict (slug) do nothing`,
      [slug],
    );
    for (const locale of ['zh-TW', 'en'] as const) {
      await client.query(
        `insert into public.tags_i18n (tag_id, locale, name)
         select id, $2, $3 from public.tags where slug = $1
         on conflict (tag_id, locale) do update set name = excluded.name`,
        [slug, locale, name],
      );
    }
  }

  let written = 0;
  for (const post of posts) {
    const rendered = await renderMarkdown(post.markdown);

    const { rows } = await client.query<{ id: string }>(
      `insert into public.posts (slug, status, published_at, series_id, series_order)
       values ($1, $2, $3, (select id from public.series where slug = $4), $5)
       on conflict (slug) do update
         set status = excluded.status,
             published_at = excluded.published_at,
             series_id = excluded.series_id,
             series_order = excluded.series_order
       returning id`,
      [
        post.slug,
        publish ? 'published' : 'draft',
        post.publishedAt,
        post.seriesSlug,
        post.seriesOrder,
      ],
    );
    const postId = rows[0]!.id;

    const excerpt = rendered.text.slice(0, 150).trim();

    await client.query(
      `insert into public.posts_i18n
         (post_id, locale, title, excerpt, content_md, content_html, content_text, toc,
          reading_time_min, word_count)
       values ($1, 'zh-TW', $2, $3, $4, $5, $6, $7, $8, $9)
       on conflict (post_id, locale) do update
         set title = excluded.title, excerpt = excluded.excerpt,
             content_md = excluded.content_md, content_html = excluded.content_html,
             content_text = excluded.content_text, toc = excluded.toc,
             reading_time_min = excluded.reading_time_min, word_count = excluded.word_count`,
      [
        postId,
        post.title,
        excerpt,
        post.markdown,
        rendered.html,
        rendered.text,
        JSON.stringify(rendered.toc),
        rendered.readingTimeMin,
        rendered.wordCount,
      ],
    );

    for (const categorySlug of post.categorySlugs) {
      await client.query(
        `insert into public.post_categories (post_id, category_id, is_primary)
         select $1, id, $3 from public.categories where slug = $2
         on conflict (post_id, category_id) do update set is_primary = excluded.is_primary`,
        [postId, categorySlug, categorySlug === post.primaryCategory],
      );
    }

    for (const name of post.tagNames) {
      const slug = name
        .toLowerCase()
        .replace(/\./g, '')
        .replace(/[^a-z0-9一-鿿]+/g, '-')
        .replace(/^-+|-+$/g, '');
      await client.query(
        `insert into public.post_tags (post_id, tag_id)
         select $1, id from public.tags where slug = $2
         on conflict do nothing`,
        [postId, slug],
      );
    }

    written += 1;
    if (rendered.issues.length > 0) {
      console.log(`  ⚠ ${post.title}：${rendered.issues.length} 個指令語法問題`);
    }
  }

  await client.query('commit');
  console.log(`\n完成：寫入 ${written} 篇，狀態 ${publish ? 'published' : 'draft'}。`);

  if (!publish) {
    console.log('依規格 §8.2.1 匯入先進草稿。確認內容後批次發佈：');
    console.log("  psql \"…\" -c \"update public.posts set status='published' where status='draft'\"");
  }
} catch (error) {
  await client.query('rollback');
  console.error('\n匯入失敗，已 rollback：', error);
  process.exitCode = 1;
} finally {
  await client.end();
}
