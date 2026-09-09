'use client';

import { useSyncExternalStore } from 'react';

type ColorScheme = 'light' | 'dark';

/**
 * 目前的主題。ThemeScript 與 ThemeToggle 都是直接改 `<html data-theme>`，
 * 沒有 context 可以訂閱，所以這裡用 MutationObserver 盯住那個屬性。
 *
 * 給需要「自己也換一套色」的元件用——大部分元件靠 CSS 變數就會自動跟著變，
 * 只有像 CodeMirror 這種把顏色編進 JS 設定的第三方元件需要明確拿到值。
 */
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  });
  return () => observer.disconnect();
}

function getSnapshot(): ColorScheme {
  return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
}

/** 伺服器端沒有 DOM，回傳與 SSR `<html data-theme>` 一致的預設值。 */
function getServerSnapshot(): ColorScheme {
  return 'dark';
}

export function useColorScheme(): ColorScheme {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
