import { redirect } from 'next/navigation';

import { AdminLoginForm } from '@/components/admin/admin-login-form';
import { getAdminSession } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const session = await getAdminSession();
  const { next } = await searchParams;

  if (session) redirect(next && next.startsWith('/admin') ? next : '/admin');

  return (
    <div className="grid min-h-screen place-items-center bg-bg px-5 text-text">
      <div className="w-full max-w-sm">
        <p className="text-center font-heading text-[20px] font-bold tracking-[0.06em]">TSX</p>
        <p className="mt-1 text-center text-kicker uppercase text-ink-55">後台</p>
        <AdminLoginForm nextPath={next} />
      </div>
    </div>
  );
}
