import { ResourceList } from '@/components/admin/resource-list';
import { getAdminRedirects } from '@/lib/data/queries/admin';
import { formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const metadata = { title: '轉址' };

const reasonLabels: Record<string, string> = {
  slug_change: '改 slug 自動產生',
  manual: '手動新增',
  migration: '搬站',
};

export default async function AdminRedirectsPage() {
  const rows = await getAdminRedirects();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[28px] font-bold">轉址</h1>
        <p className="mt-1.5 text-[15px] text-ink-70">
          共 {rows.length} 筆。改動文章、分類、標籤或作品的 slug 時會自動新增。
        </p>
      </div>

      <ResourceList
        table="redirects"
        fields={[
          { key: 'from_path', label: '來源路徑', placeholder: '/notes/p/old' },
          { key: 'to_path', label: '目標路徑', placeholder: '/notes/p/new' },
          { key: 'status_code', label: '狀態碼', type: 'number' },
          {
            key: 'reason',
            label: '來源',
            type: 'select',
            options: Object.entries(reasonLabels).map(([value, label]) => ({ value, label })),
          },
          { key: 'is_active', label: '啟用', type: 'checkbox' },
        ]}
        rows={rows.map((row) => ({
          id: row.id,
          values: {
            from_path: row.from_path,
            to_path: row.to_path,
            status_code: row.status_code,
            reason: row.reason,
            is_active: row.is_active,
          },
          i18n: {},
          summary: (
            <>
              <p className="font-bold">
                {row.from_path} <span className="mx-2 text-ink-70">→</span> {row.to_path}
              </p>
              <p className="text-[14px] text-ink-70">
                {row.status_code} · {reasonLabels[row.reason ?? ''] ?? row.reason ?? '—'} · 命中{' '}
                {row.hit_count} 次 · {formatDate(row.created_at, 'zh-TW')}
                {!row.is_active ? ' · 已停用' : ''}
              </p>
            </>
          ),
        }))}
      />
    </div>
  );
}
