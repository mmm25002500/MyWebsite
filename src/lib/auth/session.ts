import 'server-only';

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
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  const supabase = await createServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // profiles.role 已不對 authenticated 開放讀取（欄位級授權），改問
  // auth_role()——security definer，只回傳呼叫者自己的角色。
  const { data: role } = await supabase.rpc('auth_role');
  if (!role || !isRole(role) || !atLeast(role, 'editor')) return null;

  const { data } = await supabase
    .from('profiles')
    .select('display_name, avatar_url')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!data) return null;

  return {
    user,
    role,
    displayName: data.display_name,
    avatarUrl: data.avatar_url,
  };
}

/** 在 Server Action 內取用：權限不足直接拋錯，不回傳 null 讓呼叫端忘記檢查。 */
export async function requireRole(minimum: Role): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session || !atLeast(session.role, minimum)) {
    throw new Error('FORBIDDEN');
  }
  return session;
}
