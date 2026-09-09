-- 自建流量分析。
-- 規格 §6.10、§11。

-- 每日輪替的雜湊鹽。訪客雜湊因此無法跨日對應到同一個人（規格 §11.2）。
create table public.analytics_salt (
  date date primary key,
  salt text not null
);

create table public.analytics_events (
  id              bigserial primary key,
  session_id      text not null,
  visitor_hash    text not null,   -- sha256(ip + ua + 當日鹽)
  path            text not null,
  page_type       text,
  entity_id       uuid,
  locale          text,
  referrer        text,
  referrer_source text,
  referrer_domain text,
  utm_source      text,
  utm_medium      text,
  utm_campaign    text,
  device_type     text,
  browser         text,
  browser_version text,
  os              text,
  os_version      text,
  screen_w        int,
  screen_h        int,
  country         text,
  city            text,
  duration_sec    int,
  is_bounce       boolean,
  created_at      timestamptz not null default now()
);

create index analytics_events_created_idx on public.analytics_events (created_at desc);
create index analytics_events_path_idx on public.analytics_events (path, created_at desc);
create index analytics_events_session_idx on public.analytics_events (session_id);

-- 每日彙總（永久保存，體積極小）
create table public.analytics_daily (
  date             date not null,
  path             text not null,
  page_type        text,
  views            int not null default 0,
  uniques          int not null default 0,
  sessions         int not null default 0,
  avg_duration_sec numeric,
  bounce_rate      numeric,
  primary key (date, path)
);

create table public.analytics_daily_dimensions (
  date      date not null,
  dimension text not null,
  value     text not null,
  views     int not null default 0,
  uniques   int not null default 0,
  primary key (date, dimension, value)
);

-- ---------------------------------------------------------------------------
-- 取得（必要時建立）當日的鹽
-- ---------------------------------------------------------------------------
create or replace function public.current_analytics_salt()
returns text
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_salt text;
begin
  select salt into v_salt from public.analytics_salt where date = current_date;

  if v_salt is null then
    v_salt := encode(gen_random_bytes(32), 'hex');
    insert into public.analytics_salt (date, salt)
    values (current_date, v_salt)
    on conflict (date) do nothing;

    select salt into v_salt from public.analytics_salt where date = current_date;
  end if;

  return v_salt;
end;
$$;

create or replace function public.rotate_analytics_salt()
returns void
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
begin
  insert into public.analytics_salt (date, salt)
  values (current_date, encode(gen_random_bytes(32), 'hex'))
  on conflict (date) do nothing;

  -- 只留最近 3 天，舊的鹽沒有用途且留著只會擴大風險。
  delete from public.analytics_salt where date < current_date - 3;
end;
$$;

-- ---------------------------------------------------------------------------
-- 收 pageview
--
-- IP 只在函式內用於計算雜湊，不寫入任何欄位（規格 §13.6）。
-- ---------------------------------------------------------------------------
create or replace function public.record_pageview(
  p_session_id      text,
  p_ip              text,
  p_user_agent      text,
  p_path            text,
  p_page_type       text default 'other',
  p_entity_id       uuid default null,
  p_locale          text default null,
  p_referrer        text default null,
  p_referrer_source text default null,
  p_referrer_domain text default null,
  p_utm_source      text default null,
  p_utm_medium      text default null,
  p_utm_campaign    text default null,
  p_device_type     text default 'desktop',
  p_browser         text default null,
  p_browser_version text default null,
  p_os              text default null,
  p_os_version      text default null,
  p_screen_w        int default null,
  p_screen_h        int default null,
  p_country         text default null,
  p_city            text default null
)
returns void
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
begin
  -- Bot 不計入統計（規格 §11.2）。
  if p_device_type = 'bot' then
    return;
  end if;

  insert into public.analytics_events (
    session_id, visitor_hash, path, page_type, entity_id, locale,
    referrer, referrer_source, referrer_domain,
    utm_source, utm_medium, utm_campaign,
    device_type, browser, browser_version, os, os_version,
    screen_w, screen_h, country, city
  )
  values (
    p_session_id,
    encode(digest(p_ip || '|' || p_user_agent || '|' || public.current_analytics_salt(), 'sha256'), 'hex'),
    p_path, p_page_type, p_entity_id, p_locale,
    p_referrer, p_referrer_source, p_referrer_domain,
    p_utm_source, p_utm_medium, p_utm_campaign,
    p_device_type, p_browser, p_browser_version, p_os, p_os_version,
    p_screen_w, p_screen_h, p_country, p_city
  );
end;
$$;

-- 回報停留時間（sendBeacon）
create or replace function public.record_duration(
  p_session_id   text,
  p_path         text,
  p_duration_sec int
)
returns void
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
begin
  update public.analytics_events
     set duration_sec = p_duration_sec
   where id = (
     select id
       from public.analytics_events
      where session_id = p_session_id
        and path = p_path
      order by created_at desc
      limit 1
   );
end;
$$;

-- ---------------------------------------------------------------------------
-- 每日彙總與清理（由 pg_cron 呼叫，規格 §5.2）
-- ---------------------------------------------------------------------------
create or replace function public.rollup_analytics(p_date date)
returns void
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
begin
  -- 跳出率定義：一個 session 只有 1 筆 pageview 且 duration < 10 秒（§11.3）。
  insert into public.analytics_daily (
    date, path, page_type, views, uniques, sessions, avg_duration_sec, bounce_rate
  )
  select
    p_date,
    e.path,
    min(e.page_type),
    count(*),
    count(distinct e.visitor_hash),
    count(distinct e.session_id),
    avg(e.duration_sec),
    avg(case when b.is_bounce then 1 else 0 end)
  from public.analytics_events e
  left join (
    select session_id,
           count(*) = 1 and max(coalesce(duration_sec, 0)) < 10 as is_bounce
      from public.analytics_events
     where created_at >= p_date and created_at < p_date + 1
     group by session_id
  ) b on b.session_id = e.session_id
  where e.created_at >= p_date and e.created_at < p_date + 1
  group by e.path
  on conflict (date, path) do update
    set views            = excluded.views,
        uniques          = excluded.uniques,
        sessions         = excluded.sessions,
        avg_duration_sec = excluded.avg_duration_sec,
        bounce_rate      = excluded.bounce_rate;

  -- 各維度彙總
  insert into public.analytics_daily_dimensions (date, dimension, value, views, uniques)
  select p_date, d.dimension, d.value, count(*), count(distinct e.visitor_hash)
    from public.analytics_events e
    cross join lateral (
      values
        ('device', e.device_type),
        ('browser', e.browser),
        ('os', e.os),
        ('country', e.country),
        ('city', e.city),
        ('referrer_source', e.referrer_source),
        ('locale', e.locale)
    ) as d(dimension, value)
   where e.created_at >= p_date
     and e.created_at < p_date + 1
     and d.value is not null
   group by d.dimension, d.value
  on conflict (date, dimension, value) do update
    set views   = excluded.views,
        uniques = excluded.uniques;
end;
$$;

create or replace function public.prune_analytics(p_days int default 90)
returns void
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
begin
  delete from public.analytics_events
   where created_at < now() - make_interval(days => p_days);
end;
$$;
