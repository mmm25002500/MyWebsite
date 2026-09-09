import Link from 'next/link';

import { getAuditLogs } from '@/lib/data/queries/admin';
import { cn, formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const metadata = { title: '操作紀錄' };

const severityLabels: Record<string, string> = {
  info: '一般',
  warning: '注意',
  critical: '重要',
};

const severityStyles: Record<string, string> = {
  info: 'bg-neutral-100 text-neutral-800',
  warning: 'bg-accent-100 text-accent-800',
  critical: 'bg-accent-2-100 text-accent-2-800',
};

export default async function AdminLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ severity?: string; action?: string }>;
}) {
  const query = await searchParams;
  const logs = await getAuditLogs(query);

  const filters: [string | undefined, string][] = [
    [undefined, '全部'],
    ['critical', '僅重要'],
    ['warning', '注意'],
    ['info', '一般'],
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[28px] font-bold">操作紀錄</h1>
        <p className="mt-1.5 text-[15px] text-ink-70">
          最近 {logs.length} 筆。紀錄不可修改或刪除（規格 §15.2）。
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map(([value, text]) => (
          <Link
            key={text}
            href={value ? `/admin/logs?severity=${value}` : '/admin/logs'}
            className={cn(
              'rounded-md px-2.5 py-1 text-[14px] transition-colors',
              (query.severity ?? undefined) === value
                ? 'bg-accent font-bold text-bg'
                : 'text-text hover:bg-ink-8',
            )}
          >
            {text}
          </Link>
        ))}
      </div>

      {logs.length === 0 ? (
        <p className="rounded-lg border border-divider py-16 text-center text-[15px] text-ink-70">
          沒有符合條件的紀錄
        </p>
      ) : null}

      <ul className="space-y-2">
        {logs.map((log) => (
          <li key={log.id} className="rounded-lg border border-divider bg-surface p-3.5">
            <div className="flex flex-wrap items-baseline gap-2.5">
              <span className="tabular-nums text-[14px] text-ink-70">
                {formatDate(log.createdAt, 'zh-TW', {
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
              <span className="font-bold">{log.action}</span>
              {log.entityLabel ? <span className="text-ink-70">{log.entityLabel}</span> : null}
              <span
                className={cn(
                  'ml-auto rounded-sm px-2 py-0.5 text-[13px]',
                  severityStyles[log.severity] ?? severityStyles.info,
                )}
              >
                {severityLabels[log.severity] ?? log.severity}
              </span>
              <span className="text-[14px] text-ink-70">{log.actorName ?? '系統'}</span>
            </div>

            {log.diff ? (
              <pre className="mt-2 overflow-x-auto rounded-md bg-bg p-2.5 text-[13px] text-ink-70">
                {JSON.stringify(log.diff, null, 2)}
              </pre>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
