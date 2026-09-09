import { SeriesManager } from '@/components/admin/taxonomy-pages';
import { getAdminSeries } from '@/lib/data/queries/admin';

export const dynamic = 'force-dynamic';
export const metadata = { title: '系列' };

export default async function AdminSeriesPage() {
  const rows = await getAdminSeries();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[28px] font-bold">系列</h1>
        <p className="mt-1.5 text-[15px] text-ink-70">共 {rows.length} 筆</p>
      </div>
      <SeriesManager rows={rows} />
    </div>
  );
}
