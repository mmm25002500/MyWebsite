import Link from 'next/link';
import { notFound } from 'next/navigation';

import { UserDetail } from '@/components/admin/user-detail';
import { getAdminUser } from '@/lib/data/queries/admin';
import { formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const user = await getAdminUser(userId);
  return { title: user ? `使用者／${user.displayName}` : '使用者' };
}

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const user = await getAdminUser(userId);
  if (!user) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/users" className="text-[14px] text-ink-70 hover:text-accent">
          ← 使用者
        </Link>
        <h1 className="mt-1 text-[28px] font-bold">{user.displayName}</h1>
      </div>
      <UserDetail
        user={{
          ...user,
          emailConfirmedLabel: user.emailConfirmedAt
            ? formatDate(user.emailConfirmedAt, 'zh-TW')
            : null,
          bannedUntilLabel: user.bannedUntil ? formatDate(user.bannedUntil, 'zh-TW') : null,
          createdAtLabel: formatDate(user.createdAt, 'zh-TW'),
          lastSeenLabel: user.lastSeenAt ? formatDate(user.lastSeenAt, 'zh-TW') : null,
          sessions: user.sessions.map((session) => ({
            ...session,
            createdAtLabel: formatDate(session.createdAt, 'zh-TW', {
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            }),
          })),
        }}
      />
    </div>
  );
}
