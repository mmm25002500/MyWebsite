import { hasSupabase } from '@/lib/env';
import { createPublicClient } from '@/lib/supabase/public';

/**
 * 資料來源判斷。憑證齊全時走 Supabase，否則走 seed。
 * 這個旗標在 build 時就決定，不會在單次請求中改變。
 */
export const usingSeed = !hasSupabase;

/** 匿名讀取用的 client。 */
export function publicClient() {
  if (usingSeed) {
    throw new Error('Supabase 憑證未設定，呼叫端應先檢查 usingSeed');
  }
  return createPublicClient();
}

/** 統一的查詢錯誤處理：記錄後往上拋，讓 Next.js 的錯誤邊界接手。 */
export function assertOk<T>(
  result: { data: T | null; error: { message: string } | null },
  context: string,
): T {
  if (result.error) {
    throw new Error(`[data] ${context}: ${result.error.message}`);
  }
  if (result.data === null) {
    throw new Error(`[data] ${context}: 查詢沒有回傳資料`);
  }
  return result.data;
}

/**
 * 把查詢結果轉成資料層自己的列型別。
 *
 * supabase-js 對含有嵌套關聯的 select 推導出的型別，與我們要映射成的形狀不完全
 * 一致（巢狀關聯依基數可能是物件或陣列）。這是資料層唯一的轉換點——轉換後的資料
 * 只在同一個函式內映射成 `@/types/content` 的領域型別，不會以未定型的樣子離開。
 */
export function rows<T>(data: unknown): T[] {
  return (data ?? []) as T[];
}
