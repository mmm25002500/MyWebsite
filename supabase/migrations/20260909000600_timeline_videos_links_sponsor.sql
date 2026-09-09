-- 時間軸、影片、連結樹、贊助。
-- 規格 §6.8、§6.9。

create table public.timeline_events (
  id                 uuid primary key default gen_random_uuid(),
  event_date         date not null,
  end_date           date,
  branch             text not null default 'up' check (branch in ('up', 'down')),
  type               text not null
                       check (type in ('startup', 'education', 'career', 'project', 'milestone', 'life')),
  icon               text,
  color              text,
  image_url          text,
  link_url           text,
  related_project_id uuid references public.projects (id) on delete set null,
  related_org_id     uuid references public.organizations (id) on delete set null,
  related_post_id    uuid references public.posts (id) on delete set null,
  is_milestone       boolean not null default false,
  is_visible         boolean not null default true,
  sort_order         int not null default 0,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create trigger timeline_events_set_updated_at
  before update on public.timeline_events
  for each row execute function public.set_updated_at();

create index timeline_events_date_idx on public.timeline_events (event_date);

create table public.timeline_events_i18n (
  event_id    uuid not null references public.timeline_events (id) on delete cascade,
  locale      public.locale_code not null,
  title       text not null,
  subtitle    text,
  description text,
  primary key (event_id, locale)
);

-- ---------------------------------------------------------------------------
-- 影片
--
-- 影片本體來自 YouTube Data API（規格 §5.5），此表只存後台的覆寫設定。
-- ---------------------------------------------------------------------------
create table public.video_meta (
  id          uuid primary key default gen_random_uuid(),
  youtube_id  text not null unique,
  category    text,
  is_featured boolean not null default false,
  is_hidden   boolean not null default false,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger video_meta_set_updated_at
  before update on public.video_meta
  for each row execute function public.set_updated_at();

create table public.video_meta_i18n (
  video_meta_id        uuid not null references public.video_meta (id) on delete cascade,
  locale               public.locale_code not null,
  title_override       text,
  description_override text,
  primary key (video_meta_id, locale)
);

-- ---------------------------------------------------------------------------
-- 連結樹
-- ---------------------------------------------------------------------------
create table public.link_groups (
  id         uuid primary key default gen_random_uuid(),
  key        text not null unique,
  sort_order int not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger link_groups_set_updated_at
  before update on public.link_groups
  for each row execute function public.set_updated_at();

create table public.link_groups_i18n (
  group_id uuid not null references public.link_groups (id) on delete cascade,
  locale   public.locale_code not null,
  name     text not null,
  primary key (group_id, locale)
);

create table public.link_buttons (
  id             uuid primary key default gen_random_uuid(),
  group_id       uuid references public.link_groups (id) on delete set null,
  url            text not null,
  image_url      text,   -- 上傳的圖示（Storage bucket: links）
  icon           text,
  bg_color       text,
  text_color     text,
  is_highlighted boolean not null default false,
  sort_order     int not null default 0,
  is_visible     boolean not null default true,
  click_count    int not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create trigger link_buttons_set_updated_at
  before update on public.link_buttons
  for each row execute function public.set_updated_at();

create index link_buttons_group_idx on public.link_buttons (group_id, sort_order);

create table public.link_buttons_i18n (
  button_id   uuid not null references public.link_buttons (id) on delete cascade,
  locale      public.locale_code not null,
  label       text not null,
  description text,
  primary key (button_id, locale)
);

create table public.link_clicks (
  id           uuid primary key default gen_random_uuid(),
  button_id    uuid not null references public.link_buttons (id) on delete cascade,
  visitor_hash text,
  referrer     text,
  created_at   timestamptz not null default now()
);

create index link_clicks_button_idx on public.link_clicks (button_id, created_at desc);

-- ---------------------------------------------------------------------------
-- 贊助
-- ---------------------------------------------------------------------------
create table public.sponsor_methods (
  id             uuid primary key default gen_random_uuid(),
  key            text not null unique,
  type           text not null check (type in ('crypto', 'link')),
  address_or_url text not null,
  qr_image_url   text,
  network        text,
  icon           text,
  sort_order     int not null default 0,
  is_visible     boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create trigger sponsor_methods_set_updated_at
  before update on public.sponsor_methods
  for each row execute function public.set_updated_at();

create table public.sponsor_methods_i18n (
  method_id uuid not null references public.sponsor_methods (id) on delete cascade,
  locale    public.locale_code not null,
  label     text not null,
  note      text,
  primary key (method_id, locale)
);

create table public.sponsors (
  id           uuid primary key default gen_random_uuid(),
  display_name text not null,
  avatar_url   text,
  url          text,
  tier         text not null default 'custom'
                 check (tier in ('bronze', 'silver', 'gold', 'custom')),
  amount_note  text,   -- 顯示文字，不存實際金額
  sponsored_at date,
  is_anonymous boolean not null default false,
  is_visible   boolean not null default true,
  sort_order   int not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger sponsors_set_updated_at
  before update on public.sponsors
  for each row execute function public.set_updated_at();

create table public.sponsors_i18n (
  sponsor_id uuid not null references public.sponsors (id) on delete cascade,
  locale     public.locale_code not null,
  message    text,
  primary key (sponsor_id, locale)
);
