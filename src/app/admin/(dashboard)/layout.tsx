import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';

import { AdminShell } from '@/components/admin/admin-shell';
import { Toaster } from '@/components/ui/toaster';
import { getAdminSession } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

/**
 * 需要登入的後台頁面。
 *
 * middleware 已擋過一次；這裡再檢查一次，因為 middleware 只看得到 cookie，
 * 真正的授權要在能取得資料的地方成立（規格 §13.2）。
 */
export default async function AdminDashboardLayout({ children }: { children: ReactNode }) {
  const session = await getAdminSession();
  if (!session) redirect('/admin/login');

  return (
    <AdminShell role={session.role} displayName={session.displayName}>
      {children}
      <Toaster />
    </AdminShell>
  );
}
