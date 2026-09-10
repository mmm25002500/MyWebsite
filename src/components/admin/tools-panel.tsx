'use client';

import { useTransition } from 'react';

import { revalidateAll, runCronJob, type CronJob } from '@/actions/tools';
import { Button } from '@/components/ui/button';
import { toast } from '@/lib/toast';

const jobs: { key: CronJob; label: string; description: string }[] = [
  {
    key: 'rotate_analytics_salt',
    label: '輪替分析鹽',
    description: '每日 00:00 自動執行。訪客雜湊因此無法跨日對應到同一個人。',
  },
  {
    key: 'rollup_analytics',
    label: '彙總前一日流量',
    description: '每日 00:10 自動執行。彙總結果永久保存，原始事件只留 90 天。',
  },
  {
    key: 'prune_analytics',
    label: '清除 90 天前的事件',
    description: '每週日 03:30 自動執行。',
  },
];

/** 維運工具（規格 §8.8）。排程正常時不需要用到，這裡是備援。 */
export function ToolsPanel() {
  const [pending, startTransition] = useTransition();

  const run = (fn: () => Promise<{ ok: boolean; message: string }>) => {
    startTransition(async () => {
      const result = await fn();
      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
    });
  };

  return (
    <div className="max-w-2xl space-y-6">
      <section className="space-y-3 rounded-lg border border-divider bg-surface p-4">
        <h2 className="admin-section-title">快取</h2>
        <p className="text-[15px] text-ink-70">
          後台儲存時會自動清除相關快取。這裡是手動全部清一次。
        </p>
        <Button size="sm" disabled={pending} onClick={() => run(revalidateAll)}>
          清除所有快取
        </Button>
      </section>

      <section className="space-y-4 rounded-lg border border-divider bg-surface p-4">
        <h2 className="admin-section-title">排程工作</h2>
        <p className="text-[15px] text-ink-70">
          這三項由資料庫的 pg_cron 自動執行（規格 §5.2），不依賴部署平台。
          以下按鈕是排程失效時的備援。
        </p>
        {jobs.map((job) => (
          <div
            key={job.key}
            className="flex flex-wrap items-baseline gap-3 border-t border-divider pt-3"
          >
            <div className="min-w-0 flex-1">
              <p className="font-bold">{job.label}</p>
              <p className="mt-0.5 text-[14px] text-ink-70">{job.description}</p>
            </div>
            <Button
              size="sm"
              variant="secondary"
              disabled={pending}
              onClick={() => run(() => runCronJob(job.key))}
            >
              立即執行
            </Button>
          </div>
        ))}
      </section>

      <section className="space-y-3 rounded-lg border border-divider bg-surface p-4">
        <h2 className="admin-section-title">匯入與匯出</h2>
        <p className="text-[15px] text-ink-70">
          舊站文章的批次匯入、圖片搬移與全站 Markdown 匯出目前以命令列腳本執行：
        </p>
        <ul className="space-y-1.5 text-[14px] text-ink-70">
          <li>
            <code className="rounded bg-bg px-1.5 py-0.5">pnpm import:legacy</code> — 匯入舊站
            Markdown
          </li>
          <li>
            <code className="rounded bg-bg px-1.5 py-0.5">pnpm import:images</code> — 把內文圖片搬進
            Storage
          </li>
          <li>
            <code className="rounded bg-bg px-1.5 py-0.5">pnpm audit:secrets</code> —
            檢查金鑰有無外流
          </li>
          <li>
            <code className="rounded bg-bg px-1.5 py-0.5">pnpm db:types</code> — 重新產生資料庫型別
          </li>
        </ul>
      </section>
    </div>
  );
}
