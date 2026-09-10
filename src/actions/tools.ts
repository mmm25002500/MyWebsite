'use server';

import { revalidateTag } from 'next/cache';

import { writeAuditLog } from '@/lib/audit';
import { requireRole } from '@/lib/auth/session';
import { cacheTags } from '@/lib/data/cache';
import { createServiceClient } from '@/lib/supabase/service';

export interface ToolResult {
  ok: boolean;
  message: string;
}

/** 手動清除快取（規格 §8.8 /admin/tools）。 */
export async function revalidateAll(): Promise<ToolResult> {
  await requireRole('admin');

  for (const tag of Object.values(cacheTags)) {
    if (typeof tag === 'string') revalidateTag(tag);
  }

  await writeAuditLog({ action: 'tools.revalidate', entityType: 'system', severity: 'warning' });
  return { ok: true, message: '已清除所有快取' };
}

/**
 * 手動觸發 pg_cron 的工作（規格 §5.2：以防排程失效）。
 *
 * 白名單限定三支函式，不接受任意 SQL。
 */
const cronJobs = {
  rotate_analytics_salt: '輪替分析用的雜湊鹽',
  rollup_analytics: '彙總前一日流量',
  prune_analytics: '清除 90 天前的原始事件',
} as const;

export type CronJob = keyof typeof cronJobs;

export async function runCronJob(job: CronJob): Promise<ToolResult> {
  await requireRole('admin');

  if (!(job in cronJobs)) return { ok: false, message: '不允許執行這個工作' };

  // 這幾支函式已經收回 anon／authenticated 的執行權（會清空或改寫分析資料），
  // 只剩 service_role 進得去；授權由上面的 requireRole('admin') 負責。
  const supabase = createServiceClient();

  const args =
    job === 'rollup_analytics'
      ? { p_date: new Date(Date.now() - 86400000).toISOString().slice(0, 10) }
      : job === 'prune_analytics'
        ? { p_days: 90 }
        : {};

  const { error } = await supabase.rpc(job, args as never);
  if (error) return { ok: false, message: `執行失敗：${error.message}` };

  await writeAuditLog({
    action: `tools.cron.${job}`,
    entityType: 'system',
    entityLabel: cronJobs[job],
    severity: 'warning',
  });

  return { ok: true, message: `已執行：${cronJobs[job]}` };
}

/** 檢查 pg_cron 的排程狀態。 */
export async function getCronStatus(): Promise<
  { ok: true; jobs: { name: string; schedule: string }[] } | { ok: false; message: string }
> {
  await requireRole('admin');

  const supabase = createServiceClient();
  const { data, error } = await supabase.rpc('list_cron_jobs' as never);

  if (error) {
    return { ok: false, message: '無法讀取排程狀態（可能是 pg_cron 未啟用或缺少查詢函式）' };
  }

  return { ok: true, jobs: (data ?? []) as { name: string; schedule: string }[] };
}
