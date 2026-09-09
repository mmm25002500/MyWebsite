import { CommentModeration } from '@/components/admin/comment-moderation';
import { atLeast } from '@/lib/auth/roles';
import { getAdminSession } from '@/lib/auth/session';
import { getAdminComments } from '@/lib/data/queries/admin';

export const dynamic = 'force-dynamic';
export const metadata = { title: '留言' };

export default async function AdminCommentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const [comments, session] = await Promise.all([getAdminComments(status), getAdminSession()]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[28px] font-bold">留言</h1>
        <p className="mt-1.5 text-[15px] text-ink-70">共 {comments.length} 則</p>
      </div>
      <CommentModeration
        comments={comments}
        activeStatus={status}
        canBan={atLeast(session?.role ?? null, 'admin')}
      />
    </div>
  );
}
