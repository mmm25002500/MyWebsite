'use client';

import Script from 'next/script';
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
 */
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

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="lazyOnload"
        onReady={() => setScriptReady(true)}
      />
      <div ref={containerRef} id={id} />
    </>
  );
}
