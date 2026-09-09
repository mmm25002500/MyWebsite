/**
 * 角色定義與比較。
 *
 * 這個模組刻意**不 import 任何 server-only 的東西**：側欄與指令面板等
 * Client Component 需要用它判斷「這個角色看得到哪些模組」，
 * 取得 session 的部分放在 `./session.ts`。
 */
export const roles = ['user', 'editor', 'admin', 'owner'] as const;
export type Role = (typeof roles)[number];

/** 角色層級。數字越大權限越高，用來做「至少要 X 角色」的比較。 */
const rank: Record<Role, number> = { user: 0, editor: 1, admin: 2, owner: 3 };

export function atLeast(role: Role | null, minimum: Role): boolean {
  if (!role) return false;
  return rank[role] >= rank[minimum];
}

export function isRole(value: string): value is Role {
  return (roles as readonly string[]).includes(value);
}

export const roleLabels: Record<Role, string> = {
  user: '使用者',
  editor: '編輯',
  admin: '管理員',
  owner: '站長',
};
