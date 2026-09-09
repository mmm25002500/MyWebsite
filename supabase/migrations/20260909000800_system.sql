-- 媒體、版本、稽核、訂閱、聯絡、轉址、更新日誌。
-- 規格 §6.11、§15。

create table public.media (
  bucket      text not null,
  path        text not null,
  url         text not null,
  mime        text,
  size_bytes  int,
  width       int,
  height      int,
  folder      text,
  checksum    text,
  uploaded_by uuid references public.profiles (user_id) on delete set null,
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (bucket, path)
);

create trigger media_set_updated_at
  before update on public.media
  for each row execute function public.set_updated_at();

create table public.media_i18n (
  media_id uuid not null references public.media (id) on delete cascade,
  locale   public.locale_code not null,
  alt      text,
  caption  text,
  primary key (media_id, locale)
);

-- ---------------------------------------------------------------------------
-- 內容版本（保留 30 版，規格 §6.13）
-- ---------------------------------------------------------------------------
create table public.content_revisions (
  id          uuid primary key default gen_random_uuid(),
  entity_type text not null
                check (entity_type in ('post', 'project', 'page', 'resume', 'organization')),
  entity_id   uuid not null,
  locale      public.locale_code,
  snapshot    jsonb not null,
  edited_by   uuid references public.profiles (user_id) on delete set null,
  note        text,
  created_at  timestamptz not null default now()
);

create index content_revisions_entity_idx
  on public.content_revisions (entity_type, entity_id, created_at desc);

-- ---------------------------------------------------------------------------
-- 操作紀錄（規格 §15）
--
-- 不可竄改：RLS 禁止 UPDATE 與 DELETE，僅 service role 可 INSERT。
-- ---------------------------------------------------------------------------
create table public.audit_logs (
  id           bigserial primary key,
  actor_id     uuid references public.profiles (user_id) on delete set null,
  actor_name   text,
  action       text not null,
  entity_type  text,
  entity_id    uuid,
  entity_label text,
  diff         jsonb,
  ip_hash      text,
  user_agent   text,
  severity     text not null default 'info'
                 check (severity in ('info', 'warning', 'critical')),
  created_at   timestamptz not null default now()
);

create index audit_logs_created_idx on public.audit_logs (created_at desc);
create index audit_logs_actor_idx on public.audit_logs (actor_id, created_at desc);
create index audit_logs_severity_idx on public.audit_logs (severity, created_at desc);

create or replace function public.write_audit_log(
  p_action       text,
  p_entity_type  text default null,
  p_entity_id    uuid default null,
  p_entity_label text default null,
  p_diff         jsonb default null,
  p_severity     text default 'info',
  p_ip_hash      text default null,
  p_user_agent   text default null
)
returns void
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
begin
  insert into public.audit_logs (
    actor_id, actor_name, action, entity_type, entity_id,
    entity_label, diff, ip_hash, user_agent, severity
  )
  values (
    auth.uid(),
    (select display_name from public.profiles where user_id = auth.uid()),
    p_action, p_entity_type, p_entity_id,
    p_entity_label, p_diff, p_ip_hash, p_user_agent, p_severity
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- 訂閱（double opt-in，規格 §5.4）
-- ---------------------------------------------------------------------------
create table public.subscribers (
  id                 uuid primary key default gen_random_uuid(),
  email              text not null unique,
  locale             public.locale_code not null default 'zh-TW',
  confirmed          boolean not null default false,
  confirm_token      text,
  unsubscribe_token  text not null default encode(extensions.gen_random_bytes(24), 'hex'),
  confirmed_at       timestamptz,
  unsubscribed_at    timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create trigger subscribers_set_updated_at
  before update on public.subscribers
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 聯絡訊息
-- ---------------------------------------------------------------------------
create table public.contact_messages (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text not null,
  subject    text not null,
  message    text not null,
  type       text not null default 'other'
               check (type in ('collab', 'hire', 'tech', 'other')),
  status     text not null default 'new'
               check (status in ('new', 'read', 'replied', 'spam')),
  replied_at timestamptz,
  admin_note text,
  ip_hash    text,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger contact_messages_set_updated_at
  before update on public.contact_messages
  for each row execute function public.set_updated_at();

create index contact_messages_status_idx
  on public.contact_messages (status, created_at desc);

-- ---------------------------------------------------------------------------
-- 轉址（slug 變更時自動寫入，規格 §6.3）
-- ---------------------------------------------------------------------------
create table public.redirects (
  id          uuid primary key default gen_random_uuid(),
  from_path   text not null unique,
  to_path     text not null,
  status_code int not null default 301 check (status_code in (301, 302, 307, 308)),
  hit_count   int not null default 0,
  is_active   boolean not null default true,
  reason      text check (reason in ('slug_change', 'manual', 'migration')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger redirects_set_updated_at
  before update on public.redirects
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 更新日誌
-- ---------------------------------------------------------------------------
create table public.changelog_entries (
  id          uuid primary key default gen_random_uuid(),
  version     text not null,
  released_at date not null,
  sort_order  int not null default 0,
  is_visible  boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger changelog_entries_set_updated_at
  before update on public.changelog_entries
  for each row execute function public.set_updated_at();

create table public.changelog_entries_i18n (
  entry_id uuid not null references public.changelog_entries (id) on delete cascade,
  locale   public.locale_code not null,
  title    text not null,
  items    jsonb not null default '[]'::jsonb,
  primary key (entry_id, locale)
);
