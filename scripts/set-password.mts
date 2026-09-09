/**
 * 重設後台帳號密碼。
 *
 *   pnpm admin:set-password -- --email you@example.com
 *
 * `create-owner` 對已存在的帳號只補角色、不動密碼，因此密碼打錯時用這支修。
 * 密碼從 NEW_PASSWORD 環境變數讀取，未提供時互動輸入且不回顯——
 * 命令列參數會留在 shell 歷史與 ps 的輸出裡。
 */
import { Client } from 'pg';

const args = process.argv.slice(2);
const valueOf = (flag: string): string | undefined => {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
};

const email = valueOf('--email');

if (!email) {
  console.error(
    '用法：pnpm admin:set-password -- --email <email>\n' +
      '密碼請以 NEW_PASSWORD 環境變數提供，或在提示時輸入。',
  );
  process.exit(1);
}

/**
 * 取得密碼。
 *
 * **刻意不接受命令列參數**：argv 會留在 shell 歷史，也會出現在 `ps` 的輸出中，
 * 同一台機器上的其他行程看得到。改為讀環境變數，或在互動終端機隱藏輸入。
 */
async function readPassword(envName: string): Promise<string> {
  const fromEnv = process.env[envName];
  if (fromEnv) return fromEnv;

  if (!process.stdin.isTTY) {
    console.error(
      `請以環境變數提供密碼，例如：\n  ${envName}='你的密碼' pnpm <script> -- --email you@example.com`,
    );
    process.exit(1);
  }

  const readline = await import('node:readline/promises');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  // 關閉回顯，密碼不會顯示在畫面上。
  const output = process.stdout;
  const onData = (chunk: Buffer | string) => {
    const text = chunk.toString();
    if (text !== '\r' && text !== '\n') output.write('');
  };
  process.stdin.on('data', onData);

  const answer = await rl.question('密碼（輸入時不會顯示）：');
  process.stdin.off('data', onData);
  rl.close();
  output.write('\n');

  return answer.trim();
}

const password = await readPassword('NEW_PASSWORD');

if (password.length < 10) {
  console.error('密碼至少 10 碼（規格 §13.1）。');
  process.exit(1);
}

const dbPassword = process.env.SUPABASE_DB_PASSWORD;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!dbPassword || !supabaseUrl) {
  console.error('缺少 SUPABASE_DB_PASSWORD 或 NEXT_PUBLIC_SUPABASE_URL');
  process.exit(1);
}

const ref = new URL(supabaseUrl).hostname.split('.')[0]!;
const client = new Client({
  host: `db.${ref}.supabase.co`,
  user: 'postgres',
  password: dbPassword,
  database: 'postgres',
  ssl: { rejectUnauthorized: false },
});

await client.connect();

try {
  const { rowCount } = await client.query(
    `update auth.users
        set encrypted_password = extensions.crypt($2::text, extensions.gen_salt('bf')),
            updated_at = now()
      where email = $1::text`,
    [email, password],
  );

  if (rowCount === 0) {
    console.error(`找不到帳號 ${email}`);
    process.exitCode = 1;
  } else {
    console.log(`已重設 ${email} 的密碼（長度 ${password.length}）。`);
  }
} finally {
  await client.end();
}
