import { notFound } from 'next/navigation';

import { PageForm } from '@/components/admin/page-form';
import { getAdminPage } from '@/lib/data/queries/admin';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return { title: `頁面／${slug}` };
}

export default async function AdminPageEditor({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await getAdminPage(slug);
  if (!page) notFound();

  return <PageForm page={page} />;
}
