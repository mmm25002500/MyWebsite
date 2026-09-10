import type { MetadataRoute } from 'next';

import { siteUrl } from '@/lib/env';
import {
  getAllPostSlugs,
  getAllProjectSlugs,
  getCategories,
  getOrganizations,
  getSeriesList,
  getTags,
} from '@/lib/data';
import { defaultLocale, htmlLang, locales, type Locale } from '@/lib/i18n/config';

export const revalidate = 3600;

const staticPaths = [
  '',
  '/about',
  '/notes',
  '/notes/archive',
  '/projects',
  '/resume',
  '/videos',
  '/links',
  '/sponsor',
  '/organizations',
  '/contact',
  '/changelog',
  '/privacy',
  '/terms',
];

function url(locale: Locale, path: string): string {
  const prefix = locale === defaultLocale ? '' : `/${locale}`;
  return `${siteUrl}${prefix}${path}`;
}

/** 依語系分別列出（規格 §14.3），並互相標註 hreflang。 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    const [posts, projects, categories, tags, organizations, series] = await Promise.all([
      getAllPostSlugs(locale),
      getAllProjectSlugs(locale),
      getCategories(locale),
      getTags(locale),
      getOrganizations(locale),
      getSeriesList(locale),
    ]);

    const paths = [
      ...staticPaths,
      ...categories.map((category) => `/notes/c/${category.slug}`),
      ...tags.filter((tag) => tag.postCount > 0).map((tag) => `/notes/tag/${tag.slug}`),
      ...series.map((item) => `/notes/series/${item.slug}`),
      ...posts.map((slug) => `/notes/p/${slug}`),
      ...projects.map((slug) => `/projects/${slug}`),
      ...organizations.map((org) => `/organizations/${org.slug}`),
    ];

    for (const path of paths) {
      entries.push({
        url: url(locale, path),
        changeFrequency: path === '' || path === '/notes' ? 'daily' : 'weekly',
        priority: path === '' ? 1 : path.startsWith('/notes/p/') ? 0.8 : 0.6,
        alternates: {
          // 用 `htmlLang` 而不是語系代碼本身，才會與頁面 <link rel="alternate">
          // 標的值一致（zh-Hant-TW，不是 zh-TW）；兩邊對不上，Google 有機會
          // 只採信其中一組。`x-default` 也要跟著補，同樣比照頁面上的宣告。
          languages: {
            ...Object.fromEntries(locales.map((item) => [htmlLang[item], url(item, path)])),
            'x-default': url(defaultLocale, path),
          },
        },
      });
    }
  }

  return entries;
}
