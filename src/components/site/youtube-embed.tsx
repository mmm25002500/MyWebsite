'use client';

import { useEffect } from 'react';

/**
 * `lite-youtube-embed`：先顯示縮圖，點擊後才載入 iframe（規格 §3.1 `/videos`）。
 * 元素本身是 Web Component，因此以 client 端動態 import 註冊。
 */
export function YouTubeEmbed({
  youtubeId,
  title,
  playLabel,
}: {
  youtubeId: string;
  title: string;
  playLabel: string;
}) {
  useEffect(() => {
    void import('lite-youtube-embed');
  }, []);

  return (
    <lite-youtube
      videoid={youtubeId}
      playlabel={playLabel}
      params="modestbranding=1&rel=0"
      title={title}
      class="block w-full rounded-md"
    />
  );
}
