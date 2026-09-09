-- 留言系統。
-- 規格 §6.6。

create table public.comments (
  id           uuid primary key default gen_random_uuid(),
  target_type  text not null default 'post'
                 check (target_type in ('post', 'project', 'page')),
  target_id    uuid not null,
  -- 巢狀回覆限 2 層，由 trigger 檢查
  parent_id    uuid references public.comments (id) on delete cascade,
  user_id      uuid references public.profiles (user_id) on delete set null,
  content      text not null check (char_length(content) between 1 and 2000),
  content_html text,   -- 淨化後：純文字 + 換行 + 自動連結
  status       text not null default 'published'
                 check (status in ('published', 'pending', 'hidden', 'spam', 'deleted')),
  is_pinned    boolean not null default false,
  like_count   int not null default 0,
  edited_at    timestamptz,
  ip_hash      text,
  user_agent   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger comments_set_updated_at
  before update on public.comments
  for each row execute function public.set_updated_at();

create index comments_target_idx
  on public.comments (target_type, target_id, status, created_at desc);
create index comments_parent_idx on public.comments (parent_id);
create index comments_user_idx on public.comments (user_id, created_at desc);

-- 巢狀回覆限兩層：回覆的父留言本身不得再有父留言。
create or replace function public.enforce_comment_depth()
returns trigger
language plpgsql
as $$
declare
  v_grandparent uuid;
begin
  if new.parent_id is null then
    return new;
  end if;

  select parent_id into v_grandparent
    from public.comments
   where id = new.parent_id;

  if v_grandparent is not null then
    raise exception '留言最多兩層' using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

create trigger comments_enforce_depth
  before insert or update of parent_id on public.comments
  for each row execute function public.enforce_comment_depth();

-- 文章的留言數（規格 §6.3 由 trigger 維護）
create or replace function public.comment_count_update()
returns trigger
language plpgsql
as $$
declare
  v_target_type text := coalesce(new.target_type, old.target_type);
  v_target_id   uuid := coalesce(new.target_id, old.target_id);
begin
  if v_target_type = 'post' then
    update public.posts
       set comment_count = (
             select count(*)
               from public.comments
              where target_type = 'post'
                and target_id = v_target_id
                and status = 'published'
           )
     where id = v_target_id;
  end if;

  return null;
end;
$$;

create trigger comments_maintain_count
  after insert or update of status or delete on public.comments
  for each row execute function public.comment_count_update();

create table public.comment_likes (
  comment_id uuid not null references public.comments (id) on delete cascade,
  user_id    uuid not null references public.profiles (user_id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);

create table public.comment_reports (
  id          uuid primary key default gen_random_uuid(),
  comment_id  uuid not null references public.comments (id) on delete cascade,
  reporter_id uuid references public.profiles (user_id) on delete set null,
  reason      text,
  status      text not null default 'open'
                check (status in ('open', 'resolved', 'dismissed')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger comment_reports_set_updated_at
  before update on public.comment_reports
  for each row execute function public.set_updated_at();

create table public.user_bans (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (user_id) on delete cascade,
  banned_by  uuid references public.profiles (user_id) on delete set null,
  reason     text,
  expires_at timestamptz,   -- null = 永久
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger user_bans_set_updated_at
  before update on public.user_bans
  for each row execute function public.set_updated_at();

create index user_bans_user_idx on public.user_bans (user_id, is_active);
