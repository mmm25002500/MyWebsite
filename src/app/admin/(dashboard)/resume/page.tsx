import { ResumeManager } from '@/components/admin/resume-manager';
import { getAdminSession } from '@/lib/auth/session';
import { getAdminResume } from '@/lib/data/queries/admin';

export const dynamic = 'force-dynamic';
export const metadata = { title: '履歷' };

export default async function AdminResumePage() {
  const [data, session] = await Promise.all([getAdminResume(), getAdminSession()]);
  return <ResumeManager data={data} canEditSettings={session?.role === 'owner'} />;
}
