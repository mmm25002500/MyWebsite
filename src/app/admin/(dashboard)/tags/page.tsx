import { TagsManager } from '@/components/admin/taxonomy-pages';
import { getAdminTags } from '@/lib/data/queries/admin';

export const dynamic = 'force-dynamic';
export const metadata = { title: '標籤' };

export default async function AdminTagsPage() {
  const rows = await getAdminTags();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[28px] font-bold">標籤</h1>
        <p className="mt-1.5 text-[15px] text-ink-70">共 {rows.length} 筆</p>
      </div>
      <TagsManager rows={rows} />
    </div>
  );
}
