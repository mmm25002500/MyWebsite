import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound, redirect } from 'next/navigation';

import { isLocale, locales, type Locale } from '@/lib/i18n/config';
import { localePath, pageAlternates } from '@/lib/seo';

import { NotesIndex, notesPageCount } from '../../notes-index';

export const revalidate = 3600;

/**
 * 分頁走路徑而不是 `?page=`。
 *
 * 讀 `searchParams` 會讓整個路由被迫逐請求渲染，Vercel 的邊緣快取一路 MISS；
 * 改成路徑之後每一頁都能預先產生。第一頁不在這裡——它是 `/notes` 本身，這條
 * 路由收到 `page/1` 會轉回去，避免同一份內容有兩個網址。
 */
export async function generateStaticParams() {
  const params: { locale: string; page: string }[] = [];
  for (const locale of locales) {
    const total = await notesPageCount(locale);
    for (let page = 2; page <= total; page += 1) params.push({ locale, page: String(page) });
  }
  return params;
}

function parsePage(value: string): number | null {
  if (!/^[1-9][0-9]*$/.test(value)) return null;
  return Number(value);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; page: string }>;
}): Promise<Metadata> {
  const { locale, page } = await params;
  if (!isLocale(locale)) return {};
  const parsed = parsePage(page);
  if (parsed === null) return {};

  const t = await getTranslations({ locale });
  return {
    title: `${t('notes.title')} · ${parsed}`,
    description: t('notes.description'),
    alternates: pageAlternates(locale, `/notes/page/${parsed}`),
  };
}

export default async function NotesPagedPage({
  params,
}: {
  params: Promise<{ locale: string; page: string }>;
}) {
  const { locale: raw, page } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  setRequestLocale(locale);

  const parsed = parsePage(page);
  if (parsed === null) notFound();
  if (parsed === 1) redirect(localePath(locale, '/notes'));

  const total = await notesPageCount(locale);
  if (parsed > total) notFound();

  return <NotesIndex locale={locale} page={parsed} />;
}
