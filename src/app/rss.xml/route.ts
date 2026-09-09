import { getTranslations } from 'next-intl/server';

import { getPosts } from '@/lib/data';
import { siteUrl } from '@/lib/env';
import { defaultLocale, isLocale, type Locale } from '@/lib/i18n/config';

export const revalidate = 3600;

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** 分語系 RSS（規格 §14.3）。`?locale=en` 取英文版。 */
export async function GET(request: Request) {
  const requested = new URL(request.url).searchParams.get('locale');
  const locale: Locale = requested && isLocale(requested) ? requested : defaultLocale;
  const prefix = locale === defaultLocale ? '' : `/${locale}`;

  const t = await getTranslations({ locale });
  const feedTitle = `${t('site.name')} ${t('site.nameEn')}`.trim();

  const posts = await getPosts({ locale, pageSize: 30 });

  const items = posts.items
    .map((post) => {
      const link = `${siteUrl}${prefix}/notes/p/${post.slug}`;
      const categories = post.categories
        .map((category) => `    <category>${escapeXml(category.name)}</category>`)
        .join('\n');
      return `  <item>
    <title>${escapeXml(post.title)}</title>
    <link>${link}</link>
    <guid isPermaLink="true">${link}</guid>
    ${post.publishedAt ? `<pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate>` : ''}
    <description>${escapeXml(post.excerpt ?? '')}</description>
${categories}
  </item>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>${escapeXml(feedTitle)}</title>
  <link>${siteUrl}${prefix}</link>
  <description>${escapeXml(t('site.role'))}</description>
  <language>${locale}</language>
  <atom:link href="${siteUrl}/rss.xml${locale === defaultLocale ? '' : `?locale=${locale}`}" rel="self" type="application/rss+xml" />
${items}
</channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'content-type': 'application/rss+xml; charset=utf-8',
      'cache-control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
