import { ProjectForm } from '@/components/admin/project-form';
import { getAdminSession } from '@/lib/auth/session';
import { getProjectFormOptions } from '@/lib/data/queries/admin';

export const dynamic = 'force-dynamic';
export const metadata = { title: '新作品' };

export default async function NewProjectPage() {
  const [options, session] = await Promise.all([getProjectFormOptions(), getAdminSession()]);
  return <ProjectForm project={null} options={options} canDelete={session?.role === 'owner'} />;
}
