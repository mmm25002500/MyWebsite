-- 排程工作。
-- 規格 §5.2：不使用 Vercel Cron，全部跑在資料庫內。
--
-- pg_cron 需要超級使用者，且在 Supabase 只能裝在 postgres 資料庫。
-- 本機 `supabase start` 的環境不一定具備，因此整段包在例外處理內：
-- 失敗時只發出提示，不讓 migration 中斷。啟用方式為 Supabase Dashboard →
-- Database → Extensions → pg_cron。

do $$
begin
  create extension if not exists pg_cron;
exception
  when others then
    raise notice 'pg_cron 無法在此環境啟用（%），請於 Supabase Dashboard 開啟後重跑本檔。', sqlerrm;
    return;
end;
$$;

do $$
begin
  if not exists (select 1 from pg_extension where extname = 'pg_cron') then
    raise notice '略過排程設定：pg_cron 尚未啟用。';
    return;
  end if;

  -- 已存在時先移除，讓這份 migration 可重複套用。
  perform cron.unschedule(jobid)
     from cron.job
    where jobname in ('rotate-analytics-salt', 'rollup-analytics', 'prune-analytics');

  -- 每日 00:00 輪替分析用的雜湊鹽
  perform cron.schedule(
    'rotate-analytics-salt',
    '0 0 * * *',
    $cron$ select public.rotate_analytics_salt(); $cron$
  );

  -- 每日 00:10 彙總前一日流量
  perform cron.schedule(
    'rollup-analytics',
    '10 0 * * *',
    $cron$ select public.rollup_analytics(current_date - 1); $cron$
  );

  -- 每週日 03:30 清除 90 天前的原始事件
  perform cron.schedule(
    'prune-analytics',
    '30 3 * * 0',
    $cron$ select public.prune_analytics(90); $cron$
  );
end;
$$;
