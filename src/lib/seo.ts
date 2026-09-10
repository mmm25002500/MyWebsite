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
