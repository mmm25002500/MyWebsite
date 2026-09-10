'use client';

import { useEffect, useState } from 'react';

/**
 * 讓元素在關閉時還能把退場動畫播完。
 *
 * 直接依 `open` 決定要不要 render 的話，關閉那一刻 DOM 就消失了，退場動畫
 * 沒有機會播。這裡把「還要不要留在畫面上」與「現在是不是正在關」分開：
 * 呼叫端用 `mounted` 決定 render、用 `closing` 換成退場的動畫 class。
 *
 * 使用者偏好減少動態時不等待，直接卸載。
 */
export function useExitTransition(open: boolean, durationMs: number) {
  const [mounted, setMounted] = useState(open);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      setClosing(false);
      return;
    }

    if (!mounted) return;

    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduceMotion) {
      setMounted(false);
      return;
    }

    setClosing(true);
    const timer = setTimeout(() => {
      setMounted(false);
      setClosing(false);
    }, durationMs);

    return () => clearTimeout(timer);
  }, [open, mounted, durationMs]);

  return { mounted, closing };
}
