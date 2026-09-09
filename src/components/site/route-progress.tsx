'use client';

import NextTopLoader from 'nextjs-toploader';

/**
 * 換頁進度條。
 *
 * 用 `nextjs-toploader` 而非 `nextjs-progressbar`：後者是 Pages Router 時代的
 * 套件，靠 `Router.events` 運作，App Router 沒有那組事件，裝了也不會動。
 * 這個套件是同一個東西的 App Router 版本。
 */
export function RouteProgress() {
  return (
    <NextTopLoader
      color="#00FFFE"
      height={2}
      showSpinner={false}
      shadow="0 0 10px #00FFFE, 0 0 5px #00FFFE"
      crawlSpeed={200}
      speed={200}
    />
  );
}
