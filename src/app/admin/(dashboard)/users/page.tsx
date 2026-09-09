import { UserManager } from '@/components/admin/user-manager';
import { getAdminSession } from '@/lib/auth/session';
import { getAdminUsers } from '@/lib/data/queries/admin';

export const dynamic = 'force-dynamic';
export const metadata = { title: '使用者' };

export default async function AdminUsersPage() {
  const [users, session] = await Promise.all([getAdminUsers(), getAdminSession()]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[28px] font-bold">使用者</h1>
        <p className="mt-1.5 text-[15px] text-ink-70">共 {users.length} 位</p>
      </div>
      <UserManager users={users} isOwner={session?.role === 'owner'} />
    </div>
  );
}
