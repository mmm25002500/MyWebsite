import { notFound } from 'next/navigation';

import { ProjectForm } from '@/components/admin/project-form';
import { getAdminSession } from '@/lib/auth/session';
import { getAdminProject, getProjectFormOptions } from '@/lib/data/queries/admin';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await getAdminProject(id);
  return { title: project?.contents[0]?.name ?? '編輯作品' };
}

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [project, options, session] = await Promise.all([
    getAdminProject(id),
    getProjectFormOptions(),
    getAdminSession(),
  ]);

  if (!project) notFound();
  return <ProjectForm project={project} options={options} canDelete={session?.role === 'owner'} />;
}
