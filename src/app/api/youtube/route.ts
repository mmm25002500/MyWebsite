import { NextResponse, type NextRequest } from 'next/server';

import { clientIp } from '@/lib/analytics/visitor';
import { checkRateLimit } from '@/lib/cache/ratelimit';
import { fetchYoutubeVideos } from '@/lib/data/youtube';

export const revalidate = 21600;

/**
 * YouTube 資料代理（規格 §5.5）。
 * API Key 只在 server 端使用，前端一律打這支；實際抓取在 `@/lib/data/youtube`。
 */
export async function GET(request: NextRequest) {
  const { success } = await checkRateLimit('youtube', clientIp(request.headers), 30, 60);
  if (!success) return NextResponse.json({ videos: [] }, { status: 429 });

  const { videos, subscriberCount } = await fetchYoutubeVideos();

  return NextResponse.json(
    { videos, subscriberCount },
    { headers: { 'Cache-Control': 'public, s-maxage=21600, stale-while-revalidate=86400' } },
  );
}
