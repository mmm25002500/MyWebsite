-- 使用者、站台設定與單頁。
-- 規格 §6.1、§6.2。

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table public.profiles (
  user_id       uuid primary key references auth.users (id) on delete cascade,
  role          text not null default 'user'
                  check (role in ('user', 'editor', 'admin', 'owner')),
  display_name  text not null,
  -- 頭像不開放上傳（規格 §5.3）：僅由 OAuth 帶入或系統依暱稱產生。
  avatar_url    text,
  avatar_source text not null default 'generated'
                  check (avatar_source in ('oauth', 'generated')),
  bio           text,
  website       text,
  is_banned     boolean not null default false,
  banned_until  timestamptz,
  ban_reason    text,
  notify_reply  boolean not null default true,
  last_seen_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create index profiles_role_idx on public.profiles (role);

-- ---------------------------------------------------------------------------
-- 角色判斷
--
-- security definer + 固定 search_path（規格 §6.12）。RLS 政策一律透過這個函式
-- 判斷角色，避免在每條政策內重複查 profiles 而造成遞迴。
-- ---------------------------------------------------------------------------
create or replace function public.auth_role()
returns text
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(
    (select role from public.profiles where user_id = auth.uid()),
    'anon'
  );
$$;

comment on function public.auth_role is
  '回傳目前登入者的角色；未登入為 anon（規格 §5.3）。';

create or replace function public.is_editor()
returns boolean
language sql
stable
as $$
  select public.auth_role() in ('editor', 'admin', 'owner');
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select public.auth_role() in ('admin', 'owner');
$$;

create or replace function public.is_owner()
returns boolean
language sql
stable
as $$
  select public.auth_role() = 'owner';
$$;

-- 註冊時自動建立 profile。OAuth 會帶 avatar_url，Email 註冊則留給前端產生。
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_avatar text := coalesce(
    new.raw_user_meta_data ->> 'avatar_url',
    new.raw_user_meta_data ->> 'picture'
  );
begin
  insert into public.profiles (user_id, display_name, avatar_url, avatar_source)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'display_name', ''),
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      nullif(new.raw_user_meta_data ->> 'name', ''),
      split_part(new.email, '@', 1)
    ),
    v_avatar,
    case when v_avatar is null then 'generated' else 'oauth' end
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 登入紀錄
-- ---------------------------------------------------------------------------
create table public.user_sessions_meta (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references public.profiles (user_id) on delete cascade,
  ip_hash    text,
  user_agent text,
  action     text not null
               check (action in ('login', 'logout', 'failed_login', 'password_reset')),
  created_at timestamptz not null default now()
);

create index user_sessions_meta_user_idx
  on public.user_sessions_meta (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- 站台設定
--
-- 設定型多語走 jsonb（規格 §6.0），形如 {"zh-TW": "...", "en": "..."}。
-- ---------------------------------------------------------------------------
create table public.site_settings (
  key         text primary key,
  value       jsonb not null,
  description text,
  updated_by  uuid references public.profiles (user_id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger site_settings_set_updated_at
  before update on public.site_settings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 單頁（about / privacy / terms / sponsor 說明）
-- ---------------------------------------------------------------------------
create table public.pages (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique,
  status     text not null default 'draft' check (status in ('draft', 'published')),
  cover_url  text,
  sort_order int not null default 0,
  updated_by uuid references public.profiles (user_id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger pages_set_updated_at
  before update on public.pages
  for each row execute function public.set_updated_at();

create table public.pages_i18n (
  page_id         uuid not null references public.pages (id) on delete cascade,
  locale          public.locale_code not null,
  title           text not null,
  -- content_md 是唯一真實來源；html/text/toc 於儲存時由 Server Action 產生（§9.1）
  content_md      text,
  content_html    text,
  content_text    text,
  toc             jsonb,
  seo_title       text,
  seo_description text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  primary key (page_id, locale)
);

create trigger pages_i18n_set_updated_at
  before update on public.pages_i18n
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 首頁區塊控制
-- ---------------------------------------------------------------------------
create table public.page_sections (
  id          uuid primary key default gen_random_uuid(),
  page_slug   text not null,
  section_key text not null,
  config      jsonb not null default '{}'::jsonb,
  sort_order  int not null default 0,
  is_visible  boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (page_slug, section_key)
);

create trigger page_sections_set_updated_at
  before update on public.page_sections
  for each row execute function public.set_updated_at();

create table public.page_sections_i18n (
  section_id uuid not null references public.page_sections (id) on delete cascade,
  locale     public.locale_code not null,
  title      text,
  subtitle   text,
  primary key (section_id, locale)
);
