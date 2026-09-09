-- 組織與履歷。
-- 規格 §6.5、§6.7。

create table public.organizations (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  logo_url    text,
  website_url text,
  github_org  text,
  started_at  date,
  ended_at    date,
  status      text not null default 'active'
                check (status in ('active', 'ended', 'reviving')),
  sort_order  int not null default 0,
  is_visible  boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger organizations_set_updated_at
  before update on public.organizations
  for each row execute function public.set_updated_at();

create table public.organizations_i18n (
  org_id           uuid not null references public.organizations (id) on delete cascade,
  locale           public.locale_code not null,
  name             text not null,
  role             text not null,
  description_md   text,
  description_html text,
  primary key (org_id, locale)
);

-- projects 先前刻意留白的外鍵，在 organizations 建好後補上。
alter table public.projects
  add constraint projects_organization_id_fkey
  foreign key (organization_id) references public.organizations (id) on delete set null;

-- ---------------------------------------------------------------------------
-- 工作經歷
-- ---------------------------------------------------------------------------
create table public.experiences (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid references public.organizations (id) on delete set null,
  employment_type   text not null
                      check (employment_type in ('full_time', 'founder', 'freelance', 'part_time', 'intern')),
  started_at        date not null,
  ended_at          date,
  is_current        boolean not null default false,
  logo_url          text,
  url               text,
  -- 預設顯示公司名稱（規格 §3.1 /resume）
  show_company_name boolean not null default true,
  sort_order        int not null default 0,
  is_visible        boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create trigger experiences_set_updated_at
  before update on public.experiences
  for each row execute function public.set_updated_at();

create table public.experiences_i18n (
  experience_id uuid not null references public.experiences (id) on delete cascade,
  locale        public.locale_code not null,
  company_name  text not null,
  title         text not null,
  location      text,
  description_md text,
  highlights    jsonb not null default '[]'::jsonb,
  tech          text[] not null default '{}',
  primary key (experience_id, locale)
);

-- ---------------------------------------------------------------------------
-- 學歷
-- ---------------------------------------------------------------------------
create table public.education (
  id         uuid primary key default gen_random_uuid(),
  started_at date not null,
  ended_at   date,
  is_current boolean not null default false,
  logo_url   text,
  sort_order int not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger education_set_updated_at
  before update on public.education
  for each row execute function public.set_updated_at();

create table public.education_i18n (
  education_id   uuid not null references public.education (id) on delete cascade,
  locale         public.locale_code not null,
  school         text not null,
  degree         text,
  field          text,
  description_md text,
  primary key (education_id, locale)
);

-- ---------------------------------------------------------------------------
-- 技能
-- ---------------------------------------------------------------------------
create table public.skill_groups (
  id         uuid primary key default gen_random_uuid(),
  key        text not null unique,
  icon       text,
  sort_order int not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger skill_groups_set_updated_at
  before update on public.skill_groups
  for each row execute function public.set_updated_at();

create table public.skill_groups_i18n (
  group_id    uuid not null references public.skill_groups (id) on delete cascade,
  locale      public.locale_code not null,
  name        text not null,
  description text,
  primary key (group_id, locale)
);

create table public.skills (
  id           uuid primary key default gen_random_uuid(),
  group_id     uuid not null references public.skill_groups (id) on delete cascade,
  name         text not null,   -- 技術名稱不翻譯（規格 §14.2）
  level        int check (level between 1 and 5),
  years        numeric,
  icon         text,
  is_primary   boolean not null default false,
  show_on_home boolean not null default false,
  sort_order   int not null default 0,
  is_visible   boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger skills_set_updated_at
  before update on public.skills
  for each row execute function public.set_updated_at();

create index skills_group_idx on public.skills (group_id, sort_order);

-- ---------------------------------------------------------------------------
-- 證照（整區預設隱藏，由 site_settings.show_certifications 控制）
-- ---------------------------------------------------------------------------
create table public.certifications (
  id             uuid primary key default gen_random_uuid(),
  issued_at      date,
  expires_at     date,
  credential_id  text,
  credential_url text,
  file_url       text,
  sort_order     int not null default 0,
  is_visible     boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create trigger certifications_set_updated_at
  before update on public.certifications
  for each row execute function public.set_updated_at();

create table public.certifications_i18n (
  certification_id uuid not null references public.certifications (id) on delete cascade,
  locale           public.locale_code not null,
  name             text not null,
  issuer           text not null,
  description      text,
  primary key (certification_id, locale)
);

-- ---------------------------------------------------------------------------
-- 語言與興趣
-- ---------------------------------------------------------------------------
create table public.languages_spoken (
  id          uuid primary key default gen_random_uuid(),
  code        text not null,
  proficiency text not null
                check (proficiency in ('native', 'fluent', 'intermediate', 'basic')),
  sort_order  int not null default 0,
  is_visible  boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger languages_spoken_set_updated_at
  before update on public.languages_spoken
  for each row execute function public.set_updated_at();

create table public.languages_spoken_i18n (
  language_id uuid not null references public.languages_spoken (id) on delete cascade,
  locale      public.locale_code not null,
  name        text not null,
  note        text,
  primary key (language_id, locale)
);

create table public.interests (
  id         uuid primary key default gen_random_uuid(),
  icon       text,
  sort_order int not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger interests_set_updated_at
  before update on public.interests
  for each row execute function public.set_updated_at();

create table public.interests_i18n (
  interest_id uuid not null references public.interests (id) on delete cascade,
  locale      public.locale_code not null,
  title       text not null,
  description text,
  primary key (interest_id, locale)
);
