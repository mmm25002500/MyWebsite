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

/**
 * 台灣圓體（jf open 粉圓 2.0）。
 *
 * 只有 400 一個字重，因此標題的粗體交給瀏覽器合成——`font-synthesis-weight`
 * 在 globals.css 保持開啟，關掉的話所有標題會跟內文一樣細。
 */
const huninn = Huninn({
  subsets: ['latin'],
  weight: '400',
  /*
   * `optional` 而不是 `swap`。
   *
   * Huninn 是中文字型，Google Fonts 把它切成一百多個片段，一頁中文要抓十幾個。
   * `swap` 會先用系統字型畫出整頁，再隨著每個片段到達重畫一次——實測從第一次
   * 繪製（2.5s）到最後一個片段落地（3.5s）之間，版面會反覆重排將近一秒。
   *
   * `optional` 讓瀏覽器只等約 100ms：沒趕上就整頁維持系統字型、**這次不再替換**，
   * 字型仍在背景下載並快取，下一頁與下次造訪就是圓體。代價是首次造訪的人看到的
   * 是蘋方／思源黑體。
   */
  display: 'optional',
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
    /*
     * 這裡刻意不放 alternates：metadata 是淺層合併，寫在 layout 會被每一個
     * 沒有自己宣告的子頁沿用，全站的 canonical 就都變成首頁。改由各頁用
     * `pageAlternates()` 自己給。
     */
    openGraph: {
      type: 'website',
      siteName: t('site.name'),
      locale: htmlLang[locale as Locale],
      images: ['/api/og'],
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
