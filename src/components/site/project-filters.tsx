'use client';

import { useSearchParams } from 'next/navigation';

import { Link, usePathname } from '@/lib/i18n/routing';
import { cn } from '@/lib/utils';

interface FilterOption {
  value: string;
  label: string;
}

/**
 * 作品集篩選列。以連結切換（不需 JavaScript 即可運作），
 * 只用 client hook 讀目前的 query 來標示選取狀態。
 */
export function ProjectFilters({
  groups,
}: {
  groups: { key: string; label: string; allLabel: string; options: FilterOption[] }[];
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const hrefWith = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete('page');
    const search = params.toString();
    return search ? `${pathname}?${search}` : pathname;
  };

  return (
    <div className="space-y-3">
      {groups
        .filter((group) => group.options.length > 0)
        .map((group) => {
          const current = searchParams.get(group.key);
          return (
            <div key={group.key} className="flex flex-wrap items-baseline gap-2">
              <span className="w-16 shrink-0 font-heading text-kicker font-bold uppercase text-ink-55">
                {group.label}
              </span>
              <div className="flex flex-wrap gap-1.5">
                <Link
                  href={hrefWith(group.key, null)}
                  className={cn(
                    'rounded-md px-2.5 py-1 text-[14px] transition-colors',
                    current === null ? 'bg-accent text-bg' : 'text-text hover:bg-ink-8',
                  )}
                >
                  {group.allLabel}
                </Link>
                {group.options.map((option) => (
                  <Link
                    key={option.value}
                    href={hrefWith(group.key, option.value)}
                    className={cn(
                      'rounded-md px-2.5 py-1 text-[14px] transition-colors',
                      current === option.value ? 'bg-accent text-bg' : 'text-text hover:bg-ink-8',
                    )}
                  >
                    {option.label}
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
    </div>
  );
}
