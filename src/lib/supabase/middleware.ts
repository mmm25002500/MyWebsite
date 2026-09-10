import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { NextRequest, NextResponse } from 'next/server';

import { hasSupabase, supabaseAnonKey, supabaseUrl } from '@/lib/env';

/**
 * 在 middleware 內刷新 Supabase session，並把更新後的 cookie 寫回 response。
 * 回傳目前登入者的角色（未登入為 null），供後台路由守衛使用。
 */
export async function refreshSession(
  request: NextRequest,
  response: NextResponse,
  options: { withRole?: boolean } = {},
): Promise<{ userId: string | null; role: string | null }> {
  if (!hasSupabase) return { userId: null, role: null };

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { userId: null, role: null };

  /*
   * 角色只有後台守衛用得到，因此預設不查——前台每一個請求都多打一次
   * Supabase 是白付的往返，登入者的每次換頁會因此慢上一百多毫秒。
   *
   * 查的時候改問 auth_role()：profiles.role 已收回 authenticated 的讀取權。
   */
  if (!options.withRole) return { userId: user.id, role: null };

  const { data: role } = await supabase.rpc('auth_role');

  return { userId: user.id, role: role ?? null };
}
