'use client';

import { useEffect, useRef } from 'react';

import { adSlots, adsEnabled, adsenseClient, type AdSlotName } from '@/lib/ads/config';
import { inConsentRegion, useAdsConsent } from '@/lib/ads/consent';
import { cn } from '@/lib/utils';

/**
 * 單一廣告版位。
 *
 * 沒設定 client id 或這個版位的 slot id 時整個不渲染——不會留下空白區塊，
 * 也不會出現「廣告載入中」之類的佔位文字。
 */
export function AdSlot({
  name,
  format = 'auto',
  className,
  label,
}: {
  name: AdSlotName;
  format?: 'auto' | 'fluid' | 'rectangle';
  className?: string;
  label?: string;
}) {
  const slot = adSlots[name];
  const consent = useAdsConsent();
  const pushed = useRef(false);
  const insRef = useRef<HTMLModElement>(null);

  useEffect(() => {
    if (!adsEnabled || !slot || pushed.current) return;
    // 尚未取得同意的 EEA 訪客不推送，否則廣告框會在腳本缺席時空轉。
    if (inConsentRegion() && consent === null) return;
    if (!insRef.current) return;

    try {
      window.adsbygoogle = window.adsbygoogle ?? [];
      window.adsbygoogle.push({});
      pushed.current = true;
    } catch {
      // 被廣告阻擋器擋掉是常態，不需要讓頁面知道。
    }
  }, [slot, consent]);

  if (!adsEnabled || !slot) return null;

  return (
    <aside className={cn('my-8', className)} aria-label={label ?? '廣告'}>
      {label ? (
        <p className="mb-1.5 font-heading text-kicker uppercase text-ink-45">{label}</p>
      ) : null}
      <ins
        ref={insRef}
        className="adsbygoogle block"
        style={{ display: 'block' }}
        data-ad-client={adsenseClient}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </aside>
  );
}
