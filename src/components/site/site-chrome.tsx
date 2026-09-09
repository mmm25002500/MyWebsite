'use client';

import { useCallback, useEffect, useState } from 'react';

import { SearchDialog } from '@/components/site/search-dialog';
import { SiteHeader } from '@/components/site/site-header';
import type { Locale } from '@/lib/i18n/config';

/** 頁首與 ⌘K 搜尋共用同一份開關狀態，因此包在同一個 client 邊界內。 */
export function SiteChrome({ locale }: { locale: Locale }) {
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpen((open) => !open);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const openSearch = useCallback(() => setSearchOpen(true), []);

  return (
    <>
      <SiteHeader locale={locale} onOpenSearch={openSearch} />
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} locale={locale} />
    </>
  );
}
