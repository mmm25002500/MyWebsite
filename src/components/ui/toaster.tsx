'use client';

import { useEffect } from 'react';
import { Toaster as HotToaster } from 'react-hot-toast';

import { consumeFlash, toast } from '@/lib/toast';

/**
 * 全站的浮動提示。
 *
 * 樣式吃站上的 CSS 變數，所以淺色／深色切換時不必另外處理。react-hot-toast
 * 用 goober 在執行期注入 style，CSP 的 `style-src` 已放行 `'unsafe-inline'`。
 */
export function Toaster() {
  // 登入／登出是整頁重載，提示先存在 sessionStorage，這裡接手顯示。
  useEffect(() => {
    const flash = consumeFlash();
    if (!flash) return;
    if (flash.type === 'error') toast.error(flash.message);
    else toast.success(flash.message);
  }, []);

  return (
    <HotToaster
      position="bottom-right"
      gutter={10}
      toastOptions={{
        duration: 3000,
        style: {
          background: 'var(--color-surface)',
          color: 'var(--color-text)',
          border: '1px solid var(--color-divider)',
          borderRadius: 'var(--radius-lg)',
          fontSize: '15px',
          boxShadow: 'var(--shadow-md)',
          maxWidth: '420px',
        },
        success: { iconTheme: { primary: 'var(--color-accent)', secondary: 'var(--color-bg)' } },
        error: {
          duration: 5000,
          iconTheme: { primary: 'var(--color-accent-2)', secondary: 'var(--color-bg)' },
        },
      }}
    />
  );
}
