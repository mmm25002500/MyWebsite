import { CategoriesManager } from '@/components/admin/taxonomy-pages';
import { getAdminCategories } from '@/lib/data/queries/admin';

export const dynamic = 'force-dynamic';
export const metadata = { title: '分類' };

export default async function AdminCategoriesPage() {
  const rows = await getAdminCategories();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[28px] font-bold">分類</h1>
        <p className="mt-1.5 text-[15px] text-ink-70">共 {rows.length} 筆</p>
      </div>
      <CategoriesManager rows={rows} />
    </div>
  );
}
