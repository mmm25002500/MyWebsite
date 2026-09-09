import { ResourceList } from '@/components/admin/resource-list';
import { getAdminTimeline } from '@/lib/data/queries/admin';
import { formatYearMonth } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const metadata = { title: '時間軸' };

const typeOptions = [
  { value: 'startup', label: '創業' },
  { value: 'education', label: '求學' },
  { value: 'career', label: '工作' },
  { value: 'project', label: '專案' },
  { value: 'milestone', label: '里程碑' },
  { value: 'life', label: '生活' },
];

export default async function AdminTimelinePage() {
  const rows = await getAdminTimeline();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[28px] font-bold">時間軸</h1>
        <p className="mt-1.5 text-[15px] text-ink-70">共 {rows.length} 筆</p>
      </div>

      <ResourceList
        table="timeline_events"
        labelField="title"
        fields={[
          { key: 'title', label: '標題', i18n: true },
          { key: 'subtitle', label: '副標', i18n: true },
          { key: 'description', label: '說明', type: 'textarea', i18n: true },
          { key: 'event_date', label: '日期', type: 'date' },
          { key: 'type', label: '類型', type: 'select', options: typeOptions },
          {
            key: 'branch',
            label: '分支',
            type: 'select',
            options: [
              { value: 'up', label: '上方' },
              { value: 'down', label: '下方' },
            ],
          },
          { key: 'link_url', label: '連結' },
          { key: 'sort_order', label: '排序', type: 'number' },
          { key: 'is_milestone', label: '里程碑', type: 'checkbox' },
          { key: 'is_visible', label: '在前台顯示', type: 'checkbox' },
        ]}
        rows={rows.map((row) => ({
          id: row.id,
          values: {
            event_date: row.event_date,
            type: row.type,
            branch: row.branch,
            link_url: row.link_url,
            sort_order: row.sort_order,
            is_milestone: row.is_milestone,
            is_visible: row.is_visible,
          },
          i18n: Object.fromEntries(
            row.timeline_events_i18n.map((item) => [
              item.locale,
              { title: item.title, subtitle: item.subtitle, description: item.description },
            ]),
          ),
          summary: (
            <>
              <p className="font-bold">
                <span className="mr-3 font-normal text-ink-70">
                  {formatYearMonth(row.event_date)}
                </span>
                {row.timeline_events_i18n.find((i) => i.locale === 'zh-TW')?.title}
              </p>
              <p className="text-[14px] text-ink-70">
                {typeOptions.find((o) => o.value === row.type)?.label} ·{' '}
                {row.branch === 'up' ? '上方' : '下方'}
                {row.is_milestone ? ' · 里程碑' : ''}
                {!row.is_visible ? ' · 未顯示' : ''}
              </p>
            </>
          ),
        }))}
      />
    </div>
  );
}
