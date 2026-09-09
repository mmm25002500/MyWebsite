import { NextResponse, type NextRequest } from 'next/server';

import { clientIp } from '@/lib/analytics/visitor';
import { checkRateLimit } from '@/lib/cache/ratelimit';

export const revalidate = 21600;

interface PlaylistItem {
  contentDetails: { videoId: string };
}

interface VideoItem {
  id: string;
  snippet: {
    title: string;
    description: string;
    publishedAt: string;
    thumbnails: Record<string, { url: string } | undefined>;
  };
  statistics: { viewCount?: string };
  contentDetails: { duration: string };
}

/** ISO 8601 期間（PT1H2M3S）轉秒。 */
function parseDuration(value: string): number {
  const match = /^P(?:(\d+)D)?T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(value);
  if (!match) return 0;
  const [, days, hours, minutes, seconds] = match;
  return (
    Number(days ?? 0) * 86400 +
    Number(hours ?? 0) * 3600 +
    Number(minutes ?? 0) * 60 +
    Number(seconds ?? 0)
  );
}

/**
 * YouTube 資料代理（規格 §5.5）。
 * API Key 只在 server 端使用，前端一律打這支。
 */
export async function GET(request: NextRequest) {
  const { success } = await checkRateLimit('youtube', clientIp(request.headers), 30, 60);
  if (!success) return NextResponse.json({ videos: [] }, { status: 429 });

  const key = process.env.YOUTUBE_API_KEY;
  const channelId = process.env.YOUTUBE_CHANNEL_ID;
  if (!key || !channelId) return NextResponse.json({ videos: [] });

  const options = { next: { revalidate: 21600 } } as const;

  const channelResponse = await fetch(
    `https://www.googleapis.com/youtube/v3/channels?part=contentDetails,statistics&id=${channelId}&key=${key}`,
    options,
  );
  if (!channelResponse.ok) return NextResponse.json({ videos: [] }, { status: 502 });

  const channel = (await channelResponse.json()) as {
    items?: {
      contentDetails: { relatedPlaylists: { uploads: string } };
      statistics: { subscriberCount?: string };
    }[];
  };
  const uploads = channel.items?.[0]?.contentDetails.relatedPlaylists.uploads;
  if (!uploads) return NextResponse.json({ videos: [] });

  const playlistResponse = await fetch(
    `https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&playlistId=${uploads}&maxResults=50&key=${key}`,
    options,
  );
  if (!playlistResponse.ok) return NextResponse.json({ videos: [] }, { status: 502 });

  const playlist = (await playlistResponse.json()) as { items?: PlaylistItem[] };
  const ids = (playlist.items ?? []).map((item) => item.contentDetails.videoId);
  if (ids.length === 0) return NextResponse.json({ videos: [] });

  const videosResponse = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${ids.join(',')}&key=${key}`,
    options,
  );
  if (!videosResponse.ok) return NextResponse.json({ videos: [] }, { status: 502 });

  const payload = (await videosResponse.json()) as { items?: VideoItem[] };

  const videos = (payload.items ?? []).map((item) => ({
    youtubeId: item.id,
    title: item.snippet.title,
    description: item.snippet.description,
    publishedAt: item.snippet.publishedAt,
    viewCount: Number(item.statistics.viewCount ?? 0),
    durationSeconds: parseDuration(item.contentDetails.duration),
    thumbnailUrl:
      item.snippet.thumbnails.maxres?.url ??
      item.snippet.thumbnails.high?.url ??
      item.snippet.thumbnails.default?.url ??
      '',
  }));

  return NextResponse.json(
    { videos, subscriberCount: Number(channel.items?.[0]?.statistics.subscriberCount ?? 0) },
    { headers: { 'Cache-Control': 'public, s-maxage=21600, stale-while-revalidate=86400' } },
  );
}
