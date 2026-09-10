'use client';

import { ListIcon, MagnifyingGlassIcon, XIcon } from '@phosphor-icons/react/dist/ssr';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { LocaleSwitch } from '@/components/site/locale-switch';
import { ThemeToggle } from '@/components/site/theme-toggle';
import { UserMenu } from '@/components/site/user-menu';
import type { NavKey } from '@/components/site/nav-items';
import type { Locale } from '@/lib/i18n/config';
import { Link, usePathname } from '@/lib/i18n/routing';
import { useExitTransition } from '@/lib/hooks/use-exit-transition';
import { cn } from '@/lib/utils';

export interface NavEntry {
  key: NavKey;
  href: string;
}

export function SiteHeader({
  locale,
  navItems,
  onOpenSearch,
}: {
  locale: Locale;
  /** 由伺服器端依後台設定算好，這裡不再讀取固定清單。 */
  navItems: NavEntry[];
  onOpenSearch: () => void;
}) {
  const t = useTranslations();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  // 關閉時要把退場動畫播完才卸載。
  const menu = useExitTransition(menuOpen, 220);

  const isCurrent = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  // 換頁後把選單收起來，否則點連結會停在開著的狀態。
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

  return (
    <>
      <header className="sticky top-0 z-40 bg-bg/[0.88] backdrop-blur-[10px]">
        <div className="w-full max-w-page mx-auto flex items-center gap-4 px-[22px] py-3.5 md:px-11">
          <Link
            href="/"
            className="shrink-0 font-heading text-[20px] font-bold tracking-[0.06em] text-text hover:text-accent"
          >
            TSX
          </Link>

          <nav
            className="hidden min-w-0 flex-1 items-center gap-4 overflow-x-auto no-scrollbar md:flex"
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

          <div className="ml-auto flex shrink-0 items-center gap-1.5">
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

            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label={t('nav.menu')}
              className="cursor-pointer rounded-md p-1.5 text-text hover:bg-ink-8 md:hidden"
            >
              <ListIcon size={20} weight="bold" />
            </button>
          </div>
        </div>
      </header>

      {/*
        手機的導覽抽屜。原本是把十個項目擠成一條可橫向捲動的列，滑到後面幾項
        很吃力，也看不出總共有哪些頁。
      */}
      {menu.mounted ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label={t('common.close')}
            onClick={() => setMenuOpen(false)}
            className={cn(
              'absolute inset-0 bg-black/50',
              menu.closing ? 'animate-backdrop-out' : 'animate-backdrop',
            )}
          />
          <div
            className={cn(
              'absolute inset-y-0 right-0 flex w-64 flex-col border-l border-divider bg-bg',
              menu.closing ? 'animate-drawer-out-right' : 'animate-drawer-right',
            )}
          >
            <div className="flex items-center gap-2 px-5 py-3.5">
              <span className="font-heading text-[18px] font-bold tracking-[0.06em]">TSX</span>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label={t('common.close')}
                className="ml-auto cursor-pointer rounded-md p-1.5 text-ink-55 hover:bg-ink-8 hover:text-text"
              >
                <XIcon size={18} weight="bold" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-3 pb-8" aria-label={t('nav.menu')}>
              <ul className="space-y-0.5">
                {navItems.map((item) => (
                  <li key={item.key}>
                    <Link
                      href={item.href}
                      aria-current={isCurrent(item.href) ? 'page' : undefined}
                      onClick={() => setMenuOpen(false)}
                      className={cn(
                        'block rounded-md px-3 py-2.5 text-[16px]',
                        isCurrent(item.href)
                          ? 'bg-accent font-bold text-bg'
                          : 'text-text hover:bg-ink-8',
                      )}
                    >
                      {t(`nav.${item.key}`)}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      ) : null}
    </>
  );
}
