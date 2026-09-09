/**
 * 檢查金鑰是否外流。
 *
 *   pnpm audit:secrets
 *
 * 比對三個地方：版控歷史、目前追蹤中的檔案、瀏覽器端的建置產物。
 * 值本身一律不輸出，只回報有沒有命中。
 */
import { execFile } from 'node:child_process';
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

/** 必須永遠保密的變數。anon key 不在此列——它本來就會出現在前端，由 RLS 把關。 */
const SECRET_VARS = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_DB_PASSWORD',
  'SUPABASE_ACCESS_TOKEN',
  'TURNSTILE_SECRET_KEY',
  'RESEND_API_KEY',
  'GITHUB_TOKEN',
  'YOUTUBE_API_KEY',
  'UPSTASH_REDIS_REST_TOKEN',
  'REVALIDATE_SECRET',
  'SENTRY_DSN',
];

const secrets = SECRET_VARS.map((name) => ({ name, value: process.env[name] })).filter(
  (entry): entry is { name: string; value: string } => Boolean(entry.value && entry.value.length >= 8),
);

if (secrets.length === 0) {
  console.log('沒有可檢查的金鑰（.env.local 未設定）。');
  process.exit(0);
}

let failures = 0;
const report = (label: string, name: string, hit: boolean) => {
  console.log(`  ${hit ? '✗' : '✓'} ${label.padEnd(14)} ${name}`);
  if (hit) failures += 1;
};

// 1. git 歷史
const { stdout: history } = await execFileAsync('git', ['log', '--all', '-p'], {
  maxBuffer: 512 * 1024 * 1024,
}).catch(() => ({ stdout: '' }));

console.log('git 歷史：');
for (const secret of secrets) report('歷史', secret.name, history.includes(secret.value));

// 2. 追蹤中的檔案
const { stdout: tracked } = await execFileAsync('git', ['ls-files'], { maxBuffer: 32 * 1024 * 1024 });
const files = tracked.split('\n').filter(Boolean);

console.log('\n追蹤中的檔案：');
const trackedHits = new Set<string>();
for (const file of files) {
  let content: string;
  try {
    const info = await stat(file);
    if (info.size > 20 * 1024 * 1024) continue;
    content = await readFile(file, 'utf8');
  } catch {
    continue;
  }
  for (const secret of secrets) {
    if (content.includes(secret.value)) trackedHits.add(`${secret.name} → ${file}`);
  }
}
for (const secret of secrets) {
  report('檔案', secret.name, [...trackedHits].some((hit) => hit.startsWith(secret.name)));
}
for (const hit of trackedHits) console.log(`      ${hit}`);

// 3. 瀏覽器端的建置產物
async function walk(dir: string): Promise<string[]> {
  const out: string[] = [];
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else out.push(full);
  }
  return out;
}

// 檢查正式建置的產物；dev 的 .next 只是開發用的暫存，不會被部署。
const buildDir = process.env.NEXT_DIST_DIR || '.next-build';
const clientFiles = await walk(path.join(buildDir, 'static'));
console.log(`\n瀏覽器端建置產物（${clientFiles.length} 個檔案）：`);
if (clientFiles.length === 0) {
  console.log(`  （${buildDir} 尚未建置，先跑 pnpm build 再檢查）`);
} else {
  const bundleHits = new Set<string>();
  for (const file of clientFiles) {
    let content: string;
    try {
      content = await readFile(file, 'utf8');
    } catch {
      continue;
    }
    for (const secret of secrets) {
      if (content.includes(secret.value)) bundleHits.add(`${secret.name} → ${file}`);
    }
  }
  for (const secret of secrets) {
    report('bundle', secret.name, [...bundleHits].some((hit) => hit.startsWith(secret.name)));
  }
  for (const hit of bundleHits) console.log(`      ${hit}`);
}

console.log(failures === 0 ? '\n沒有外流。' : `\n有 ${failures} 項外流，請立即輪替該金鑰。`);
process.exit(failures === 0 ? 0 : 1);
