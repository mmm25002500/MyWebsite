'use client';

import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { adsEnabled } from '@/lib/ads/config';
import { inConsentRegion, setAdsConsent, useAdsConsent } from '@/lib/ads/consent';

/**
 * 廣告同意橫幅。
 *
 * 只對可能位於 EEA／英國、而且還沒做過選擇的訪客顯示；其他地區看不到，
 * 站台維持原本沒有橫幅的樣子。判斷在 effect 內做，因此 SSR 輸出一律是 null，
 * 不會有 hydration 落差。
 */
export function AdsConsentBanner({
  title,
  description,
  accept,
  decline,
  privacyHref,
  privacyLabel,
}: {
  title: string;
  description: string;
  accept: string;
  decline: string;
  privacyHref: string;
  privacyLabel: string;
}) {
  const consent = useAdsConsent();
  const [needed, setNeeded] = useState(false);

  useEffect(() => {
    if (adsEnabled) setNeeded(inConsentRegion());
  }, []);

  if (!adsEnabled || !needed || consent !== null) return null;

  return (
    <div
      role="dialog"
      aria-label={title}
      className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-[560px] rounded-lg border border-divider bg-surface p-5 shadow-lg"
    >
      <p className="font-heading font-bold text-text">{title}</p>
      <p className="mt-1.5 text-[15px] text-ink-70">{description}</p>
      <div className="mt-4 flex flex-wrap items-center gap-2.5">
        <Button type="button" variant="primary" onClick={() => setAdsConsent('granted')}>
          {accept}
        </Button>
        <Button type="button" variant="secondary" onClick={() => setAdsConsent('denied')}>
          {decline}
        </Button>
        <a href={privacyHref} className="ml-auto text-[14px] text-ink-62 hover:text-accent">
          {privacyLabel}
        </a>
      </div>
    </div>
  );
}
