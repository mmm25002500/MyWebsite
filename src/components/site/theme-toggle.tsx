'use client';

import { MoonIcon, SunIcon } from '@phosphor-icons/react/dist/ssr';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';

type Theme = 'light' | 'dark';

function readTheme(): Theme {
  if (typeof document === 'undefined') return 'dark';
  return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
}

/**
 * 淺色／深色切換，選擇記在 localStorage（規格 §1 主題需求）。
 *
 * 切換時以 View Transition 從按鈕位置畫一個圓往外擴：新主題像是從按鈕「長出來」
 * 覆蓋整頁。瀏覽器不支援 View Transition，或使用者偏好減少動態時，就直接換色。
 */
export function ThemeToggle({ label }: { label: string }) {
  const [theme, setTheme] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setTheme(readTheme());
    setMounted(true);
  }, []);

  const applyTheme = (next: Theme) => {
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    document.documentElement.style.colorScheme = next;
    try {
      localStorage.setItem('tershi.theme', next);
    } catch {
      // 隱私模式下無法寫入，僅影響記憶，不影響本次切換。
    }
  };

  const toggle = async () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    // 型別定義把 startViewTransition 標成必有，實際上舊瀏覽器沒有，仍需檢查。
    const startViewTransition = document.startViewTransition?.bind(document);
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!startViewTransition || reduceMotion) {
      applyTheme(next);
      return;
    }

    // 圓心設在按鈕中央，半徑取到畫面最遠的角落，確保能蓋滿整頁。
    const rect = buttonRef.current?.getBoundingClientRect();
    const x = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
    const y = rect ? rect.top + rect.height / 2 : window.innerHeight / 2;
    const radius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    );

    const transition = startViewTransition(() => applyTheme(next));

    try {
      await transition.ready;
      document.documentElement.animate(
        {
          clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`],
        },
        {
          duration: 620,
          easing: 'cubic-bezier(0.2, 0.75, 0.2, 1)',
          pseudoElement: '::view-transition-new(root)',
        },
      );
    } catch {
      // View Transition 中途被取消時主題已經套用，不需要額外處理。
    }
  };

  return (
    <Button
      ref={buttonRef}
      variant="secondary"
      size="icon"
      onClick={toggle}
      title={label}
      aria-label={label}
      className="shrink-0"
    >
      {mounted && theme === 'dark' ? (
        <MoonIcon size={16} weight="duotone" />
      ) : (
        <SunIcon size={16} weight="duotone" />
      )}
    </Button>
  );
}
