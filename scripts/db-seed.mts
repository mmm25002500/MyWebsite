/**
 * 對已連結的 Supabase 專案套用 `supabase/seed.sql`。
 *
 * Supabase CLI 的 `db push` 不會把 seed 帶到線上，而 seed 有二十多萬字元，
 * 貼進 Dashboard 的 SQL Editor 並不實際，因此改由這支腳本直接連資料庫執行。
 * seed 整份包在 begin/commit 內且每條 insert 都帶 on conflict do update，
 * 可以重複執行。
 *
 *   pnpm db:seed
 *
 * 憑證取自 .env.local（SUPABASE_DB_PASSWORD 與 NEXT_PUBLIC_SUPABASE_URL）。
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { Client } from 'pg';

const password = process.env.SUPABASE_DB_PASSWORD;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

if (!password || !supabaseUrl) {
  console.error('缺少 SUPABASE_DB_PASSWORD 或 NEXT_PUBLIC_SUPABASE_URL，請先設定 .env.local');
  process.exit(1);
}

const ref = new URL(supabaseUrl).hostname.split('.')[0]!;
const region = process.env.SUPABASE_DB_REGION ?? 'ap-northeast-1';

/**
 * 連線候選。直連主機在多數 Supabase 專案上只有 AAAA 紀錄，沒有 IPv4 出口的
 * 環境連不上，因此後面接兩個 session pooler（走 IPv4）作為退路。
 */
const candidates = [
  { label: 'direct', host: `db.${ref}.supabase.co`, port: 5432, user: 'postgres' },
  {
    label: 'session pooler (aws-0)',
    host: `aws-0-${region}.pooler.supabase.com`,
    port: 5432,
    user: `postgres.${ref}`,
  },
  {
    label: 'session pooler (aws-1)',
    host: `aws-1-${region}.pooler.supabase.com`,
    port: 5432,
    user: `postgres.${ref}`,
  },
];

const seedPath = path.join(process.cwd(), 'supabase', 'seed.sql');
const sql = await readFile(seedPath, 'utf8').catch(() => {
  // seed.sql 是產生物，不進版控（見 .gitignore）。
  console.error('找不到 supabase/seed.sql，請先執行 `pnpm seed:generate`。');
  process.exit(1);
});

let lastError: unknown = null;

for (const candidate of candidates) {
  const client = new Client({
    host: candidate.host,
    port: candidate.port,
    user: candidate.user,
    password,
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15_000,
    statement_timeout: 300_000,
  });

  try {
    process.stdout.write(`嘗試 ${candidate.label} (${candidate.host})… `);
    await client.connect();
    console.log('已連線');

    await client.query(sql);
    console.log('seed 套用完成。');

    const { rows } = await client.query<{ table_name: string; count: string }>(`
      select 'posts' as table_name, count(*)::text from public.posts
      union all select 'projects', count(*)::text from public.projects
      union all select 'organizations', count(*)::text from public.organizations
      union all select 'experiences', count(*)::text from public.experiences
      union all select 'timeline_events', count(*)::text from public.timeline_events
      union all select 'categories', count(*)::text from public.categories
      union all select 'tags', count(*)::text from public.tags
      union all select 'pages', count(*)::text from public.pages
      order by table_name
    `);

    for (const row of rows) {
      console.log(`  ${row.table_name.padEnd(18)} ${row.count}`);
    }

    await client.end();
    process.exit(0);
  } catch (error) {
    lastError = error;
    console.log(`失敗：${(error as Error).message}`);
    await client.end().catch(() => undefined);
  }
}

console.error('\n所有連線方式都失敗。最後一個錯誤：');
console.error(lastError);
process.exit(1);
