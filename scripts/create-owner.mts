/**
 * 建立站長帳號（規格 §5.3：owner 由 seed 指定，不可經 UI 降級或刪除）。
 *
 *   pnpm admin:create-owner -- --email you@example.com
 *
 * 密碼從 OWNER_PASSWORD 環境變數讀取，未提供時互動輸入且不回顯——
 * 命令列參數會留在 shell 歷史與 ps 的輸出裡。
 *
 * 直接寫入 auth.users 而非走註冊流程，原因是註冊需要收驗證信，
 * 而第一個帳號在信件服務設定好之前就得能登入。密碼以 pgcrypto 的
 * bcrypt 雜湊，與 Supabase Auth 使用的格式相同。
 *
 * 已存在同 email 的帳號時只補上 owner 角色，不覆寫密碼。
 */
import { randomUUID } from 'node:crypto';

import { Client } from 'pg';

const args = process.argv.slice(2);
const valueOf = (flag: string): string | undefined => {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
};

const email = valueOf('--email');
const displayName = valueOf('--name') ?? 'Owner';

if (!email) {
  console.error(
    "用法：pnpm admin:create-owner -- --email <email> [--name <暱稱>]\n" +
      "密碼請以 OWNER_PASSWORD 環境變數提供，或在提示時輸入。",
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

const password = await readPassword('OWNER_PASSWORD');

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
  await client.query('begin');

  const existing = await client.query<{ id: string }>(
    'select id from auth.users where email = $1',
    [email],
  );

  let userId = existing.rows[0]?.id;

  if (userId) {
    console.log(`帳號已存在（${email}），只更新角色。`);
  } else {
    userId = randomUUID();

    await client.query(
      `insert into auth.users (
         instance_id, id, aud, role, email, encrypted_password,
         email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
         created_at, updated_at,
         -- GoTrue 會把這些欄位讀成字串，值為 NULL 時登入會直接失敗，
         -- 因此一律給空字串而不是留空。
         confirmation_token, recovery_token, email_change_token_new,
         email_change, email_change_token_current, reauthentication_token
       ) values (
         '00000000-0000-0000-0000-000000000000', $1::uuid, 'authenticated', 'authenticated',
         $2::text, extensions.crypt($3::text, extensions.gen_salt('bf')),
         now(), '{"provider":"email","providers":["email"]}'::jsonb,
         jsonb_build_object('display_name', $4::text),
         now(), now(),
         '', '', '', '', '', ''
       )`,
      [userId, email, password, displayName],
    );

    // 密碼登入需要一筆對應的 identity，否則 Supabase Auth 找不到 provider。
    // provider_id 是 text 而 user_id 是 uuid，因此使用者 id 分成兩個參數傳，
    // 同一個 $n 同時被推導成兩種型別會被 Postgres 拒絕。
    await client.query(
      // email 是產生欄位（由 identity_data ->> 'email' 推導），不可直接寫入。
      `insert into auth.identities (
         id, user_id, provider_id, identity_data, provider,
         last_sign_in_at, created_at, updated_at
       ) values (
         gen_random_uuid(), $1::uuid, $3::text,
         jsonb_build_object('sub', $3::text, 'email', $2::text, 'email_verified', true),
         'email', now(), now(), now()
       )`,
      [userId, email, userId],
    );

    console.log(`已建立帳號 ${email}`);
  }

  // handle_new_user trigger 會建立 profile，這裡確保角色是 owner。
  await client.query(
    `insert into public.profiles (user_id, role, display_name)
     values ($1, 'owner', $2)
     on conflict (user_id) do update set role = 'owner', display_name = excluded.display_name`,
    [userId, displayName],
  );

  await client.query('commit');
  console.log(`角色：owner，暱稱：${displayName}`);
  console.log('現在可以到 /admin/login 登入。');
} catch (error) {
  await client.query('rollback');
  console.error('建立失敗：', error);
  process.exitCode = 1;
} finally {
  await client.end();
}
