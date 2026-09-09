import type { MetadataRoute } from 'next';

import { siteUrl } from '@/lib/env';
import {
  getAllPostSlugs,
  getAllProjectSlugs,
  getCategories,
  getOrganizations,
  getTags,
} from '@/lib/data';
import { defaultLocale, locales, type Locale } from '@/lib/i18n/config';

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
    const [posts, projects, categories, tags, organizations] = await Promise.all([
      getAllPostSlugs(locale),
      getAllProjectSlugs(locale),
      getCategories(locale),
      getTags(locale),
      getOrganizations(locale),
    ]);

    const paths = [
      ...staticPaths,
      ...categories.map((category) => `/notes/c/${category.slug}`),
      ...tags.filter((tag) => tag.postCount > 0).map((tag) => `/notes/tag/${tag.slug}`),
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
          languages: Object.fromEntries(locales.map((item) => [item, url(item, path)])),
        },
      });
    }
  }

  return entries;
}
