import { BarList } from '@/components/admin/bar-list';
import { StatCard } from '@/components/admin/stat-card';
import { getAnalyticsDashboard } from '@/lib/data/queries/admin';
import { formatDuration } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const metadata = { title: '流量分析' };

function Distribution({ title, rows }: { title: string; rows: [string, number][] }) {
  return (
    <section className="admin-card">
      <h2 className="admin-section-title">{title}</h2>
      <BarList rows={rows.map(([label, count]) => ({ label, count }))} />
    </section>
  );
}

export default async function AdminAnalyticsPage() {
  const data = await getAnalyticsDashboard(30);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[28px] font-bold">流量分析</h1>
        <p className="mt-1.5 text-[15px] text-ink-70">
          近 30 日。資料自建於 Supabase，無 cookie、不跨日追蹤（規格 §11）。
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="總瀏覽" value={data.totalViews} />
        <StatCard label="獨立訪客" value={data.uniqueVisitors} />
        <StatCard label="Session" value={data.sessions} />
        <StatCard label="平均停留" value={formatDuration(data.avgDuration)} />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Distribution title="熱門頁面" rows={data.byPath} />
        <Distribution title="流量來源" rows={data.bySource} />
        <Distribution title="裝置" rows={data.byDevice} />
        <Distribution title="瀏覽器" rows={data.byBrowser} />
        <Distribution title="作業系統" rows={data.byOs} />
        <Distribution title="國家" rows={data.byCountry} />
        <Distribution title="語言" rows={data.byLocale} />
      </div>
    </div>
  );
}
