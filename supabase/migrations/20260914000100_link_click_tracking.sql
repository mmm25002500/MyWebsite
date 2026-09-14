-- ---------------------------------------------------------------------------
-- 連結樹的點擊記錄
--
-- 原本全站沒有任何地方寫入 link_buttons.click_count，後台永遠顯示 0；
-- link_clicks 則有一條開給匿名訪客直接寫入的政策，沒有速率限制，也不會讓計數
-- 增加。改成唯一的寫入路徑是 /api/links/click（同源檢查＋速率限制），由它以
-- service role 呼叫這個函式。
-- ---------------------------------------------------------------------------

create or replace function public.record_link_click(
  p_button_id  uuid,
  p_ip         text,
  p_user_agent text,
  p_referrer   text default null
) returns boolean
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_updated int;
begin
  -- 按鈕不存在或已隱藏時不計，避免有人對任意 id 灌數字。
  update public.link_buttons
     set click_count = click_count + 1
   where id = p_button_id
     and is_visible;
  get diagnostics v_updated = row_count;
  if v_updated = 0 then
    return false;
  end if;

  -- 訪客雜湊與瀏覽分析同一套：以當日的鹽在資料庫內計算，鹽不外流到應用層。
  insert into public.link_clicks (button_id, visitor_hash, referrer)
  values (
    p_button_id,
    encode(
      digest(coalesce(p_ip, '') || '|' || coalesce(p_user_agent, '') || '|' ||
             public.current_analytics_salt(), 'sha256'),
      'hex'
    ),
    left(p_referrer, 512)
  );

  return true;
end;
$$;

revoke execute on function public.record_link_click(uuid, text, text, text)
  from public, anon, authenticated;
grant execute on function public.record_link_click(uuid, text, text, text) to service_role;

-- 唯一的寫入路徑是上面的函式，不再開放匿名直接寫入。
drop policy if exists link_clicks_insert_public on public.link_clicks;

-- 點擊 +1 不該改動 updated_at——那個欄位代表「內容最後修改時間」。後台存檔不會
-- 動到 click_count，因此以「click_count 沒變」作為觸發條件即可區分兩者。
drop trigger if exists link_buttons_set_updated_at on public.link_buttons;
create trigger link_buttons_set_updated_at
  before update on public.link_buttons
  for each row
  when (old.click_count is not distinct from new.click_count)
  execute function public.set_updated_at();
