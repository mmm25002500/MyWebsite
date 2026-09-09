import { BarList } from '@/components/admin/bar-list';
import { StatCard } from '@/components/admin/stat-card';
import { TrafficChart } from '@/components/admin/sparkline';
import { getDashboard } from '@/lib/data/queries/admin';
import { formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const severityLabels: Record<string, string> = {
  info: '一般',
  warning: '注意',
  critical: '重要',
};

export default async function AdminDashboardPage() {
  const { stats, traffic, topPages, topPosts, recentAudit } = await getDashboard();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-[28px] font-bold">儀表板</h1>
        <p className="mt-1.5 text-[15px] text-ink-70">站台目前的內容與流量概況。</p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="今日瀏覽" value={stats.viewsToday} />
        <StatCard label="7 日瀏覽" value={stats.views7d} />
        <StatCard label="30 日瀏覽" value={stats.views30d} hint={`${stats.visitors30d} 位訪客`} />
        <StatCard
          label="已發佈文章"
          value={stats.publishedPosts}
          hint={`草稿 ${stats.draftPosts} 篇`}
        />
        <StatCard label="待審留言" value={stats.pendingComments} tone="attention" />
        <StatCard label="未讀聯絡訊息" value={stats.newContactMessages} tone="attention" />
        <StatCard label="作品集" value={stats.projects} />
        <StatCard label="草稿" value={stats.draftPosts} hint="匯入的文章預設為草稿" />
      </section>

      <section className="admin-card">
        <h2 className="admin-section-title">近 30 日流量</h2>
        <div className="mt-4">
          {stats.views30d === 0 ? (
            <p className="py-10 text-center text-[15px] text-ink-70">
              還沒有流量資料。前台被瀏覽後這裡就會有數字。
            </p>
          ) : (
            <TrafficChart points={traffic} />
          )}
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="admin-card">
          <h2 className="admin-section-title">熱門頁面 Top 10</h2>
          <BarList rows={topPages} />
        </section>

        <section className="admin-card">
          <h2 className="admin-section-title">熱門文章 Top 10</h2>
          <BarList rows={topPosts} />
        </section>
      </div>

      <section className="admin-card">
        <h2 className="admin-section-title">最近操作</h2>
        {recentAudit.length === 0 ? (
          <p className="py-8 text-center text-[15px] text-ink-70">尚無操作紀錄</p>
        ) : (
          <ul className="mt-4 space-y-2.5 text-[15px]">
            {recentAudit.map((entry) => (
              <li key={entry.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="tabular-nums text-ink-70">
                  {formatDate(entry.createdAt, 'zh-TW', {
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                <span className="font-bold">{entry.action}</span>
                {entry.entityLabel ? (
                  <span className="text-ink-70">{entry.entityLabel}</span>
                ) : null}
                <span className="ml-auto text-[14px] text-ink-70">
                  {entry.actorName} · {severityLabels[entry.severity] ?? entry.severity}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
