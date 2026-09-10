import 'server-only';

import type { VideoItem } from '@/types/content';

/**
 * YouTube 資料抓取（規格 §5.5）。
 *
 * 抽成共用函式讓 API 代理與資料層都能直接呼叫。**資料層不要改成打自己的
 * `/api/youtube`**：建置與 ISR 重新產生頁面時沒有伺服器在監聽，`fetch` 會拿到
 * 開發伺服器的 HTML 或直接失敗，`response.json()` 就會拋錯。
 *
 * 沒有設定 `YOUTUBE_API_KEY` 或 `YOUTUBE_CHANNEL_ID` 時回傳空陣列。
 */

interface PlaylistItem {
  contentDetails: { videoId: string };
}

/** YouTube API 回傳的影片形狀，與站內的 VideoItem 不同。 */
interface YoutubeVideo {
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

export async function fetchYoutubeVideos(): Promise<{
  videos: VideoItem[];
  subscriberCount: number;
}> {
  const key = process.env.YOUTUBE_API_KEY;
  const channelId = process.env.YOUTUBE_CHANNEL_ID;
  if (!key || !channelId) return { videos: [], subscriberCount: 0 };

  const options = { next: { revalidate: 21600 } } as const;
  const empty = { videos: [], subscriberCount: 0 };

  const channelResponse = await fetch(
    `https://www.googleapis.com/youtube/v3/channels?part=contentDetails,statistics&id=${channelId}&key=${key}`,
    options,
  );
  if (!channelResponse.ok) return empty;

  const channel = (await channelResponse.json()) as {
    items?: {
      contentDetails: { relatedPlaylists: { uploads: string } };
      statistics: { subscriberCount?: string };
    }[];
  };
  const uploads = channel.items?.[0]?.contentDetails.relatedPlaylists.uploads;
  if (!uploads) return empty;

  const playlistResponse = await fetch(
    `https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&playlistId=${uploads}&maxResults=50&key=${key}`,
    options,
  );
  if (!playlistResponse.ok) return empty;

  const playlist = (await playlistResponse.json()) as { items?: PlaylistItem[] };
  const ids = (playlist.items ?? []).map((item) => item.contentDetails.videoId);
  if (ids.length === 0) return empty;

  const videosResponse = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${ids.join(',')}&key=${key}`,
    options,
  );
  if (!videosResponse.ok) return empty;

  const payload = (await videosResponse.json()) as { items?: YoutubeVideo[] };

  return {
    videos: (payload.items ?? []).map((item) => ({
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
      category: null,
      isFeatured: false,
    })),
    subscriberCount: Number(channel.items?.[0]?.statistics.subscriberCount ?? 0),
  };
}
