'use client';

import { toast } from 'react-hot-toast';

/**
 * 動作結果的統一提示。
 *
 * 後台的 Server Action 一律回 `{ ok, error? }`，這裡把它翻成一則 toast，
 * 免得每個元件各自維護一份 `message` state 與顯示位置。
 */
export function toastResult(
  result: { ok: boolean; error?: string },
  successMessage = '已儲存',
): boolean {
  if (result.ok) toast.success(successMessage);
  else toast.error(result.error ?? '操作失敗');
  return result.ok;
}

export { toast };

/**
 * 跨頁面重載的一次性提示。
 *
 * 登入與登出都是整頁重載（`window.location`），直接 toast 會隨著舊頁面一起
 * 消失。改成先寫進 sessionStorage，新頁面掛載時再顯示一次就清掉。
 */
const FLASH_KEY = 'tershi.flash';

export function setFlash(message: string, type: 'success' | 'error' = 'success'): void {
  try {
    sessionStorage.setItem(FLASH_KEY, JSON.stringify({ message, type }));
  } catch {
    // 隱私模式寫不進去，只是少一則提示。
  }
}

export function consumeFlash(): { message: string; type: 'success' | 'error' } | null {
  try {
    const raw = sessionStorage.getItem(FLASH_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(FLASH_KEY);
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;
    const { message, type } = parsed as { message?: unknown; type?: unknown };
    if (typeof message !== 'string') return null;
    return { message, type: type === 'error' ? 'error' : 'success' };
  } catch {
    return null;
  }
}
