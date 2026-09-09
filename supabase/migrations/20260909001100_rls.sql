-- Row Level Security。
-- 規格 §6.12：RLS 是最後一道防線，Server Action 內仍會再檢查一次角色。

-- ---------------------------------------------------------------------------
-- 一律先開啟 RLS。沒有政策的表等於全部拒絕，因此下面逐一補上。
-- ---------------------------------------------------------------------------
do $$
declare
  t record;
begin
  for t in
    select tablename
      from pg_tables
     where schemaname = 'public'
  loop
    execute format('alter table public.%I enable row level security', t.tablename);
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- 公開可讀的內容表
--
-- 這些表的資料本來就要出現在前台，因此匿名可讀；寫入一律限 editor 以上。
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
  public_read_tables text[] := array[
    'categories', 'categories_i18n',
    'tags', 'tags_i18n',
    'series', 'series_i18n',
    'project_categories', 'project_categories_i18n',
    'project_images', 'project_images_i18n',
    'project_links', 'project_links_i18n',
    'project_tags', 'project_posts',
    'post_tags', 'post_categories', 'post_related',
    'organizations', 'organizations_i18n',
    'experiences', 'experiences_i18n',
    'education', 'education_i18n',
    'skill_groups', 'skill_groups_i18n', 'skills',
    'certifications', 'certifications_i18n',
    'languages_spoken', 'languages_spoken_i18n',
    'interests', 'interests_i18n',
    'timeline_events', 'timeline_events_i18n',
    'video_meta', 'video_meta_i18n',
    'link_groups', 'link_groups_i18n',
    'link_buttons', 'link_buttons_i18n',
    'sponsor_methods', 'sponsor_methods_i18n',
    'sponsors', 'sponsors_i18n',
    'changelog_entries', 'changelog_entries_i18n',
    'page_sections', 'page_sections_i18n',
    'media', 'media_i18n',
    'redirects'
  ];
begin
  foreach t in array public_read_tables loop
    execute format('create policy %I on public.%I for select using (true)',
                   t || '_select_public', t);
    execute format('create policy %I on public.%I for insert with check (public.is_editor())',
                   t || '_insert_editor', t);
    execute format('create policy %I on public.%I for update using (public.is_editor()) with check (public.is_editor())',
                   t || '_update_editor', t);
    execute format('create policy %I on public.%I for delete using (public.is_admin())',
                   t || '_delete_admin', t);
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- 文章：只有已發佈的可被匿名讀取
-- ---------------------------------------------------------------------------
create policy posts_select_published on public.posts
  for select using (status = 'published' or public.is_editor());

create policy posts_write_editor on public.posts
  for insert with check (public.is_editor());
create policy posts_update_editor on public.posts
  for update using (public.is_editor()) with check (public.is_editor());
create policy posts_delete_owner on public.posts
  for delete using (public.is_owner());

create policy posts_i18n_select_published on public.posts_i18n
  for select using (
    exists (
      select 1 from public.posts p
       where p.id = posts_i18n.post_id
         and (p.status = 'published' or public.is_editor())
    )
  );

create policy posts_i18n_write_editor on public.posts_i18n
  for insert with check (public.is_editor());
create policy posts_i18n_update_editor on public.posts_i18n
  for update using (public.is_editor()) with check (public.is_editor());
create policy posts_i18n_delete_owner on public.posts_i18n
  for delete using (public.is_owner());

-- 讚：任何人都可以按（去重靠 visitor_hash），但只能透過 RPC 寫入。
create policy post_likes_select_public on public.post_likes
  for select using (true);

-- ---------------------------------------------------------------------------
-- 作品集
-- ---------------------------------------------------------------------------
create policy projects_select_visible on public.projects
  for select using (is_visible or public.is_editor());
create policy projects_insert_editor on public.projects
  for insert with check (public.is_editor());
create policy projects_update_editor on public.projects
  for update using (public.is_editor()) with check (public.is_editor());
create policy projects_delete_owner on public.projects
  for delete using (public.is_owner());

create policy projects_i18n_select_visible on public.projects_i18n
  for select using (
    exists (
      select 1 from public.projects p
       where p.id = projects_i18n.project_id
         and (p.is_visible or public.is_editor())
    )
  );
create policy projects_i18n_insert_editor on public.projects_i18n
  for insert with check (public.is_editor());
create policy projects_i18n_update_editor on public.projects_i18n
  for update using (public.is_editor()) with check (public.is_editor());
create policy projects_i18n_delete_owner on public.projects_i18n
  for delete using (public.is_owner());

-- ---------------------------------------------------------------------------
-- 單頁
-- ---------------------------------------------------------------------------
create policy pages_select_published on public.pages
  for select using (status = 'published' or public.is_editor());
create policy pages_insert_editor on public.pages
  for insert with check (public.is_editor());
create policy pages_update_editor on public.pages
  for update using (public.is_editor()) with check (public.is_editor());
create policy pages_delete_owner on public.pages
  for delete using (public.is_owner());

create policy pages_i18n_select_published on public.pages_i18n
  for select using (
    exists (
      select 1 from public.pages p
       where p.id = pages_i18n.page_id
         and (p.status = 'published' or public.is_editor())
    )
  );
create policy pages_i18n_insert_editor on public.pages_i18n
  for insert with check (public.is_editor());
create policy pages_i18n_update_editor on public.pages_i18n
  for update using (public.is_editor()) with check (public.is_editor());
create policy pages_i18n_delete_owner on public.pages_i18n
  for delete using (public.is_owner());

-- ---------------------------------------------------------------------------
-- 站台設定：公開讀（敏感金鑰只放環境變數，不進 DB），僅 owner 可改
-- ---------------------------------------------------------------------------
create policy site_settings_select_public on public.site_settings
  for select using (true);
create policy site_settings_insert_owner on public.site_settings
  for insert with check (public.is_owner());
create policy site_settings_update_owner on public.site_settings
  for update using (public.is_owner()) with check (public.is_owner());
create policy site_settings_delete_owner on public.site_settings
  for delete using (public.is_owner());

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create policy profiles_select_public on public.profiles
  for select using (true);

-- 本人可改自己的資料，但不得改 role；角色變更一律走 owner。
create policy profiles_update_self on public.profiles
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and role = public.auth_role());

create policy profiles_update_owner on public.profiles
  for update using (public.is_owner()) with check (public.is_owner());

create policy profiles_delete_owner on public.profiles
  for delete using (public.is_owner() and role <> 'owner');

-- ---------------------------------------------------------------------------
-- 留言
-- ---------------------------------------------------------------------------
create policy comments_select_published on public.comments
  for select using (
    status = 'published'
    or user_id = auth.uid()
    or public.is_editor()
  );

-- 發表一律走 create_comment RPC（會檢查封鎖與預審），這裡只允許本人的軟刪除與編輯。
create policy comments_update_self on public.comments
  for update
  using (
    (user_id = auth.uid() and created_at > now() - interval '15 minutes')
    or public.is_editor()
  )
  with check (
    (user_id = auth.uid() and created_at > now() - interval '15 minutes')
    or public.is_editor()
  );

create policy comments_delete_admin on public.comments
  for delete using (public.is_admin());

create policy comment_likes_select_public on public.comment_likes
  for select using (true);
create policy comment_likes_insert_self on public.comment_likes
  for insert with check (user_id = auth.uid());
create policy comment_likes_delete_self on public.comment_likes
  for delete using (user_id = auth.uid());

create policy comment_reports_insert_authenticated on public.comment_reports
  for insert with check (auth.uid() is not null);
create policy comment_reports_select_admin on public.comment_reports
  for select using (public.is_admin());
create policy comment_reports_update_admin on public.comment_reports
  for update using (public.is_admin()) with check (public.is_admin());

create policy user_bans_select_admin on public.user_bans
  for select using (public.is_admin() or user_id = auth.uid());
create policy user_bans_write_admin on public.user_bans
  for insert with check (public.is_admin());
create policy user_bans_update_admin on public.user_bans
  for update using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- 聯絡訊息：任何人可送出，只有 admin 以上看得到
-- ---------------------------------------------------------------------------
create policy contact_messages_insert_public on public.contact_messages
  for insert with check (true);
create policy contact_messages_select_admin on public.contact_messages
  for select using (public.is_admin());
create policy contact_messages_update_admin on public.contact_messages
  for update using (public.is_admin()) with check (public.is_admin());
create policy contact_messages_delete_owner on public.contact_messages
  for delete using (public.is_owner());

-- ---------------------------------------------------------------------------
-- 訂閱：任何人可訂閱，名單只有 admin 看得到
-- ---------------------------------------------------------------------------
create policy subscribers_insert_public on public.subscribers
  for insert with check (true);
create policy subscribers_select_admin on public.subscribers
  for select using (public.is_admin());
create policy subscribers_update_admin on public.subscribers
  for update using (public.is_admin()) with check (public.is_admin());
create policy subscribers_delete_admin on public.subscribers
  for delete using (public.is_admin());

-- ---------------------------------------------------------------------------
-- 分析：寫入走 SECURITY DEFINER 的 RPC，讀取限 admin
-- ---------------------------------------------------------------------------
create policy analytics_events_select_admin on public.analytics_events
  for select using (public.is_admin());
create policy analytics_daily_select_admin on public.analytics_daily
  for select using (public.is_admin());
create policy analytics_daily_dimensions_select_admin on public.analytics_daily_dimensions
  for select using (public.is_admin());
create policy link_clicks_select_admin on public.link_clicks
  for select using (public.is_admin());
create policy link_clicks_insert_public on public.link_clicks
  for insert with check (true);

-- analytics_salt 與 view_dedup 完全不對外：沒有政策等於全部拒絕，
-- 只有 SECURITY DEFINER 的函式碰得到。

-- ---------------------------------------------------------------------------
-- 稽核紀錄：不可竄改（規格 §15.2）
--
-- 只有 SELECT 政策；INSERT 走 write_audit_log()（security definer），
-- UPDATE 與 DELETE 一概沒有政策，因此對任何角色都是拒絕。
-- ---------------------------------------------------------------------------
create policy audit_logs_select_admin on public.audit_logs
  for select using (public.is_admin());

create policy content_revisions_select_editor on public.content_revisions
  for select using (public.is_editor());
create policy content_revisions_insert_editor on public.content_revisions
  for insert with check (public.is_editor());

create policy user_sessions_meta_select_self on public.user_sessions_meta
  for select using (user_id = auth.uid() or public.is_admin());
