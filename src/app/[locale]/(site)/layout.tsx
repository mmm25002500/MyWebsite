import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Suspense, type ReactNode } from 'react';

import { AdsConsentBanner } from '@/components/ads/consent-banner';
import { AdsenseScript } from '@/components/ads/adsense-script';
import { AnalyticsTracker } from '@/components/site/analytics-tracker';
import { RouteProgress } from '@/components/site/route-progress';
import { SiteChrome } from '@/components/site/site-chrome';
import { SiteFooter } from '@/components/site/site-footer';
import { isLocale } from '@/lib/i18n/config';

export default async function SiteLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  setRequestLocale(locale);
  const t = await getTranslations({ locale });

  return (
    <div className="min-h-screen bg-bg text-text">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-accent focus:px-4 focus:py-2 focus:text-bg"
      >
        {t('common.skipToContent')}
      </a>
      <RouteProgress />
      <SiteChrome locale={locale} />
      <Suspense fallback={null}>
        <AnalyticsTracker locale={locale} />
      </Suspense>
      <main id="main">{children}</main>
      <SiteFooter locale={locale} />
      <AdsenseScript />
      <AdsConsentBanner
        title={t('ads.consentTitle')}
        description={t('ads.consentDescription')}
        accept={t('ads.consentAccept')}
        decline={t('ads.consentDecline')}
        privacyHref={locale === 'zh-TW' ? '/privacy' : `/${locale}/privacy`}
        privacyLabel={t('ads.consentPrivacy')}
      />
    </div>
  );
}
