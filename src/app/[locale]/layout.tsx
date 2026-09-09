import type { Metadata } from 'next';
import { Huninn } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';

import { ThemeScript } from '@/components/site/theme-script';
import { siteUrl } from '@/lib/env';
import { htmlLang, isLocale, locales, type Locale } from '@/lib/i18n/config';

import '@/styles/globals.css';
import 'katex/dist/katex.min.css';

/**
 * 台灣圓體（jf open 粉圓 2.0）。
 *
 * 只有 400 一個字重，因此標題的粗體交給瀏覽器合成——`font-synthesis-weight`
 * 在 globals.css 保持開啟，關掉的話所有標題會跟內文一樣細。
 */
const huninn = Huninn({
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
  variable: '--font-huninn',
  // Next.js 沒有 Huninn 的字幅資料，無法自動產生 fallback 的 size-adjust，
  // 關掉以免每次建置都跳警告；fallback 由 CSS 的字型清單負責。
  adjustFontFallback: false,
});

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  const t = await getTranslations({ locale });

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: `${t('site.name')} ${t('site.nameEn')}`,
      template: `%s — ${t('site.name')}`,
    },
    description: t('site.role'),
    alternates: {
      canonical: locale === 'zh-TW' ? '/' : `/${locale}`,
      languages: Object.fromEntries(
        locales.map((item) => [htmlLang[item], item === 'zh-TW' ? '/' : `/${item}`]),
      ),
    },
    openGraph: {
      type: 'website',
      siteName: t('site.name'),
      locale: htmlLang[locale as Locale],
    },
    twitter: { card: 'summary_large_image', creator: t('site.twitter') },
    robots: { index: true, follow: true },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html
      lang={htmlLang[locale]}
      className={huninn.variable}
      data-theme="dark"
      style={{ colorScheme: 'dark' }}
      suppressHydrationWarning
    >
      <head>
        <ThemeScript />
      </head>
      <body className="antialiased">
        <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
