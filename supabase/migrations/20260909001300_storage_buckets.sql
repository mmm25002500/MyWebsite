-- Storage buckets。
-- 規格 §6.13。
--
-- 注意：**沒有 avatars bucket** —— 頭像不開放上傳（規格 §5.3），
-- 一律由 OAuth 帶入或系統依暱稱產生。

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('media',        'media',        true,  10485760, array['image/png','image/jpeg','image/webp','image/avif','image/gif']),
  ('links',        'links',        true,   2097152, array['image/png','image/jpeg','image/webp','image/avif','image/gif']),
  ('sponsors',     'sponsors',     true,   2097152, array['image/png','image/jpeg','image/webp','image/avif']),
  ('certificates', 'certificates', false, 10485760, array['image/png','image/jpeg','application/pdf']),
  ('backups',      'backups',      false, 104857600, array['application/zip'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- 公開 bucket：任何人可讀，只有 editor 以上可寫。
-- SVG 不在允許的 MIME 清單內（規格 §13.3：禁止上傳 SVG）。
do $$
declare
  b text;
begin
  foreach b in array array['media', 'links', 'sponsors'] loop
    execute format(
      'create policy %I on storage.objects for select using (bucket_id = %L)',
      b || '_read_public', b
    );
    execute format(
      'create policy %I on storage.objects for insert with check (bucket_id = %L and public.is_editor())',
      b || '_insert_editor', b
    );
    execute format(
      'create policy %I on storage.objects for update using (bucket_id = %L and public.is_editor())',
      b || '_update_editor', b
    );
    execute format(
      'create policy %I on storage.objects for delete using (bucket_id = %L and public.is_admin())',
      b || '_delete_admin', b
    );
  end loop;
end;
$$;

-- 私有 bucket：只有 admin 以上，且一律以 signed URL 存取。
do $$
declare
  b text;
begin
  foreach b in array array['certificates', 'backups'] loop
    execute format(
      'create policy %I on storage.objects for select using (bucket_id = %L and public.is_admin())',
      b || '_read_admin', b
    );
    execute format(
      'create policy %I on storage.objects for insert with check (bucket_id = %L and public.is_admin())',
      b || '_insert_admin', b
    );
    execute format(
      'create policy %I on storage.objects for delete using (bucket_id = %L and public.is_owner())',
      b || '_delete_owner', b
    );
  end loop;
end;
$$;
