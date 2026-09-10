'use server';

import { createServerSupabase } from '@/lib/supabase/server';
import { supabaseUrl } from '@/lib/env';

/**
 * 清掉自己帳號裡沒完成的 TOTP 綁定。
 *
 * 取消或關掉分頁會在 Supabase 留下 unverified 的 factor，而 `listFactors()`
 * 只回傳已驗證的，前端看不到也刪不掉，久了會一直累積。管理端的 API 看得到
 * 全部，因此由伺服器端代為清理。
 *
 * 只處理「目前登入者自己的」未驗證 factor：user id 一律從 cookie session 取，
 * 不接受呼叫端指定，已驗證的則完全不碰（要解除得走前台那顆按鈕）。
 */
export async function clearUnverifiedTotpFactors(): Promise<{ removed: number }> {
  const {
    data: { user },
  } = await (await createServerSupabase()).auth.getUser();
  if (!user) return { removed: 0 };

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) return { removed: 0 };

  const headers = { apikey: serviceRoleKey, authorization: `Bearer ${serviceRoleKey}` };
  const base = `${supabaseUrl}/auth/v1/admin/users/${user.id}`;

  const response = await fetch(base, { headers, cache: 'no-store' }).catch(() => null);
  if (!response?.ok) return { removed: 0 };

  const payload = (await response.json()) as {
    factors?: { id: string; status: string }[];
  };

  let removed = 0;
  for (const factor of payload.factors ?? []) {
    if (factor.status === 'verified') continue;
    const result = await fetch(`${base}/factors/${factor.id}`, { method: 'DELETE', headers }).catch(
      () => null,
    );
    if (result?.ok) removed += 1;
  }

  return { removed };
}
