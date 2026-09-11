import { ResourceList } from '@/components/admin/resource-list';
import { getAdminLinks } from '@/lib/data/queries/admin';

export const dynamic = 'force-dynamic';
export const metadata = { title: '連結樹' };

export default async function AdminLinksPage() {
  const { groups, buttons } = await getAdminLinks();

  const groupOptions = groups.map((group) => ({
    value: group.id,
    label: group.link_groups_i18n.find((i) => i.locale === 'zh-TW')?.name ?? group.key,
  }));

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <div>
          <h1 className="text-[28px] font-bold">連結樹</h1>
          <p className="mt-1.5 text-[15px] text-ink-70">
            分組 {groups.length} 個、按鈕 {buttons.length} 個
          </p>
        </div>

        <h2 className="text-[16px] font-bold">分組</h2>
        <ResourceList
          table="link_groups"
          labelField="name"
          fields={[
            { key: 'name', label: '名稱', i18n: true },
            { key: 'key', label: '識別鍵' },
            { key: 'sort_order', label: '排序', type: 'number' },
            { key: 'is_visible', label: '顯示', type: 'checkbox' },
          ]}
          rows={groups.map((row) => ({
            id: row.id,
            values: { key: row.key, sort_order: row.sort_order, is_visible: row.is_visible },
            i18n: Object.fromEntries(
              row.link_groups_i18n.map((item) => [item.locale, { name: item.name }]),
            ),
            summary: (
              <p className="font-bold">
                {row.link_groups_i18n.find((i) => i.locale === 'zh-TW')?.name ?? row.key}
              </p>
            ),
          }))}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-[16px] font-bold">按鈕</h2>
        <ResourceList
          table="link_buttons"
          labelField="label"
          fields={[
            { key: 'label', label: '標籤', i18n: true },
            { key: 'description', label: '說明', i18n: true },
            { key: 'group_id', label: '分組', type: 'select', options: groupOptions },
            { key: 'url', label: '網址' },
            { key: 'icon', label: '圖示名稱' },
            { key: 'image_url', label: '圖示圖片網址' },
            { key: 'sort_order', label: '排序', type: 'number' },
            { key: 'is_highlighted', label: '強調', type: 'checkbox' },
            { key: 'is_visible', label: '顯示', type: 'checkbox' },
          ]}
          rows={buttons.map((row) => ({
            id: row.id,
            values: {
              group_id: row.group_id,
              url: row.url,
              icon: row.icon,
              image_url: row.image_url,
              sort_order: row.sort_order,
              is_highlighted: row.is_highlighted,
              is_visible: row.is_visible,
            },
            i18n: Object.fromEntries(
              row.link_buttons_i18n.map((item) => [
                item.locale,
                { label: item.label, description: item.description },
              ]),
            ),
            summary: (
              <>
                <p className="font-bold">
                  {row.link_buttons_i18n.find((i) => i.locale === 'zh-TW')?.label ?? row.url}
                </p>
                <p className="break-all text-[14px] text-ink-70">
                  {row.url} · 點擊 {row.click_count} 次
                </p>
              </>
            ),
          }))}
        />
      </section>
    </div>
  );
}
