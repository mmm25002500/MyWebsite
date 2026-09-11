import 'server-only';

import { cache } from 'react';
import type { User } from '@supabase/supabase-js';

import { atLeast, isRole, type Role } from '@/lib/auth/roles';
import { createServerSupabase } from '@/lib/supabase/server';

export interface AdminSession {
  user: User;
  role: Role;
  displayName: string;
  avatarUrl: string | null;
}

/**
 * 取得後台使用者。
 *
 * middleware 已經擋過一次，但規格 §13.2 要求每個 Server Action 與頁面內
 * **再檢查一次**——middleware 只看得到 cookie，真正的授權必須在資料存取端成立。
 *
 * 以 React 的 `cache()` 包起來：**去重的範圍是單一請求**，不是跨請求的快取。
 * 後台 layout 會呼叫一次、頁面的 `requireRole` 又呼叫一次，沒有去重的話同一次
 * 載入就要跑兩輪查詢。每個請求仍然實際驗證一次，§13.2 的要求不受影響。
 */
export const getAdminSession = cache(async (): Promise<AdminSession | null> => {
  const supabase = await createServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  /*
   * 角色與個人資料一起發，不要接力——兩者都只需要上面拿到的 user，互不依賴。
   *
   * profiles.role 已不對 authenticated 開放讀取（欄位級授權），角色改問
   * auth_role()——security definer，只回傳呼叫者自己的角色。
   */
  const [{ data: role }, { data }] = await Promise.all([
    supabase.rpc('auth_role'),
    supabase
      .from('profiles')
      .select('display_name, avatar_url')
      .eq('user_id', user.id)
      .maybeSingle(),
  ]);

  if (!role || !isRole(role) || !atLeast(role, 'editor')) return null;
  if (!data) return null;

  return {
    user,
    role,
    displayName: data.display_name,
    avatarUrl: data.avatar_url,
  };
});

/** 在 Server Action 內取用：權限不足直接拋錯，不回傳 null 讓呼叫端忘記檢查。 */
export async function requireRole(minimum: Role): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session || !atLeast(session.role, minimum)) {
    throw new Error('FORBIDDEN');
  }
  return session;
}
