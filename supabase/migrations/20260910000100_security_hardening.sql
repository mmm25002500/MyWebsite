-- 權限收斂。
-- 規格 §6.12、§13。
--
-- 先前所有 SECURITY DEFINER 函式都維持 Postgres 的預設授權（EXECUTE 給
-- PUBLIC），而 anon key 是公開在前端 bundle 裡的——任何人都能直接打
-- `/rest/v1/rpc/<函式名>` 執行它們。清空分析資料、無限灌讚、偽造稽核紀錄
-- 全都繞得過應用層。這份 migration 做三件事：
--
--   1. 把「寫入型」的 RPC 全部收回，只留 service_role；呼叫端改由 server 端
--      的 service client 進入，授權在應用層先做完。
--   2. 把幾支函式本身的檢查補齊（留言目標、按讚需登入、註冊資料長度）。
--   3. 用欄位級授權把 profiles 的敏感欄位關起來，並修掉幾條過寬的 RLS。

-- ---------------------------------------------------------------------------
-- 按讚：去重改以「使用者」為準
--
-- 原本以 visitor_hash（IP + UA + 當日鹽）去重，等於誰都能靠換 IP 重複按；
-- 現在一律要求登入，visitor_hash 只保留欄位相容性，改由使用者 id 推導，
-- 避免同一個 NAT 後面的兩個人算出同一個雜湊而互相擋住。
-- ---------------------------------------------------------------------------

-- 舊資料可能有同一人對同一篇的多筆紀錄（不同 IP 各按一次），先收斂成一筆，
-- 否則下面的唯一索引建不起來。
delete from public.post_likes a
 using public.post_likes b
 where a.user_id is not null
   and a.user_id = b.user_id
   and a.post_id = b.post_id
   and a.ctid > b.ctid;

-- user_id 為 null 的匿名讚不受這個索引約束（唯一索引視 NULL 為互異），
-- 它們是舊制度的遺留，之後不會再產生。
create unique index if not exists post_likes_user_unique
  on public.post_likes (post_id, user_id);

update public.posts p
   set like_count = (select count(*) from public.post_likes l where l.post_id = p.id)
 where p.like_count <> (select count(*) from public.post_likes l where l.post_id = p.id);

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
  -- p_ip 與 p_user_agent 已不參與去重，保留參數只為不動到呼叫端的簽章。
  v_hash text;
  v_count int;
begin
  if p_user_id is null then
    raise exception '必須登入才能按讚' using errcode = 'insufficient_privilege';
  end if;

  if not exists (
    select 1 from public.posts where id = p_post_id and status = 'published'
  ) then
    raise exception '找不到可按讚的文章' using errcode = 'check_violation';
  end if;

  v_hash := encode(
    digest(p_user_id::text || '|' || public.current_analytics_salt(), 'sha256'),
    'hex'
  );

  if p_liked then
    insert into public.post_likes (post_id, visitor_hash, user_id)
    values (p_post_id, v_hash, p_user_id)
    on conflict (post_id, user_id) do nothing;
  else
    delete from public.post_likes
     where post_id = p_post_id and user_id = p_user_id;
  end if;

  select count(*) into v_count from public.post_likes where post_id = p_post_id;
  update public.posts set like_count = v_count where id = p_post_id;

  return v_count;
end;
$$;

-- ---------------------------------------------------------------------------
-- 發表留言
--
-- 兩處補強：
--   * 原本完全不檢查 p_target_id，任何人都能對草稿、隱藏的作品、甚至不存在
--     的 id 掛留言，也能無視 allow_comments。
--   * 父留言不再只靠 trigger 擋深度，這裡一併確認它屬於同一個目標。
--
-- 函式收回成只給 service_role 之後 auth.uid() 會是 null，因此改由 server 端
-- 傳入 p_user_id（那裡已經用 cookie session 驗過登入）。舊簽章一併移除，
-- 避免留下一個沒有這些檢查的重載版本。
-- ---------------------------------------------------------------------------
drop function if exists public.create_comment(text, uuid, text, uuid, text, text);

create or replace function public.create_comment(
  p_target_type text,
  p_target_id   uuid,
  p_content     text,
  p_parent_id   uuid default null,
  p_ip          text default null,
  p_user_agent  text default null,
  p_user_id     uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_banned     boolean;
  v_pending    boolean;
  v_allowed    boolean;
  v_parent_top boolean;
  v_id         uuid;
begin
  if p_user_id is null then
    raise exception '必須登入才能留言' using errcode = 'insufficient_privilege';
  end if;

  select is_banned into v_banned from public.profiles where user_id = p_user_id;
  if coalesce(v_banned, false) then
    raise exception '此帳號目前無法留言' using errcode = 'insufficient_privilege';
  end if;

  -- 目標必須存在、對外可見，而且開放留言。
  -- pages 沒有 allow_comments 欄位，可見即可留言。
  if p_target_type = 'post' then
    select p.allow_comments into v_allowed
      from public.posts p
     where p.id = p_target_id and p.status = 'published';
  elsif p_target_type = 'project' then
    select pr.allow_comments into v_allowed
      from public.projects pr
     where pr.id = p_target_id and pr.is_visible;
  elsif p_target_type = 'page' then
    select true into v_allowed
      from public.pages pg
     where pg.id = p_target_id and pg.status = 'published';
  else
    raise exception '留言目標類型不正確' using errcode = 'check_violation';
  end if;

  if v_allowed is null then
    raise exception '找不到可留言的目標' using errcode = 'check_violation';
  end if;
  if not v_allowed then
    raise exception '此內容未開放留言' using errcode = 'check_violation';
  end if;

  -- 回覆限兩層，且只能回覆同一個目標底下的頂層留言。
  if p_parent_id is not null then
    select c.parent_id is null into v_parent_top
      from public.comments c
     where c.id = p_parent_id
       and c.target_type = p_target_type
       and c.target_id = p_target_id
       and c.status = 'published';

    if v_parent_top is null then
      raise exception '找不到要回覆的留言' using errcode = 'check_violation';
    end if;
    if not v_parent_top then
      raise exception '留言最多兩層' using errcode = 'check_violation';
    end if;
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
    p_user_id,
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
-- 稽核紀錄
--
-- 同樣因為改走 service_role，auth.uid() 不再是操作者本人，行為者改由呼叫端
-- 傳入（`src/lib/audit.ts` 從 getAdminSession() 取）。
-- ---------------------------------------------------------------------------
drop function if exists public.write_audit_log(text, text, uuid, text, jsonb, text, text, text);

create or replace function public.write_audit_log(
  p_action       text,
  p_entity_type  text default null,
  p_entity_id    uuid default null,
  p_entity_label text default null,
  p_diff         jsonb default null,
  p_severity     text default 'info',
  p_ip_hash      text default null,
  p_user_agent   text default null,
  p_actor_id     uuid default null,
  p_actor_name   text default null
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
    p_actor_id,
    coalesce(
      p_actor_name,
      (select display_name from public.profiles where user_id = p_actor_id)
    ),
    p_action, p_entity_type, p_entity_id,
    p_entity_label, p_diff, p_ip_hash, p_user_agent, p_severity
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- 註冊時建立 profile
--
-- raw_user_meta_data 是使用者自己控制得了的（OAuth provider 的欄位、或是註冊
-- 時帶上的 metadata），原本直接入庫：暱稱可以無限長，avatar_url 可以指向任意
-- 網址，等於讓對方在站上任意頁面掛一個外部圖片來源。
-- ---------------------------------------------------------------------------
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
  v_name text;
begin
  -- 只信任 Google 與 GitHub 的頭像網域，其餘一律當作沒有頭像。
  if v_avatar is not null
     and v_avatar !~ '^https://(lh3\.googleusercontent\.com|avatars\.githubusercontent\.com)/'
  then
    v_avatar := null;
  end if;

  v_name := left(
    coalesce(
      nullif(new.raw_user_meta_data ->> 'display_name', ''),
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      nullif(new.raw_user_meta_data ->> 'name', ''),
      split_part(new.email, '@', 1)
    ),
    40
  );

  insert into public.profiles (user_id, display_name, avatar_url, avatar_source)
  values (
    new.id,
    v_name,
    v_avatar,
    case when v_avatar is null then 'generated' else 'oauth' end
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 收回寫入型 RPC 的執行權
--
-- 注意要連 PUBLIC 一起收：anon 與 authenticated 是 PUBLIC 的成員，只收前兩者
-- 仍然會從 PUBLIC 繼承回來。以函式名迴圈處理，重載版本一併涵蓋。
--
-- 保留給 anon／authenticated 的只有：
--   * search_all —— 唯讀，且查詢內已過濾 published。
--   * auth_role / is_editor / is_admin / is_owner —— RLS 政策本身要用，
--     收掉的話所有政策都會失效。
-- ---------------------------------------------------------------------------
do $$
declare
  fn record;
  locked text[] := array[
    'current_analytics_salt',   -- 洩漏當日的鹽等於讓人自行反推 visitor_hash
    'rotate_analytics_salt',
    'rollup_analytics',
    'prune_analytics',
    'record_pageview',
    'record_duration',
    'increment_view',
    'toggle_like',
    'create_comment',
    'write_audit_log',
    'list_cron_jobs'            -- 依環境而定，不存在時本迴圈自然跳過
  ];
begin
  for fn in
    select p.oid::regprocedure::text as signature
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname = any (locked)
  loop
    execute format('revoke all on function %s from public', fn.signature);
    execute format('revoke all on function %s from anon, authenticated', fn.signature);
    execute format('grant execute on function %s to service_role', fn.signature);
  end loop;
end;
$$;

grant execute on function public.search_all(text, text, int, int) to anon, authenticated;
grant execute on function public.auth_role() to anon, authenticated;
grant execute on function public.is_editor() to anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.is_owner() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- profiles：改用欄位級授權
--
-- `profiles_select_public using (true)` 把 role、is_banned、ban_reason、
-- bio、website、last_seen_at 全部對匿名公開；`profiles_update_self` 的
-- with check 只鎖 role，被封鎖者可以自己把 is_banned 改回 false。
--
-- RLS 是列層級，管不到「哪些欄位」，因此這裡改用 GRANT 的欄位清單：
-- 前台需要的只有留言作者的暱稱與頭像，本人另外看得到 notify_reply；
-- 其餘欄位只有 service_role 讀得到（後台查詢改走 service client）。
-- ---------------------------------------------------------------------------
revoke select, update on public.profiles from public;
revoke select, update on public.profiles from anon, authenticated;

grant select (user_id, display_name, avatar_url, avatar_source, created_at)
  on public.profiles to anon, authenticated;
grant select (notify_reply) on public.profiles to authenticated;

-- 使用者自己能改的就這兩欄（見 account-panel）；改角色與封鎖狀態一律走
-- Server Action 的 service client，授權在那裡以 requireRole 做。
grant update (display_name, notify_reply) on public.profiles to authenticated;

drop policy if exists profiles_select_public on public.profiles;
create policy profiles_select_public on public.profiles
  for select using (true);

-- 欄位授權已經把可寫範圍鎖死，政策只需要確認是本人那一列。
drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 留言的讚：不公開「誰按了哪一則」
-- ---------------------------------------------------------------------------
drop policy if exists comment_likes_select_public on public.comment_likes;
create policy comment_likes_select_self on public.comment_likes
  for select using (user_id = auth.uid() or public.is_editor());

-- ---------------------------------------------------------------------------
-- 轉址表：前台不需要
--
-- 它會把尚未公開的 slug（改名前後的路徑）洩漏出去。middleware 讀它時走
-- service client，因此這裡只留給 editor 以上。
-- ---------------------------------------------------------------------------
drop policy if exists redirects_select_public on public.redirects;
create policy redirects_select_editor on public.redirects
  for select using (public.is_editor());
