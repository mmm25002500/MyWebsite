import { defaultLocale, htmlLang, locales, type Locale } from '@/lib/i18n/config';

/**
 * 每一頁的 canonical 與 hreflang（規格 §14.2）。
 *
 * 這件事必須逐頁做，不能只寫在 layout：Next.js 的 metadata 是淺層合併，
 * 子頁沒有宣告 `alternates` 就會整個沿用父層的，結果全站每一頁都指向首頁，
 * 等於主動告訴搜尋引擎「這些都是首頁的重複內容」。
 *
 * @param path 不含語系前綴的路徑，首頁傳空字串。
 */
export function pageAlternates(locale: Locale, path: string) {
  return {
    canonical: localePath(locale, path),
    languages: {
      ...Object.fromEntries(locales.map((item) => [htmlLang[item], localePath(item, path)])),
      // 語系不匹配時的預設，指向不帶前綴的中文版。
      'x-default': localePath(defaultLocale, path),
    },
  };
}

/** 加上語系前綴的站內路徑；預設語系不帶前綴。 */
export function localePath(locale: Locale, path: string): string {
  const prefix = locale === defaultLocale ? '' : `/${locale}`;
  return `${prefix}${path}` || '/';
}

/** 不該進索引的頁面：搜尋結果、個人頁與登入註冊。 */
export const noIndex = {
  index: false,
  follow: true,
  googleBot: { index: false, follow: true },
} as const;

/**
 * 找不到內容時的 metadata。
 *
 * 這些頁面雖然呼叫了 `notFound()`，HTTP 狀態卻仍然是 200：路由有預先渲染的
 * 參數時，Next.js 會先把 shell 串流出去，狀態列在那一刻就送出了，之後頁面才
 * 決定要 404，改不回來。因此改以 noindex 明說「別收錄」，免得 Google 把它當
 * 成正常頁面（soft 404）收進索引。
 */
export const notFoundMetadata = { title: '404', robots: noIndex } as const;
