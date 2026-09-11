import type { Metadata } from 'next';

import { htmlLang, defaultLocale } from '@/lib/i18n/config';
import { noIndex } from '@/lib/seo';

export const metadata: Metadata = { title: '404', robots: noIndex };

/**
 * 根層的 404，只在網址連 `[locale]` 都進不去時才會用到（例如中介層 matcher
 * 排除的路徑）。
 *
 * 根 layout 不輸出 `<html>`（那是 `[locale]/layout.tsx` 的工作，因為 `lang`
 * 要依語系決定），因此這一頁必須自己輸出整份文件。也因為拿不到語系與站台
 * 資料，樣式直接內嵌、不依賴設計系統的 CSS bundle——這是一條理論上不該被走到
 * 的路徑，能站得住比好看重要。
 */
export default function RootNotFound() {
  return (
    <html lang={htmlLang[defaultLocale]} style={{ colorScheme: 'dark' }}>
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          background: '#141414',
          color: '#fafafa',
          fontFamily: 'system-ui, -apple-system, "Noto Sans TC", sans-serif',
          textAlign: 'center',
          padding: '2rem',
        }}
      >
        <main>
          <p
            style={{
              margin: 0,
              fontSize: 'clamp(72px,18vw,150px)',
              lineHeight: 0.85,
              opacity: 0.14,
            }}
          >
            404
          </p>
          <h1 style={{ margin: '0.5rem 0 0', fontSize: '1.5rem' }}>找不到頁面</h1>
          <p style={{ margin: '0.75rem 0 1.75rem', opacity: 0.62 }}>
            這個網址不存在，或內容已經移除。
          </p>
          {/*
            刻意用原生 <a> 而不是 next/link：這一頁自己輸出整份文件、不在應用外殼
            之內，需要的是一次完整的導航把讀者送回正常的 layout，不是 client-side
            的路由切換。
          */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            href="/"
            style={{
              display: 'inline-block',
              padding: '0.6rem 1.4rem',
              borderRadius: '0.5rem',
              background: '#00ddff',
              color: '#141414',
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            回到首頁
          </a>
        </main>
      </body>
    </html>
  );
}
