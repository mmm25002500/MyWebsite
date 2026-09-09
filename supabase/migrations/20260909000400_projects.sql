-- 作品集。與文章完全分離（規格 §6.4）。

create table public.project_categories (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique,
  icon       text,
  color      text,
  sort_order int not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger project_categories_set_updated_at
  before update on public.project_categories
  for each row execute function public.set_updated_at();

create table public.project_categories_i18n (
  category_id uuid not null references public.project_categories (id) on delete cascade,
  locale      public.locale_code not null,
  name        text not null,
  description text,
  primary key (category_id, locale)
);

-- organizations 於後續 migration 建立，這裡先不加外鍵，稍後補上。
create table public.projects (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null unique,
  category_id      uuid references public.project_categories (id) on delete set null,
  organization_id  uuid,
  status           text not null default 'in_progress'
                     check (status in ('idea', 'in_progress', 'completed', 'maintained', 'archived')),
  started_at       date not null,
  ended_at         date,   -- null 代表進行中
  cover_url        text,
  github_repo      text,   -- 'owner/name'
  stars            int,
  forks            int,
  primary_language text,
  last_pushed_at   timestamptz,
  metrics          jsonb not null default '{}'::jsonb,
  is_featured      boolean not null default false,
  is_visible       boolean not null default true,
  sort_order       int not null default 0,
  view_count       int not null default 0,
  allow_comments   boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  check (ended_at is null or ended_at >= started_at)
);

create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

create index projects_listing_idx
  on public.projects (is_featured desc, sort_order, started_at desc);
create index projects_category_idx on public.projects (category_id);
create index projects_organization_idx on public.projects (organization_id);

create table public.projects_i18n (
  project_id      uuid not null references public.projects (id) on delete cascade,
  locale          public.locale_code not null,
  name            text not null,
  tagline         text,
  summary         text,
  content_md      text,   -- 獨立於文章的詳細內容
  content_html    text,
  content_text    text,
  toc             jsonb,
  role            text,
  seo_title       text,
  seo_description text,
  search_vector   tsvector,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  primary key (project_id, locale)
);

create trigger projects_i18n_set_updated_at
  before update on public.projects_i18n
  for each row execute function public.set_updated_at();

create index projects_i18n_search_idx on public.projects_i18n using gin (search_vector);
create index projects_i18n_text_trgm_idx
  on public.projects_i18n using gin (content_text gin_trgm_ops);

-- ---------------------------------------------------------------------------
-- 縮圖輪播，最多 10 張（規格 §6.4）
-- ---------------------------------------------------------------------------
create table public.project_images (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references public.projects (id) on delete cascade,
  url           text not null,
  thumbnail_url text,
  width         int,
  height        int,
  sort_order    int not null default 0,
  is_cover      boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create trigger project_images_set_updated_at
  before update on public.project_images
  for each row execute function public.set_updated_at();

create index project_images_project_idx on public.project_images (project_id, sort_order);

create or replace function public.enforce_project_image_limit()
returns trigger
language plpgsql
as $$
declare
  v_count int;
begin
  select count(*) into v_count
    from public.project_images
   where project_id = new.project_id;

  if v_count >= 10 then
    raise exception '每個專案最多 10 張圖片' using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

create trigger project_images_limit
  before insert on public.project_images
  for each row execute function public.enforce_project_image_limit();

create table public.project_images_i18n (
  image_id uuid not null references public.project_images (id) on delete cascade,
  locale   public.locale_code not null,
  caption  text,
  alt      text,
  primary key (image_id, locale)
);

-- ---------------------------------------------------------------------------
-- 連結，數量不限（規格 §3.1）
-- ---------------------------------------------------------------------------
create table public.project_links (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  type       text not null default 'other'
               check (type in ('demo', 'github', 'appstore', 'playstore', 'docs', 'video', 'article', 'other')),
  url        text not null,
  icon       text,
  sort_order int not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger project_links_set_updated_at
  before update on public.project_links
  for each row execute function public.set_updated_at();

create index project_links_project_idx on public.project_links (project_id, sort_order);

create table public.project_links_i18n (
  link_id uuid not null references public.project_links (id) on delete cascade,
  locale  public.locale_code not null,
  label   text not null,
  primary key (link_id, locale)
);

create table public.project_tags (
  project_id uuid not null references public.projects (id) on delete cascade,
  tag_id     uuid not null references public.tags (id) on delete cascade,
  primary key (project_id, tag_id)
);

create index project_tags_tag_idx on public.project_tags (tag_id);

-- 關聯 Case Study 文章
create table public.project_posts (
  project_id uuid not null references public.projects (id) on delete cascade,
  post_id    uuid not null references public.posts (id) on delete cascade,
  sort_order int not null default 0,
  primary key (project_id, post_id)
);
