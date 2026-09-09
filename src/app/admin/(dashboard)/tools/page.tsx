import { ToolsPanel } from '@/components/admin/tools-panel';
import { requireRole } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';
export const metadata = { title: '工具' };

export default async function AdminToolsPage() {
  await requireRole('admin');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[28px] font-bold">工具</h1>
        <p className="mt-1.5 text-[15px] text-ink-70">維運操作。</p>
      </div>
      <ToolsPanel />
    </div>
  );
}
