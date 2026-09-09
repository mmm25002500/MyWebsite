import { ResourceList } from '@/components/admin/resource-list';
import { getAdminChangelog } from '@/lib/data/queries/admin';
import { formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const metadata = { title: '更新日誌' };

export default async function AdminChangelogPage() {
  const rows = await getAdminChangelog();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[28px] font-bold">更新日誌</h1>
        <p className="mt-1.5 text-[15px] text-ink-70">共 {rows.length} 筆</p>
      </div>

      <ResourceList
        table="changelog_entries"
        labelField="title"
        fields={[
          { key: 'title', label: '標題', i18n: true },
          { key: 'version', label: '版本' },
          { key: 'released_at', label: '發佈日期', type: 'date' },
          { key: 'sort_order', label: '排序', type: 'number' },
          { key: 'is_visible', label: '在前台顯示', type: 'checkbox' },
        ]}
        rows={rows.map((row) => ({
          id: row.id,
          values: {
            version: row.version,
            released_at: row.released_at,
            sort_order: row.sort_order,
            is_visible: row.is_visible,
          },
          i18n: Object.fromEntries(
            row.changelog_entries_i18n.map((item) => [item.locale, { title: item.title }]),
          ),
          summary: (
            <>
              <p className="font-bold">
                <span className="mr-3 font-normal text-ink-70">{row.version}</span>
                {row.changelog_entries_i18n.find((i) => i.locale === 'zh-TW')?.title}
              </p>
              <p className="text-[14px] text-ink-70">{formatDate(row.released_at, 'zh-TW')}</p>
            </>
          ),
        }))}
      />

      <p className="text-[14px] text-ink-70">
        變更清單（items）目前需在資料庫直接編輯，之後會補上陣列欄位的編輯介面。
      </p>
    </div>
  );
}
