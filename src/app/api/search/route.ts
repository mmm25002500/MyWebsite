import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { searchAll } from '@/lib/data';
import { defaultLocale, isLocale } from '@/lib/i18n/config';

export const dynamic = 'force-dynamic';

const querySchema = z.object({
  q: z.string().trim().min(1).max(120),
  locale: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
  offset: z.coerce.number().int().min(0).max(500).optional(),
});

export async function GET(request: NextRequest) {
  const parsed = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) return NextResponse.json({ results: [] });

  const { q, locale, limit, offset } = parsed.data;
  const resolved = locale && isLocale(locale) ? locale : defaultLocale;

  const results = await searchAll(resolved, q, { limit, offset });
  return NextResponse.json({ results }, { headers: { 'Cache-Control': 'private, max-age=30' } });
}
