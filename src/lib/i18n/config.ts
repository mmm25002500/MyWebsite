export const locales = ['zh-TW', 'en'] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'zh-TW';

/** 供 `<html lang>` 與 hreflang 使用的 BCP 47 標籤。 */
export const htmlLang: Record<Locale, string> = {
  'zh-TW': 'zh-Hant-TW',
  en: 'en',
};

export const localeLabels: Record<Locale, string> = {
  'zh-TW': '中',
  en: 'EN',
};

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}
