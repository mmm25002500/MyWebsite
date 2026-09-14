'use client';

import type { ReactNode } from 'react';

/**
 * 會回報點擊次數的外部連結（連結樹的按鈕）。
 *
 * 網址保持直連：滑鼠移上去看到的就是真正的目的地，也不必多繞一趟轉址。點擊時
 * 以 `navigator.sendBeacon` 在背景送出一筆記錄——瀏覽器保證頁面離開後仍會送達，
 * 不會拖慢跳轉。爬蟲不執行 JavaScript，因此不會把數字灌高。
 *
 * 中鍵、Ctrl／⌘ 點擊（在新分頁開啟）也算一次點擊，所以用 `onAuxClick` 一併處理；
 * 右鍵選單則不算，那只是打開選單，不代表真的造訪。
 */
export function TrackedLink({
  buttonId,
  href,
  className,
  children,
}: {
  buttonId: string;
  href: string;
  className?: string;
  children: ReactNode;
}) {
  const report = () => {
    try {
      const body = new Blob([JSON.stringify({ buttonId })], { type: 'application/json' });
      navigator.sendBeacon('/api/links/click', body);
    } catch {
      // 回報失敗不影響跳轉。
    }
  };

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={report}
      onAuxClick={(event) => {
        if (event.button === 1) report();
      }}
    >
      {children}
    </a>
  );
}
