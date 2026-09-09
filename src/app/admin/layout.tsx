import type { Metadata } from 'next';
import { Huninn } from 'next/font/google';
import type { ReactNode } from 'react';

import { ThemeScript } from '@/components/site/theme-script';

import '@/styles/globals.css';

/**
 * 台灣圓體（jf open 粉圓 2.0）。只有 400 一個字重，標題的粗體由瀏覽器合成。
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

export const metadata: Metadata = {
  title: { default: '後台', template: '%s — TSX 後台' },
  robots: { index: false, follow: false },
};

// 後台一律動態渲染（規格 §4.2）。
export const dynamic = 'force-dynamic';

/**
 * 後台的最外層，只負責 `<html>` 與字體。
 *
 * **這裡不做登入守衛**：Next.js 的巢狀 layout 是組合而非覆寫，守衛寫在這層會
 * 一併套用到 `/admin/login`，未登入時就會轉址到自己身上形成無限迴圈。
 * 需要登入的頁面放在 `(dashboard)` route group，守衛寫在那一層。
 */
export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="zh-Hant-TW"
      className={huninn.variable}
      data-theme="dark"
      style={{ colorScheme: 'dark' }}
      suppressHydrationWarning
    >
      <head>
        <ThemeScript />
      </head>
      <body data-admin className="antialiased">
        {children}
      </body>
    </html>
  );
}
