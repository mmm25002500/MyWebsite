import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { clientIp } from '@/lib/analytics/visitor';
import { checkRateLimit } from '@/lib/cache/ratelimit';
import { getProjects } from '@/lib/data';
import { defaultLocale, isLocale } from '@/lib/i18n/config';

export const revalidate = 600;

const querySchema = z.object({
  locale: z.string().optional(),
  page: z.coerce.number().int().min(1).max(200).optional(),
});

export async function GET(request: NextRequest) {
  const { success } = await checkRateLimit('api-v1', clientIp(request.headers), 60, 60);
  if (!success) return NextResponse.json({ error: 'rate_limited' }, { status: 429 });

  const parsed = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) return NextResponse.json({ error: 'bad_request' }, { status: 400 });

  const locale =
    parsed.data.locale && isLocale(parsed.data.locale) ? parsed.data.locale : defaultLocale;

  const result = await getProjects({ locale, page: parsed.data.page });

  return NextResponse.json({
    page: result.page,
    totalPages: result.totalPages,
    total: result.total,
    items: result.items.map((project) => ({
      slug: project.slug,
      name: project.name,
      tagline: project.tagline,
      status: project.status,
      startedAt: project.startedAt,
      endedAt: project.endedAt,
      category: project.categorySlug,
      organization: project.organizationSlug,
      tags: project.tags.map((tag) => tag.slug),
      githubRepo: project.githubRepo,
    })),
  });
}
