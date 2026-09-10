'use client';

import { useSyncExternalStore } from 'react';

/**
 * 廣告同意狀態。
 *
 * Google 的 EU user consent policy 要求對 EEA／英國的訪客投放廣告前先取得
 * 同意。這裡的處理是：
 *
 * - 非 EEA：直接投放個人化廣告，不打擾訪客，也不顯示橫幅。
 * - EEA 且尚未選擇：**完全不載入廣告腳本**，只顯示橫幅。
 * - EEA 選擇「不同意」：以非個人化模式投放（`requestNonPersonalizedAds`）。
 *
 * 選擇存在 localStorage 而不是 cookie——它只需要留在這台裝置上，不需要跟著
 * 每個請求送到伺服器。
 */
export type AdsConsent = 'granted' | 'denied';

const STORAGE_KEY = 'tershi.ads.consent';

/**
 * 是否可能位於 EEA／英國。
 *
 * 以瀏覽器時區判斷，不打任何 IP 查詢服務，也不需要讓頁面退出靜態快取。
 * 這是個粗略的判斷：用 VPN 或把時區調成別處的人會被判錯，因此取用時一律
 * 往嚴格的方向靠——判斷不出來就當作需要同意。
 */
export function inConsentRegion(): boolean {
  try {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!timeZone) return true;
    return /^(Europe|Atlantic\/(Canary|Madeira|Azores|Faroe|Reykjavik))/.test(timeZone);
  } catch {
    return true;
  }
}

function read(): AdsConsent | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === 'granted' || value === 'denied' ? value : null;
  } catch {
    // 隱私模式讀不到，視同尚未選擇。
    return null;
  }
}

const listeners = new Set<() => void>();

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  // 同一個站台開多個分頁時，另一個分頁的選擇也要跟著生效。
  window.addEventListener('storage', onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener('storage', onChange);
  };
}

export function setAdsConsent(value: AdsConsent): void {
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // 寫不進去只影響記憶，本次選擇仍然生效。
  }
  for (const listener of listeners) listener();
}

export function useAdsConsent(): AdsConsent | null {
  return useSyncExternalStore(subscribe, read, () => null);
}
