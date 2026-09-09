'use client';

import { useEffect, useState } from 'react';

import { cn } from '@/lib/utils';
import type { TocItem } from '@/types/content';

/** 側欄目錄，捲動時高亮目前章節；行動版由外層收合。 */
export function TableOfContents({ items, label }: { items: TocItem[]; label: string }) {
  const [activeId, setActiveId] = useState<string | null>(items[0]?.id ?? null);

  useEffect(() => {
    if (items.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      // 上緣留出頁首高度，讓「目前章節」與視覺一致。
      { rootMargin: '-90px 0px -70% 0px', threshold: 0 },
    );

    for (const item of items) {
      const element = document.getElementById(item.id);
      if (element) observer.observe(element);
    }

    return () => observer.disconnect();
  }, [items]);

  if (items.length === 0) return null;

  return (
    <nav aria-label={label} className="text-[15px]">
      <p className="font-heading text-kicker font-bold uppercase text-ink-55">{label}</p>
      <ul className="mt-3 space-y-1.5 border-l border-divider">
        {items.map((item) => (
          <li key={item.id} style={{ paddingLeft: `${(item.depth - 2) * 12 + 12}px` }}>
            <a
              href={`#${item.id}`}
              className={cn(
                '-ml-px block border-l-2 py-0.5 pl-3 leading-snug transition-colors',
                activeId === item.id
                  ? 'border-accent text-accent'
                  : 'border-transparent text-ink-62 hover:text-text',
              )}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
