import { ResourceList } from '@/components/admin/resource-list';
import { getAdminSponsors } from '@/lib/data/queries/admin';

export const dynamic = 'force-dynamic';
export const metadata = { title: '贊助' };

export default async function AdminSponsorsPage() {
  const { methods, sponsors } = await getAdminSponsors();

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <div>
          <h1 className="text-[28px] font-bold">贊助方式</h1>
          <p className="mt-1.5 text-[15px] text-ink-70">
            加密貨幣地址請確認網路別；填空的方式在前台會顯示為「目前沒有內容」。
          </p>
        </div>

        <ResourceList
          table="sponsor_methods"
          labelField="label"
          fields={[
            { key: 'label', label: '名稱', i18n: true },
            { key: 'note', label: '說明', type: 'textarea', i18n: true },
            { key: 'key', label: '識別鍵' },
            {
              key: 'type',
              label: '類型',
              type: 'select',
              options: [
                { value: 'crypto', label: '加密貨幣' },
                { value: 'link', label: '外部連結' },
              ],
            },
            { key: 'address_or_url', label: '地址或網址' },
            { key: 'network', label: '網路' },
            { key: 'qr_image_url', label: 'QR 圖網址' },
            { key: 'sort_order', label: '排序', type: 'number' },
            { key: 'is_visible', label: '在前台顯示', type: 'checkbox' },
          ]}
          rows={methods.map((row) => ({
            id: row.id,
            values: {
              key: row.key,
              type: row.type,
              address_or_url: row.address_or_url,
              network: row.network,
              qr_image_url: row.qr_image_url,
              sort_order: row.sort_order,
              is_visible: row.is_visible,
            },
            i18n: Object.fromEntries(
              row.sponsor_methods_i18n.map((item) => [
                item.locale,
                { label: item.label, note: item.note },
              ]),
            ),
            summary: (
              <>
                <p className="font-bold">
                  {row.sponsor_methods_i18n.find((i) => i.locale === 'zh-TW')?.label ?? row.key}
                </p>
                <p className="break-all text-[14px] text-ink-70">
                  {row.address_or_url || '（尚未填入地址）'}
                  {row.network ? ` · ${row.network}` : ''}
                </p>
              </>
            ),
          }))}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-[22px] font-bold">贊助者名單</h2>
        <ResourceList
          table="sponsors"
          fields={[
            { key: 'display_name', label: '名稱' },
            {
              key: 'tier',
              label: '等級',
              type: 'select',
              options: [
                { value: 'bronze', label: '銅' },
                { value: 'silver', label: '銀' },
                { value: 'gold', label: '金' },
                { value: 'custom', label: '自訂' },
              ],
            },
            { key: 'amount_note', label: '金額說明' },
            { key: 'sponsored_at', label: '贊助日期', type: 'date' },
            { key: 'url', label: '連結' },
            { key: 'sort_order', label: '排序', type: 'number' },
            { key: 'is_anonymous', label: '匿名', type: 'checkbox' },
            { key: 'is_visible', label: '在前台顯示', type: 'checkbox' },
          ]}
          rows={sponsors.map((row) => ({
            id: row.id,
            values: {
              display_name: row.display_name,
              tier: row.tier,
              amount_note: row.amount_note,
              sponsored_at: row.sponsored_at,
              sort_order: row.sort_order,
              is_anonymous: row.is_anonymous,
              is_visible: row.is_visible,
            },
            i18n: {},
            summary: (
              <p className="font-bold">
                {row.is_anonymous ? '（匿名）' : row.display_name}
                {row.amount_note ? (
                  <span className="ml-3 font-normal text-ink-70">{row.amount_note}</span>
                ) : null}
              </p>
            ),
          }))}
        />
      </section>
    </div>
  );
}
