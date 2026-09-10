import 'server-only';

import { createClient } from '@supabase/supabase-js';

import { supabaseUrl } from '@/lib/env';
import type { Database } from '@/types/database';

let cached: ReturnType<typeof createClient<Database>> | null = null;

/**
 * service role client。
 *
 * 這把金鑰**繞過所有 RLS 與欄位授權**，因此只有兩種地方可以用它：
 *
 *   * 寫入型的 RPC（記錄瀏覽、分析、按讚、留言、稽核）——它們已經收回
 *     anon 的執行權，只剩 service_role 進得去，速率限制與登入判斷在
 *     route handler 內先做完。
 *   * 後台查詢中需要 profiles 敏感欄位的部分——呼叫端一律先過 requireRole()。
 *
 * 換句話說：授權必須在呼叫這個 client 之前就成立。回傳的資料同樣要當作
 * 「已經繞過 RLS」來看待，不可以整包丟給 Client Component。
 */
export function createServiceClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error(
      '[supabase] 未設定 SUPABASE_SERVICE_ROLE_KEY；留言、按讚、瀏覽數與後台使用者管理都需要它。',
    );
  }

  if (!cached) {
    cached = createClient<Database>(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { 'x-application-name': 'tershi-web-service' } },
    });
  }

  return cached;
}
