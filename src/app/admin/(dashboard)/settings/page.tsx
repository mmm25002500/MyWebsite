import { SettingsForm } from '@/components/admin/settings-form';
import { getAdminSession } from '@/lib/auth/session';
import { requireRole } from '@/lib/auth/session';
import { createServerSupabase } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const metadata = { title: '設定' };

export default async function AdminSettingsPage() {
  await requireRole('admin');
  const session = await getAdminSession();

  const supabase = await createServerSupabase();
  const { data } = await supabase.from('site_settings').select('key, value');
  const initial = Object.fromEntries((data ?? []).map((row) => [row.key, row.value]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[28px] font-bold">設定</h1>
        <p className="mt-1.5 text-[15px] text-ink-70">站台的一般設定與顯示開關。</p>
      </div>
      <SettingsForm initial={initial} canEdit={session?.role === 'owner'} />
    </div>
  );
}
