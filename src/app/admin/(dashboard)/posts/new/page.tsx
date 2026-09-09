import { PostForm } from '@/components/admin/post-form';
import { getAdminSession } from '@/lib/auth/session';
import { getPostFormOptions } from '@/lib/data/queries/admin';

export const dynamic = 'force-dynamic';

export const metadata = { title: '新文章' };

export default async function NewPostPage() {
  const [options, session] = await Promise.all([getPostFormOptions(), getAdminSession()]);
  return <PostForm post={null} options={options} canDelete={session?.role === 'owner'} />;
}
