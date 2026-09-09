import Link from 'next/link';

import { GithubImportPanel } from '@/components/admin/github-import';
import { Button } from '@/components/ui/button';
import { getAdminProjects } from '@/lib/data/queries/admin';
import { cn, formatPeriod } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const metadata = { title: '作品集' };

const statusLabels: Record<string, string> = {
  idea: '構想中',
  in_progress: '進行中',
  completed: '已完成',
  maintained: '維護中',
  archived: '已封存',
};

export default async function AdminProjectsPage() {
  const rows = await getAdminProjects();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <div>
          <h1 className="text-[28px] font-bold">作品集</h1>
          <p className="mt-1.5 text-[15px] text-ink-70">共 {rows.length} 個</p>
        </div>
        <div className="ml-auto flex gap-2">
          <GithubImportPanel />
          <Button as={Link} href="/admin/projects/new">
            新增作品
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-divider">
        <table className="w-full min-w-[820px] border-collapse text-[15px]">
          <thead>
            <tr className="border-b border-divider bg-surface text-left">
              <th className="px-3 py-2.5 font-bold">名稱</th>
              <th className="px-3 py-2.5 font-bold">期間</th>
              <th className="px-3 py-2.5 font-bold">狀態</th>
              <th className="px-3 py-2.5 font-bold">分類</th>
              <th className="px-3 py-2.5 text-right font-bold">圖片</th>
              <th className="px-3 py-2.5 font-bold">顯示</th>
              <th className="px-3 py-2.5 font-bold">語言</th>
              <th className="px-3 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-ink-8 last:border-0 hover:bg-ink-4">
                <td className="px-3 py-2.5">
                  <Link href={`/admin/projects/${row.id}`} className="font-bold text-text hover:text-accent">
                    {row.name}
                  </Link>
                  <div className="mt-0.5 text-[13px] text-ink-70">
                    /{row.slug}
                    {row.isFeatured ? <span className="ml-2 text-accent-700">精選</span> : null}
                  </div>
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 text-ink-70">
                  {formatPeriod(row.startedAt, row.endedAt, '至今')}
                </td>
                <td className="px-3 py-2.5 text-ink-70">{statusLabels[row.status] ?? row.status}</td>
                <td className="px-3 py-2.5 text-ink-70">{row.categoryName ?? '—'}</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-ink-70">{row.imageCount}</td>
                <td className="px-3 py-2.5">
                  <span className={cn(row.isVisible ? 'text-text' : 'text-ink-45')}>
                    {row.isVisible ? '是' : '否'}
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  <span className={row.locales.includes('zh-TW') ? 'text-text' : 'text-ink-45'}>中</span>
                  <span className="mx-1 text-ink-45">/</span>
                  <span className={row.locales.includes('en') ? 'text-text' : 'text-ink-45'}>EN</span>
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 text-right">
                  <a href={`/projects/${row.slug}`} target="_blank" rel="noreferrer" className="text-[14px] text-ink-70 hover:text-accent">
                    前台檢視
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
