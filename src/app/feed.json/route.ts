import { getTranslations } from 'next-intl/server';

import { getPosts } from '@/lib/data';
import { siteUrl } from '@/lib/env';
import { defaultLocale, isLocale, type Locale } from '@/lib/i18n/config';

export const revalidate = 3600;

/** JSON Feed 1.1。 */
export async function GET(request: Request) {
  const requested = new URL(request.url).searchParams.get('locale');
  const locale: Locale = requested && isLocale(requested) ? requested : defaultLocale;
  const prefix = locale === defaultLocale ? '' : `/${locale}`;

  const t = await getTranslations({ locale });
  const feedTitle = `${t('site.name')} ${t('site.nameEn')}`.trim();

  const posts = await getPosts({ locale, pageSize: 30 });

  return Response.json(
    {
      version: 'https://jsonfeed.org/version/1.1',
      title: feedTitle,
      home_page_url: `${siteUrl}${prefix}`,
      feed_url: `${siteUrl}/feed.json${locale === defaultLocale ? '' : `?locale=${locale}`}`,
      language: locale,
      authors: [{ name: t('site.name'), url: siteUrl }],
      items: posts.items.map((post) => ({
        id: `${siteUrl}${prefix}/notes/p/${post.slug}`,
        url: `${siteUrl}${prefix}/notes/p/${post.slug}`,
        title: post.title,
        summary: post.excerpt ?? undefined,
        date_published: post.publishedAt ?? undefined,
        date_modified: post.updatedAt ?? undefined,
        tags: post.tags.map((tag) => tag.name),
      })),
    },
    {
      headers: {
        'cache-control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    },
  );
}
