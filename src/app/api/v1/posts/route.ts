import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { clientIp } from '@/lib/analytics/visitor';
import { checkRateLimit } from '@/lib/cache/ratelimit';
import { getPosts } from '@/lib/data';
import { defaultLocale, isLocale } from '@/lib/i18n/config';

export const revalidate = 600;

const querySchema = z.object({
  locale: z.string().optional(),
  category: z.string().max(80).optional(),
  tag: z.string().max(80).optional(),
  page: z.coerce.number().int().min(1).max(200).optional(),
});

/** 對外唯讀 JSON API（規格 §5.1）。只輸出公開欄位。 */
export async function GET(request: NextRequest) {
  const { success } = await checkRateLimit('api-v1', clientIp(request.headers), 60, 60);
  if (!success) return NextResponse.json({ error: 'rate_limited' }, { status: 429 });

  const parsed = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) return NextResponse.json({ error: 'bad_request' }, { status: 400 });

  const locale =
    parsed.data.locale && isLocale(parsed.data.locale) ? parsed.data.locale : defaultLocale;

  const result = await getPosts({
    locale,
    categorySlug: parsed.data.category,
    tagSlug: parsed.data.tag,
    page: parsed.data.page,
  });

  return NextResponse.json({
    page: result.page,
    totalPages: result.totalPages,
    total: result.total,
    items: result.items.map((post) => ({
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      publishedAt: post.publishedAt,
      updatedAt: post.updatedAt,
      readingTimeMin: post.readingTimeMin,
      categories: post.categories.map((category) => category.slug),
      tags: post.tags.map((tag) => tag.slug),
    })),
  });
}
