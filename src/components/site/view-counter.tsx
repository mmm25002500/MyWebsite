'use client';

import { useEffect } from 'react';

/**
 * 非同步回報瀏覽數，不阻塞渲染（規格 §4.2）。
 * 同一位訪客 24 小時內只計一次，去重在伺服器端以 visitor hash 判斷。
 */
export function ViewCounter({ type, id }: { type: 'post' | 'project'; id: string }) {
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      void fetch(`/api/views/${type}/${id}`, {
        method: 'POST',
        signal: controller.signal,
        keepalive: true,
      }).catch(() => {
        // 統計失敗不影響閱讀。
      });
    }, 1500);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [type, id]);

  return null;
}
