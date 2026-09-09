'use client';

import { useTransition } from 'react';

import { locales, localeLabels, type Locale } from '@/lib/i18n/config';
import { usePathname, useRouter } from '@/lib/i18n/routing';
import { cn } from '@/lib/utils';

/** 語言切換。切換後停留在對應頁面（規格 §14.1）。 */
export function LocaleSwitch({ current }: { current: Locale }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const select = (locale: Locale) => {
    if (locale === current) return;
    startTransition(() => {
      // usePathname 回傳的是不含語系前綴的路徑，直接沿用即可停在同一頁。
      router.replace(pathname, { locale });
    });
  };

  return (
    <div
      className="inline-flex shrink-0 overflow-hidden rounded-md border border-divider"
      role="group"
    >
      {locales.map((locale, index) => (
        <button
          key={locale}
          type="button"
          onClick={() => select(locale)}
          aria-current={locale === current ? 'true' : undefined}
          disabled={isPending}
          className={cn(
            'px-2.5 py-[5px] text-[14px] cursor-pointer transition-colors',
            index > 0 && 'border-l border-divider',
            locale === current ? 'bg-accent text-bg' : 'hover:bg-ink-8',
          )}
        >
          {localeLabels[locale]}
        </button>
      ))}
    </div>
  );
}
