'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string;
          theme?: 'light' | 'dark' | 'auto';
          language?: string;
          callback?: (token: string) => void;
          'expired-callback'?: () => void;
          'error-callback'?: () => void;
        },
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
  }
}

/**
 * Cloudflare Turnstile（規格 §13.3）。
 *
 * 以明確渲染（`turnstile.render`）而非 `data-callback` 屬性：後者需要一個掛在
 * window 上的全域函式，而 CSP 只放行帶 nonce 的行內腳本，宣告不了那種全域。
 *
 * 未設定 `NEXT_PUBLIC_TURNSTILE_SITE_KEY` 時整個元件不渲染，表單照常可用——
 * 後端在沒有 secret 時也會放行，兩邊的預設一致。
 *
 * api.js 是自己插進 DOM 的，不走 `next/script`：實測 `lazyOnload` 的 script
 * 標籤根本沒有被插入，widget 位置就一直空著。這裡只需要「載入一次、好了叫我」，
 * 自己做反而短。
 */
const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

/** 同一頁可能有多個 widget，共用一份 api.js。 */
function loadTurnstileScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.turnstile) return Promise.resolve();

  const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('turnstile script failed')));
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.addEventListener('load', () => resolve());
    script.addEventListener('error', () => reject(new Error('turnstile script failed')));
    document.head.appendChild(script);
  });
}
export function Turnstile({
  onToken,
  resetSignal,
}: {
  onToken: (token: string | null) => void;
  resetSignal?: number;
}) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [scriptReady, setScriptReady] = useState(false);
  const id = useId();

  const render = useCallback(() => {
    if (!siteKey || !window.turnstile || !containerRef.current) return;
    if (widgetIdRef.current !== null) return;

    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      theme: 'auto',
      language: 'zh-tw',
      callback: (token) => onToken(token),
      'expired-callback': () => onToken(null),
      'error-callback': () => onToken(null),
    });
  }, [siteKey, onToken]);

  useEffect(() => {
    if (!siteKey) return;
    let cancelled = false;
    loadTurnstileScript()
      .then(() => {
        if (!cancelled) setScriptReady(true);
      })
      .catch(() => onToken(null));
    return () => {
      cancelled = true;
    };
  }, [siteKey, onToken]);

  useEffect(() => {
    if (scriptReady) render();
  }, [scriptReady, render]);

  useEffect(() => {
    if (resetSignal === undefined || widgetIdRef.current === null) return;
    window.turnstile?.reset(widgetIdRef.current);
    onToken(null);
  }, [resetSignal, onToken]);

  useEffect(() => {
    return () => {
      if (widgetIdRef.current !== null) {
        window.turnstile?.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, []);

  if (!siteKey) return null;

  return <div ref={containerRef} id={id} />;
}
