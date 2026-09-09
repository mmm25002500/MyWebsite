'use client';

import { Link, usePathname } from '@/lib/i18n/routing';
import { cn } from '@/lib/utils';
import type { Category } from '@/types/content';

/**
 * 筆記分類 Tab。桌機一列平鋪；行動版橫向可捲動，左右以遮罩提示還有內容
 * （規格 §3.1 `/notes`）。
 */
export function CategoryTabs({
  categories,
  allLabel,
}: {
  categories: Category[];
  allLabel: string;
}) {
  const pathname = usePathname();
  const activeSlug = pathname.startsWith('/notes/c/') ? pathname.split('/')[3] : null;

  return (
    <div className="relative">
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-linear-to-r from-bg to-transparent md:hidden"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-linear-to-l from-bg to-transparent md:hidden"
        aria-hidden="true"
      />
      <nav className="flex gap-2 overflow-x-auto no-scrollbar py-1 md:flex-wrap">
        <Link
          href="/notes"
          aria-current={activeSlug === null ? 'page' : undefined}
          className={cn(
            'shrink-0 whitespace-nowrap rounded-md px-3 py-1.5 text-[15px] transition-colors',
            activeSlug === null ? 'bg-accent text-bg' : 'text-text hover:bg-ink-8',
          )}
        >
          {allLabel}
        </Link>
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/notes/c/${category.slug}`}
            aria-current={activeSlug === category.slug ? 'page' : undefined}
            className={cn(
              'shrink-0 whitespace-nowrap rounded-md px-3 py-1.5 text-[15px] transition-colors',
              activeSlug === category.slug ? 'bg-accent text-bg' : 'text-text hover:bg-ink-8',
            )}
          >
            {category.name}
            {category.postCount > 0 ? (
              <span className="ml-1.5 text-[13px] opacity-60">{category.postCount}</span>
            ) : null}
          </Link>
        ))}
      </nav>
    </div>
  );
}
