-- 擴充套件與全域輔助函式。
-- 規格 §6.13、§10、§15。

-- Supabase 預設把擴充裝在 extensions schema，這裡沿用同一個位置，
-- 需要用到 digest()／gen_random_bytes() 的函式會把它加進 search_path。
create schema if not exists extensions;

create extension if not exists pgcrypto with schema extensions;   -- digest()、gen_random_bytes()
create extension if not exists pg_trgm with schema extensions;    -- 中文子字串搜尋（§10）
create extension if not exists unaccent with schema extensions;   -- 去變音符號，須在 tsvector 之前

-- ---------------------------------------------------------------------------
-- updated_at 維護
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

comment on function public.set_updated_at is
  '所有表共用的 updated_at 觸發器函式（規格 §6.0）。';

-- ---------------------------------------------------------------------------
-- 共用型別約束
-- ---------------------------------------------------------------------------
create domain public.locale_code as text
  check (value in ('zh-TW', 'en'));

comment on domain public.locale_code is
  '內容語系。第一期為 zh-TW 與 en（規格 §6.0）。';
