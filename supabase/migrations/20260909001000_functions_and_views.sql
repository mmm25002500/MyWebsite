-- 觸發器、搜尋、公開 view 與前台呼叫的 RPC。
-- 規格 §6.13、§10。

-- ---------------------------------------------------------------------------
-- 標籤使用次數
-- ---------------------------------------------------------------------------
create or replace function public.tags_count_update()
returns trigger
language plpgsql
as $$
declare
  v_tag_id uuid := coalesce(new.tag_id, old.tag_id);
begin
  update public.tags t
     set post_count = (
           select count(*)
             from public.post_tags pt
             join public.posts p on p.id = pt.post_id
            where pt.tag_id = t.id
              and p.status = 'published'
         ),
         project_count = (
           select count(*)
             from public.project_tags prt
             join public.projects pr on pr.id = prt.project_id
            where prt.tag_id = t.id
              and pr.is_visible
         )
   where t.id = v_tag_id;

  return null;
end;
$$;

create trigger post_tags_maintain_counts
  after insert or delete on public.post_tags
  for each row execute function public.tags_count_update();

create trigger project_tags_maintain_counts
  after insert or delete on public.project_tags
  for each row execute function public.tags_count_update();

-- ---------------------------------------------------------------------------
-- 全文搜尋向量
--
-- 中文斷詞在 PostgreSQL 內建設定下無效，因此 tsvector 只負責英文與技術名詞的
-- 詞幹比對，中文的子字串命中交給 content_text 上的 pg_trgm 索引（規格 §10）。
-- ---------------------------------------------------------------------------
create or replace function public.posts_search_vector_update()
returns trigger
language plpgsql
set search_path = public, extensions, pg_temp
as $$
begin
  new.search_vector :=
      setweight(to_tsvector('simple', unaccent(coalesce(new.title, ''))), 'A')
    || setweight(to_tsvector('simple', unaccent(coalesce(new.subtitle, ''))), 'B')
    || setweight(to_tsvector('simple', unaccent(coalesce(new.excerpt, ''))), 'B')
    || setweight(to_tsvector('simple', unaccent(coalesce(new.content_text, ''))), 'C');
  return new;
end;
$$;

create trigger posts_i18n_search_vector
  before insert or update of title, subtitle, excerpt, content_text on public.posts_i18n
  for each row execute function public.posts_search_vector_update();

create or replace function public.projects_search_vector_update()
returns trigger
language plpgsql
set search_path = public, extensions, pg_temp
as $$
begin
  new.search_vector :=
      setweight(to_tsvector('simple', unaccent(coalesce(new.name, ''))), 'A')
    || setweight(to_tsvector('simple', unaccent(coalesce(new.tagline, ''))), 'B')
    || setweight(to_tsvector('simple', unaccent(coalesce(new.summary, ''))), 'B')
    || setweight(to_tsvector('simple', unaccent(coalesce(new.content_text, ''))), 'C');
  return new;
end;
$$;

create trigger projects_i18n_search_vector
  before insert or update of name, tagline, summary, content_text on public.projects_i18n
  for each row execute function public.projects_search_vector_update();

-- ---------------------------------------------------------------------------
-- 公開 view
--
-- 前台一律讀這兩個 view：分類與標籤已在 DB 端聚合成陣列，列表頁因此不需要
-- 多次往返，也不會出現同一篇文章重複列出的情況（規格 §3.1）。
-- ---------------------------------------------------------------------------
create or replace view public.v_public_posts
with (security_invoker = true)
as
select
  p.id,
  p.slug,
  i.locale,
  i.title,
  i.subtitle,
  i.excerpt,
  i.content_html,
  i.toc,
  i.reading_time_min,
  i.word_count,
  i.seo_title,
  i.seo_description,
  p.cover_url,
  p.og_image_url,
  p.published_at,
  p.updated_at,
  p.view_count,
  p.comment_count,
  p.like_count,
  p.is_pinned,
  p.is_featured,
  p.allow_comments,
  p.canonical_url,
  p.series_id,
  p.series_order,
  s.slug as series_slug,
  (
    select c.slug
      from public.post_categories pc
      join public.categories c on c.id = pc.category_id
     where pc.post_id = p.id and pc.is_primary
     limit 1
  ) as primary_category_slug,
  coalesce(
    (
      select jsonb_agg(
               jsonb_build_object('id', c.id, 'slug', c.slug, 'name', ci.name)
               order by c.sort_order
             )
        from public.post_categories pc
        join public.categories c on c.id = pc.category_id
        left join public.categories_i18n ci
               on ci.category_id = c.id and ci.locale = i.locale
       where pc.post_id = p.id and c.is_visible
    ),
    '[]'::jsonb
  ) as categories,
  coalesce(
    (
      select array_agg(c.slug)
        from public.post_categories pc
        join public.categories c on c.id = pc.category_id
       where pc.post_id = p.id
    ),
    '{}'::text[]
  ) as category_slugs,
  coalesce(
    (
      select jsonb_agg(jsonb_build_object('id', t.id, 'slug', t.slug, 'name', ti.name))
        from public.post_tags pt
        join public.tags t on t.id = pt.tag_id
        left join public.tags_i18n ti on ti.tag_id = t.id and ti.locale = i.locale
       where pt.post_id = p.id
    ),
    '[]'::jsonb
  ) as tags,
  coalesce(
    (
      select array_agg(t.slug)
        from public.post_tags pt
        join public.tags t on t.id = pt.tag_id
       where pt.post_id = p.id
    ),
    '{}'::text[]
  ) as tag_slugs,
  (
    select array_agg(other.locale order by other.locale)
      from public.posts_i18n other
     where other.post_id = p.id
  ) as available_locales
from public.posts p
join public.posts_i18n i on i.post_id = p.id
left join public.series s on s.id = p.series_id
where p.status = 'published';

create or replace view public.v_public_projects
with (security_invoker = true)
as
select
  pr.id,
  pr.slug,
  i.locale,
  i.name,
  i.tagline,
  i.summary,
  i.content_html,
  i.toc,
  i.role,
  i.seo_title,
  i.seo_description,
  pr.cover_url,
  pr.status,
  pr.started_at,
  pr.ended_at,
  pr.is_featured,
  pr.sort_order,
  pr.metrics,
  pr.stars,
  pr.forks,
  pr.primary_language,
  pr.github_repo,
  pr.view_count,
  pr.allow_comments,
  pr.updated_at,
  pc.slug as category_slug,
  pci.name as category_name,
  o.slug as organization_slug,
  oi.name as organization_name,
  coalesce(
    (
      select jsonb_agg(jsonb_build_object('id', t.id, 'slug', t.slug, 'name', ti.name))
        from public.project_tags prt
        join public.tags t on t.id = prt.tag_id
        left join public.tags_i18n ti on ti.tag_id = t.id and ti.locale = i.locale
       where prt.project_id = pr.id
    ),
    '[]'::jsonb
  ) as tags,
  coalesce(
    (
      select array_agg(t.slug)
        from public.project_tags prt
        join public.tags t on t.id = prt.tag_id
       where prt.project_id = pr.id
    ),
    '{}'::text[]
  ) as tag_slugs
from public.projects pr
join public.projects_i18n i on i.project_id = pr.id
left join public.project_categories pc on pc.id = pr.category_id
left join public.project_categories_i18n pci
       on pci.category_id = pc.id and pci.locale = i.locale
left join public.organizations o on o.id = pr.organization_id
left join public.organizations_i18n oi on oi.org_id = o.id and oi.locale = i.locale
where pr.is_visible;

-- ---------------------------------------------------------------------------
-- 瀏覽數
--
-- 同一位訪客 24 小時內只計一次；比對用的是雜湊，不是 IP（規格 §5.1）。
-- ---------------------------------------------------------------------------
create table public.view_dedup (
  entity_type  text not null,
  entity_id    uuid not null,
  visitor_hash text not null,
  viewed_at    timestamptz not null default now(),
  primary key (entity_type, entity_id, visitor_hash)
);

create index view_dedup_viewed_idx on public.view_dedup (viewed_at);

create or replace function public.increment_view(
  p_type       text,
  p_id         uuid,
  p_ip         text,
  p_user_agent text
)
returns void
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_hash text := encode(
    digest(p_ip || '|' || p_user_agent || '|' || public.current_analytics_salt(), 'sha256'),
    'hex'
  );
  v_last timestamptz;
begin
  select viewed_at into v_last
    from public.view_dedup
   where entity_type = p_type
     and entity_id = p_id
     and visitor_hash = v_hash;

  -- 同一位訪客 24 小時內只計一次。
  if v_last is not null and v_last > now() - interval '24 hours' then
    return;
  end if;

  insert into public.view_dedup (entity_type, entity_id, visitor_hash, viewed_at)
  values (p_type, p_id, v_hash, now())
  on conflict (entity_type, entity_id, visitor_hash) do update
    set viewed_at = now();

  if p_type = 'post' then
    update public.posts set view_count = view_count + 1 where id = p_id;
  elsif p_type = 'project' then
    update public.projects set view_count = view_count + 1 where id = p_id;
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- 讚
-- ---------------------------------------------------------------------------
create or replace function public.toggle_like(
  p_post_id    uuid,
  p_ip         text,
  p_user_agent text,
  p_user_id    uuid default null,
  p_liked      boolean default true
)
returns int
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_hash text := encode(
    digest(p_ip || '|' || p_user_agent || '|' || public.current_analytics_salt(), 'sha256'),
    'hex'
  );
  v_count int;
begin
  if p_liked then
    insert into public.post_likes (post_id, visitor_hash, user_id)
    values (p_post_id, v_hash, p_user_id)
    on conflict (post_id, visitor_hash) do nothing;
  else
    delete from public.post_likes
     where post_id = p_post_id and visitor_hash = v_hash;
  end if;

  select count(*) into v_count from public.post_likes where post_id = p_post_id;
  update public.posts set like_count = v_count where id = p_post_id;

  return v_count;
end;
$$;

-- ---------------------------------------------------------------------------
-- 發表留言
--
-- 內容淨化在此完成：一律轉義 HTML，只保留換行（規格 §6.6）。
-- ---------------------------------------------------------------------------
create or replace function public.create_comment(
  p_target_type text,
  p_target_id   uuid,
  p_content     text,
  p_parent_id   uuid default null,
  p_ip          text default null,
  p_user_agent  text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_banned  boolean;
  v_pending boolean;
  v_id      uuid;
begin
  if v_user_id is null then
    raise exception '必須登入才能留言' using errcode = 'insufficient_privilege';
  end if;

  select is_banned into v_banned from public.profiles where user_id = v_user_id;
  if coalesce(v_banned, false) then
    raise exception '此帳號目前無法留言' using errcode = 'insufficient_privilege';
  end if;

  -- 全站預審開關（規格 §6.6，預設關閉）
  select coalesce((value #>> '{}')::boolean, false)
    into v_pending
    from public.site_settings
   where key = 'comment_moderation';

  insert into public.comments (
    target_type, target_id, parent_id, user_id, content, content_html, status,
    ip_hash, user_agent
  )
  values (
    p_target_type,
    p_target_id,
    p_parent_id,
    v_user_id,
    p_content,
    replace(
      replace(
        replace(replace(replace(p_content, '&', '&amp;'), '<', '&lt;'), '>', '&gt;'),
        E'\n', '<br />'
      ),
      '"', '&quot;'
    ),
    case when coalesce(v_pending, false) then 'pending' else 'published' end,
    case
      when p_ip is null then null
      else encode(
        digest(p_ip || '|' || coalesce(p_user_agent, '') || '|' || public.current_analytics_salt(), 'sha256'),
        'hex'
      )
    end,
    p_user_agent
  )
  returning id into v_id;

  return v_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- 全站搜尋（規格 §10）
--
-- tsvector 負責英文與技術名詞，ILIKE + pg_trgm 索引負責中文子字串；
-- 分數 = 權重 0.7 + 時間新鮮度 0.2 + 瀏覽數 0.1。
-- ---------------------------------------------------------------------------
create or replace function public.search_all(
  q        text,
  p_locale text default 'zh-TW',
  p_limit  int default 20,
  p_offset int default 0
)
returns table (
  type       text,
  id         uuid,
  slug       text,
  title      text,
  snippet    text,
  score      real,
  date       timestamptz,
  categories text[]
)
language sql
stable
security definer
set search_path = public, extensions, pg_temp
as $$
  with query as (
    select
      plainto_tsquery('simple', unaccent(q)) as ts,
      '%' || q || '%' as pattern
  ),
  post_hits as (
    select
      'post'::text as type,
      p.id,
      p.slug,
      i.title,
      coalesce(
        nullif(i.excerpt, ''),
        left(coalesce(i.content_text, ''), 160)
      ) as snippet,
      (
        greatest(ts_rank(i.search_vector, (select ts from query)), 0) * 0.7
        + (1.0 / (1 + extract(epoch from now() - coalesce(p.published_at, now())) / 2592000)) * 0.2
        + least(p.view_count / 1000.0, 1) * 0.1
      )::real as score,
      p.published_at as date,
      coalesce(
        (
          select array_agg(ci.name)
            from public.post_categories pc
            join public.categories_i18n ci
              on ci.category_id = pc.category_id and ci.locale = i.locale
           where pc.post_id = p.id
        ),
        '{}'::text[]
      ) as categories
    from public.posts p
    join public.posts_i18n i on i.post_id = p.id
    cross join query
    where p.status = 'published'
      and i.locale = p_locale
      and (
        i.search_vector @@ query.ts
        or i.title ilike query.pattern
        or i.content_text ilike query.pattern
      )
  ),
  project_hits as (
    select
      'project'::text as type,
      pr.id,
      pr.slug,
      i.name as title,
      coalesce(nullif(i.tagline, ''), left(coalesce(i.content_text, ''), 160)) as snippet,
      (
        greatest(ts_rank(i.search_vector, (select ts from query)), 0) * 0.7
        + 0.1
        + least(pr.view_count / 1000.0, 1) * 0.1
      )::real as score,
      pr.started_at::timestamptz as date,
      '{}'::text[] as categories
    from public.projects pr
    join public.projects_i18n i on i.project_id = pr.id
    cross join query
    where pr.is_visible
      and i.locale = p_locale
      and (
        i.search_vector @@ query.ts
        or i.name ilike query.pattern
        or i.content_text ilike query.pattern
      )
  ),
  page_hits as (
    select
      'page'::text as type,
      pg.id,
      pg.slug,
      i.title,
      left(coalesce(i.content_text, ''), 160) as snippet,
      0.3::real as score,
      pg.updated_at as date,
      '{}'::text[] as categories
    from public.pages pg
    join public.pages_i18n i on i.page_id = pg.id
    cross join query
    where pg.status = 'published'
      and i.locale = p_locale
      and (i.title ilike query.pattern or i.content_text ilike query.pattern)
  )
  select * from (
    select * from post_hits
    union all
    select * from project_hits
    union all
    select * from page_hits
  ) hits
  order by hits.score desc, hits.date desc nulls last
  limit p_limit
  offset p_offset;
$$;

-- ---------------------------------------------------------------------------
-- 相關文章（規格 §6.13）
-- ---------------------------------------------------------------------------
create or replace function public.get_related_posts(
  p_post_id uuid,
  p_locale  text default 'zh-TW',
  p_limit   int default 3
)
returns table (id uuid, slug text, title text, shared_tags bigint)
language sql
stable
as $$
  select
    p.id,
    p.slug,
    i.title,
    count(pt2.tag_id) as shared_tags
  from public.posts p
  join public.posts_i18n i on i.post_id = p.id and i.locale = p_locale
  join public.post_categories pc on pc.post_id = p.id
  left join public.post_tags pt2
         on pt2.post_id = p.id
        and pt2.tag_id in (select tag_id from public.post_tags where post_id = p_post_id)
  where p.status = 'published'
    and p.id <> p_post_id
    and pc.category_id in (select category_id from public.post_categories where post_id = p_post_id)
  group by p.id, p.slug, i.title, p.published_at
  order by shared_tags desc, p.published_at desc
  limit p_limit;
$$;
