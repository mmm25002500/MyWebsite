'use client';

import { useEffect, useState } from 'react';

import { adsEnabled, adsenseClient } from '@/lib/ads/config';
import { inConsentRegion, useAdsConsent } from '@/lib/ads/consent';

const SCRIPT_ID = 'adsbygoogle-js';

/**
 * 載入 adsbygoogle.js。全站只掛一次（放在 site layout）。
 *
 * EEA 訪客在做出選擇之前**不載入**這支腳本——非個人化廣告一樣會放 cookie，
 * 在取得同意前連載都不該載。非 EEA 則直接載入。
 *
 * 腳本自己插進 DOM 而不用 next/script：Turnstile 那邊實測過 lazyOnload 的
 * script 標籤根本不會被插入（見 components/site/turnstile.tsx）。
 */
export function AdsenseScript() {
  const consent = useAdsConsent();
  const [region, setRegion] = useState<'unknown' | 'consent-required' | 'free'>('unknown');

  useEffect(() => {
    setRegion(inConsentRegion() ? 'consent-required' : 'free');
  }, []);

  const allowed = region === 'free' || consent !== null;
  const personalized = region === 'free' || consent === 'granted';

  useEffect(() => {
    if (!adsEnabled || !allowed) return;
    if (document.getElementById(SCRIPT_ID)) return;

    // 必須在腳本載入前就宣告，否則第一批廣告請求還是會帶個人化參數。
    window.adsbygoogle = window.adsbygoogle ?? [];
    if (!personalized) window.adsbygoogle.requestNonPersonalizedAds = 1;

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(adsenseClient)}`;
    script.async = true;
    script.crossOrigin = 'anonymous';
    document.head.appendChild(script);
  }, [allowed, personalized]);

  return null;
}
