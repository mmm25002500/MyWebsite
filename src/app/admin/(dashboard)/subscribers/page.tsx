import { getAdminSubscribers } from '@/lib/data/queries/admin';
import { formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const metadata = { title: '訂閱者' };

export default async function AdminSubscribersPage() {
  const subscribers = await getAdminSubscribers();
  const confirmed = subscribers.filter((row) => row.confirmed).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[28px] font-bold">訂閱者</h1>
        <p className="mt-1.5 text-[15px] text-ink-70">
          共 {subscribers.length} 位，已確認 {confirmed} 位
        </p>
      </div>

      {subscribers.length === 0 ? (
        <p className="rounded-lg border border-divider py-16 text-center text-[15px] text-ink-70">
          還沒有訂閱者。訂閱功能需要設定 RESEND_API_KEY 才會寄出確認信。
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-divider">
          <table className="w-full min-w-[560px] border-collapse text-[15px]">
            <thead>
              <tr className="border-b border-divider bg-surface text-left">
                <th className="px-3 py-2.5 font-bold">Email</th>
                <th className="px-3 py-2.5 font-bold">語系</th>
                <th className="px-3 py-2.5 font-bold">狀態</th>
                <th className="px-3 py-2.5 font-bold">訂閱時間</th>
              </tr>
            </thead>
            <tbody>
              {subscribers.map((row) => (
                <tr key={row.id} className="border-b border-ink-8 last:border-0">
                  <td className="px-3 py-2.5">{row.email}</td>
                  <td className="px-3 py-2.5 text-ink-70">{row.locale}</td>
                  <td className="px-3 py-2.5 text-ink-70">
                    {row.unsubscribed_at ? '已退訂' : row.confirmed ? '已確認' : '待確認'}
                  </td>
                  <td className="px-3 py-2.5 text-ink-70">{formatDate(row.created_at, 'zh-TW')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
