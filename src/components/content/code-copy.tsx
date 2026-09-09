'use client';

import { useEffect } from 'react';

/**
 * 幫文章內每個程式碼區塊加上複製按鈕。
 *
 * 內文是後台預渲染好的 HTML 字串，不是 JSX，因此按鈕在客戶端掛載後才注入。
 * 這樣做的好處是文章本身仍然零 client JS：只有真的有程式碼區塊的頁面才有這段。
 */
export function CodeCopyButtons({ label, copiedLabel }: { label: string; copiedLabel: string }) {
  useEffect(() => {
    const blocks = document.querySelectorAll<HTMLElement>('.prose-content .content-codeblock');
    const cleanups: (() => void)[] = [];

    for (const block of blocks) {
      if (block.querySelector('.content-copy-button')) continue;

      const code = block.querySelector('code');
      if (!code) continue;

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'content-copy-button';
      button.textContent = label;

      let resetTimer: ReturnType<typeof setTimeout> | undefined;

      const onClick = async () => {
        try {
          await navigator.clipboard.writeText(code.innerText);
          button.textContent = copiedLabel;
          clearTimeout(resetTimer);
          resetTimer = setTimeout(() => {
            button.textContent = label;
          }, 2000);
        } catch {
          // 沒有剪貼簿權限時不做事，使用者仍可手動選取。
        }
      };

      button.addEventListener('click', onClick);
      block.appendChild(button);

      cleanups.push(() => {
        clearTimeout(resetTimer);
        button.removeEventListener('click', onClick);
        button.remove();
      });
    }

    return () => {
      for (const cleanup of cleanups) cleanup();
    };
  }, [label, copiedLabel]);

  return null;
}
