import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { clientIp } from '@/lib/analytics/request';
import { checkRateLimit } from '@/lib/cache/ratelimit';
import { searchAll } from '@/lib/data';
import { defaultLocale, isLocale } from '@/lib/i18n/config';

export const dynamic = 'force-dynamic';

const querySchema = z.object({
  q: z.string().trim().min(1).max(120),
  locale: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
  offset: z.coerce.number().int().min(0).max(500).optional(),
});

/**
 * 去掉 LIKE 的萬用字元。
 *
 * 搜尋最終會走到 SQL 的模糊比對，`%` 與 `_` 在那裡有意義：單獨送一個 `%`
 * 等於「全部給我」，可以繞過分頁一次撈光整站內容，也是很省力的 DoS。
 * 這兩個字元在搜尋詞裡沒有實際用途，直接拿掉。
 */
function stripWildcards(input: string): string {
  return input.replace(/[%_]/g, '').trim();
}

export async function GET(request: NextRequest) {
  const { success } = await checkRateLimit('search', clientIp(request.headers), 30, 60);
  if (!success) return NextResponse.json({ results: [] }, { status: 429 });

  const parsed = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) return NextResponse.json({ results: [] });

  const { locale, limit, offset } = parsed.data;
  const q = stripWildcards(parsed.data.q);
  // 一個字的查詢命中率極低卻要掃全表，兩個字以上才送出去。
  if (q.length < 2) return NextResponse.json({ results: [] });

  const resolved = locale && isLocale(locale) ? locale : defaultLocale;

  const results = await searchAll(resolved, q, { limit, offset });
  return NextResponse.json({ results }, { headers: { 'Cache-Control': 'private, max-age=30' } });
}
