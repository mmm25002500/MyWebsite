-- 筆記／部落格。
-- 規格 §6.3。

-- ---------------------------------------------------------------------------
-- 分類（前台的分頁 Tab）
-- ---------------------------------------------------------------------------
create table public.categories (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique,
  icon       text,
  color      text,
  sort_order int not null default 0,
  is_visible boolean not null default true,
  parent_id  uuid references public.categories (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger categories_set_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

create table public.categories_i18n (
  category_id uuid not null references public.categories (id) on delete cascade,
  locale      public.locale_code not null,
  name        text not null,
  description text,
  primary key (category_id, locale)
);

-- ---------------------------------------------------------------------------
-- 標籤（文章與作品集共用同一套）
-- ---------------------------------------------------------------------------
create table public.tags (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  color         text,
  post_count    int not null default 0,   -- 由 trigger 維護
  project_count int not null default 0,   -- 由 trigger 維護
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create trigger tags_set_updated_at
  before update on public.tags
  for each row execute function public.set_updated_at();

create table public.tags_i18n (
  tag_id uuid not null references public.tags (id) on delete cascade,
  locale public.locale_code not null,
  name   text not null,
  primary key (tag_id, locale)
);

-- ---------------------------------------------------------------------------
-- 系列文
-- ---------------------------------------------------------------------------
create table public.series (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique,
  cover_url  text,
  is_visible boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger series_set_updated_at
  before update on public.series
  for each row execute function public.set_updated_at();

create table public.series_i18n (
  series_id   uuid not null references public.series (id) on delete cascade,
  locale      public.locale_code not null,
  title       text not null,
  description text,
  primary key (series_id, locale)
);

-- ---------------------------------------------------------------------------
-- 文章
--
-- 沒有 scheduled 狀態：規格 §5.2 取消排程發佈。
-- ---------------------------------------------------------------------------
create table public.posts (
  id             uuid primary key default gen_random_uuid(),
  slug           text not null unique,
  series_id      uuid references public.series (id) on delete set null,
  series_order   int,
  status         text not null default 'draft'
                   check (status in ('draft', 'published', 'unlisted', 'archived')),
  published_at   timestamptz,
  cover_url      text,
  og_image_url   text,
  is_pinned      boolean not null default false,
  is_featured    boolean not null default false,
  allow_comments boolean not null default true,
  view_count     int not null default 0,
  like_count     int not null default 0,
  comment_count  int not null default 0,   -- 由 trigger 維護
  canonical_url  text,
  meta           jsonb not null default '{}'::jsonb,
  preview_token  uuid not null default gen_random_uuid(),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create trigger posts_set_updated_at
  before update on public.posts
  for each row execute function public.set_updated_at();

create index posts_status_published_idx on public.posts (status, published_at desc);
create index posts_pinned_idx on public.posts (is_pinned, published_at desc);
create index posts_series_idx on public.posts (series_id, series_order);

create table public.posts_i18n (
  post_id          uuid not null references public.posts (id) on delete cascade,
  locale           public.locale_code not null,
  title            text not null,
  subtitle         text,
  excerpt          text,
  content_md       text,   -- 唯一真實來源（§9.1）
  content_html     text,   -- 儲存時預渲染
  content_text     text,   -- 去語法純文字，供搜尋
  toc              jsonb,
  reading_time_min int,
  word_count       int,
  seo_title        text,
  seo_description  text,
  search_vector    tsvector,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  primary key (post_id, locale)
);

create trigger posts_i18n_set_updated_at
  before update on public.posts_i18n
  for each row execute function public.set_updated_at();

create index posts_i18n_search_idx on public.posts_i18n using gin (search_vector);
create index posts_i18n_title_trgm_idx on public.posts_i18n using gin (title gin_trgm_ops);
create index posts_i18n_text_trgm_idx on public.posts_i18n using gin (content_text gin_trgm_ops);

-- ---------------------------------------------------------------------------
-- 多對多：一篇文章可屬多個分類（規格 §6.3）
-- ---------------------------------------------------------------------------
create table public.post_categories (
  post_id     uuid not null references public.posts (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  is_primary  boolean not null default false,
  primary key (post_id, category_id)
);

create index post_categories_category_idx on public.post_categories (category_id);

-- 每篇文章恰有一個主分類：新設定主分類時把同篇的其他分類降級。
create or replace function public.enforce_primary_category()
returns trigger
language plpgsql
as $$
begin
  if new.is_primary then
    update public.post_categories
       set is_primary = false
     where post_id = new.post_id
       and category_id <> new.category_id
       and is_primary;
  end if;
  return new;
end;
$$;

create trigger post_categories_enforce_primary
  after insert or update of is_primary on public.post_categories
  for each row when (new.is_primary) execute function public.enforce_primary_category();

create table public.post_tags (
  post_id uuid not null references public.posts (id) on delete cascade,
  tag_id  uuid not null references public.tags (id) on delete cascade,
  primary key (post_id, tag_id)
);

create index post_tags_tag_idx on public.post_tags (tag_id);

create table public.post_related (
  post_id         uuid not null references public.posts (id) on delete cascade,
  related_post_id uuid not null references public.posts (id) on delete cascade,
  sort_order      int not null default 0,
  primary key (post_id, related_post_id),
  check (post_id <> related_post_id)
);

-- 讚：登入或匿名皆可，以 visitor_hash 去重（規格 §3.1）。
create table public.post_likes (
  post_id      uuid not null references public.posts (id) on delete cascade,
  visitor_hash text not null,
  user_id      uuid references public.profiles (user_id) on delete set null,
  created_at   timestamptz not null default now(),
  primary key (post_id, visitor_hash)
);

-- ---------------------------------------------------------------------------
-- 分類刪除保護：不得讓任何文章因此沒有分類（規格 §6.3）
-- ---------------------------------------------------------------------------
create or replace function public.prevent_orphan_posts_on_category_delete()
returns trigger
language plpgsql
as $$
declare
  v_orphans int;
begin
  select count(*)
    into v_orphans
    from public.post_categories pc
   where pc.category_id = old.id
     and not exists (
       select 1
         from public.post_categories other
        where other.post_id = pc.post_id
          and other.category_id <> old.id
     );

  if v_orphans > 0 then
    raise exception '有 % 篇文章僅屬於此分類，請先改分類再刪除', v_orphans
      using errcode = 'restrict_violation';
  end if;

  return old;
end;
$$;

create trigger categories_prevent_orphan_posts
  before delete on public.categories
  for each row execute function public.prevent_orphan_posts_on_category_delete();
