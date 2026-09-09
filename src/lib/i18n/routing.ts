import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

import { defaultLocale, locales } from './config';

export const routing = defineRouting({
  locales,
  defaultLocale,
  // 預設語系不帶前綴（`/about`），英文帶前綴（`/en/about`）。
  localePrefix: 'as-needed',
  localeDetection: true,
});

export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
