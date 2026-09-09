'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';

const SESSION_KEY = 'tershi.sessionId';
const SESSION_TS_KEY = 'tershi.sessionAt';
const SESSION_TTL_MS = 30 * 60 * 1000;

/** session id 存在 sessionStorage，30 分鐘無活動換新（規格 §11.2）。 */
function sessionId(): string {
  try {
    const now = Date.now();
    const last = Number(sessionStorage.getItem(SESSION_TS_KEY) ?? 0);
    let id = sessionStorage.getItem(SESSION_KEY);

    if (!id || now - last > SESSION_TTL_MS) {
      id = crypto.randomUUID();
      sessionStorage.setItem(SESSION_KEY, id);
    }
    sessionStorage.setItem(SESSION_TS_KEY, String(now));
    return id;
  } catch {
    return 'anonymous-session';
  }
}

/**
 * 自建流量分析的前端收集端（規格 §11.2）。
 * 無 cookie、不跨日追蹤，因此不需要同意橫幅。
 */
export function AnalyticsTracker({ locale }: { locale: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const enteredAt = useRef(Date.now());

  useEffect(() => {
    enteredAt.current = Date.now();
    const id = sessionId();

    void fetch('/api/analytics/collect', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        sessionId: id,
        path: pathname,
        locale,
        referrer: document.referrer || null,
        screenW: window.screen.width,
        screenH: window.screen.height,
        utm: {
          source: searchParams.get('utm_source') ?? undefined,
          medium: searchParams.get('utm_medium') ?? undefined,
          campaign: searchParams.get('utm_campaign') ?? undefined,
        },
      }),
    }).catch(() => {
      // 統計失敗不影響瀏覽。
    });

    const report = () => {
      const durationSec = Math.round((Date.now() - enteredAt.current) / 1000);
      if (durationSec <= 0) return;
      navigator.sendBeacon?.(
        '/api/analytics/beacon',
        new Blob([JSON.stringify({ sessionId: id, path: pathname, durationSec })], {
          type: 'application/json',
        }),
      );
    };

    window.addEventListener('pagehide', report);
    return () => {
      window.removeEventListener('pagehide', report);
      report();
    };
  }, [pathname, searchParams, locale]);

  return null;
}
