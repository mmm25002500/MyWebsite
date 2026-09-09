import { ResourceList } from '@/components/admin/resource-list';
import { getAdminOrganizations } from '@/lib/data/queries/admin';
import { formatPeriod } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const metadata = { title: '團隊' };

const statusOptions = [
  { value: 'active', label: '營運中' },
  { value: 'ended', label: '已結束' },
  { value: 'reviving', label: '重啟中' },
];

export default async function AdminOrganizationsPage() {
  const rows = await getAdminOrganizations();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[28px] font-bold">團隊</h1>
        <p className="mt-1.5 text-[15px] text-ink-70">共 {rows.length} 個</p>
      </div>

      <ResourceList
        table="organizations"
        labelField="name"
        fields={[
          { key: 'name', label: '名稱', i18n: true },
          { key: 'role', label: '我的角色', i18n: true },
          { key: 'description_md', label: '介紹', type: 'textarea', i18n: true },
          { key: 'slug', label: 'slug' },
          { key: 'status', label: '狀態', type: 'select', options: statusOptions },
          { key: 'website_url', label: '網站' },
          { key: 'github_org', label: 'GitHub 組織' },
          { key: 'started_at', label: '開始', type: 'date' },
          { key: 'ended_at', label: '結束', type: 'date' },
          { key: 'sort_order', label: '排序', type: 'number' },
          { key: 'is_visible', label: '在前台顯示', type: 'checkbox' },
        ]}
        rows={rows.map((row) => ({
          id: row.id,
          values: {
            slug: row.slug,
            status: row.status,
            website_url: row.website_url,
            github_org: row.github_org,
            started_at: row.started_at,
            ended_at: row.ended_at,
            sort_order: row.sort_order,
            is_visible: row.is_visible,
          },
          i18n: Object.fromEntries(
            row.organizations_i18n.map((item) => [
              item.locale,
              { name: item.name, role: item.role, description_md: item.description_md },
            ]),
          ),
          summary: (
            <>
              <p className="font-bold">
                {row.organizations_i18n.find((i) => i.locale === 'zh-TW')?.name ?? row.slug}
              </p>
              <p className="text-[14px] text-ink-70">
                {row.organizations_i18n.find((i) => i.locale === 'zh-TW')?.role} ·{' '}
                {formatPeriod(row.started_at, row.ended_at, '至今')} ·{' '}
                {statusOptions.find((o) => o.value === row.status)?.label}
                {!row.is_visible ? ' · 未顯示' : ''}
              </p>
            </>
          ),
        }))}
      />
    </div>
  );
}
