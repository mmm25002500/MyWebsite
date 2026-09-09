import { notFound } from 'next/navigation';

import { PostForm } from '@/components/admin/post-form';
import { getAdminSession } from '@/lib/auth/session';
import { getAdminPost, getPostFormOptions } from '@/lib/data/queries/admin';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await getAdminPost(id);
  return { title: post?.contents[0]?.title ?? '編輯文章' };
}

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [post, options, session] = await Promise.all([
    getAdminPost(id),
    getPostFormOptions(),
    getAdminSession(),
  ]);

  if (!post) notFound();

  return <PostForm post={post} options={options} canDelete={session?.role === 'owner'} />;
}
