'use client';

import { MagnifyingGlassIcon } from '@phosphor-icons/react/dist/ssr';
import { useTranslations } from 'next-intl';

import { LocaleSwitch } from '@/components/site/locale-switch';
import { navItems } from '@/components/site/nav-items';
import { ThemeToggle } from '@/components/site/theme-toggle';
import { UserMenu } from '@/components/site/user-menu';
import type { Locale } from '@/lib/i18n/config';
import { Link, usePathname } from '@/lib/i18n/routing';
import { cn } from '@/lib/utils';

export function SiteHeader({ locale, onOpenSearch }: { locale: Locale; onOpenSearch: () => void }) {
  const t = useTranslations();
  const pathname = usePathname();

  const isCurrent = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-40 bg-bg/[0.88] backdrop-blur-[10px]">
      <div className="w-full max-w-page mx-auto flex items-center gap-4 px-[22px] py-3.5 md:px-11">
        <Link
          href="/"
          className="shrink-0 font-heading text-[20px] font-bold tracking-[0.06em] text-text hover:text-accent"
        >
          TSX
        </Link>

        <nav
          className="flex min-w-0 flex-1 items-center gap-4 overflow-x-auto no-scrollbar"
          aria-label={t('nav.home')}
        >
          {navItems.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              aria-current={isCurrent(item.href) ? 'page' : undefined}
              className={cn(
                'shrink-0 whitespace-nowrap text-[15px] hover:text-accent',
                isCurrent(item.href) ? 'text-accent' : 'text-text',
              )}
            >
              {t(`nav.${item.key}`)}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={onOpenSearch}
            title={t('common.searchHint')}
            aria-label={t('nav.search')}
            className="flex cursor-pointer items-center gap-2 rounded-md border border-divider px-2 py-[5px] text-[13px] text-text transition-colors hover:bg-ink-8"
          >
            <MagnifyingGlassIcon size={14} weight="duotone" />
            <span className="hidden tracking-[0.06em] text-ink-55 md:inline">⌘K</span>
          </button>
          <LocaleSwitch current={locale} />
          <ThemeToggle label={t('common.toggleTheme')} />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
