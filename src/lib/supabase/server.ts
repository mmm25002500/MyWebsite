import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

import { supabaseAnonKey, supabaseUrl } from '@/lib/env';
import type { Database } from '@/types/database';

/**
 * Server Component / Server Action 用的 client。帶 anon key，權限由 RLS 決定。
 * 只在需要使用者 session 的地方使用；純公開讀取請用 `createPublicClient()`，
 * 它不碰 cookies，因此不會讓頁面退出靜態快取。
 */
export async function createServerSupabase() {
  const cookieStore = await cookies();

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // 在 Server Component 內呼叫時無法寫 cookie，session 更新交給 middleware。
        }
      },
    },
  });
}
