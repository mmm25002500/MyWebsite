import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

import { getCategories } from '@/lib/data';
import { isLocale, locales, type Locale } from '@/lib/i18n/config';
import { localePath, notFoundMetadata, pageAlternates } from '@/lib/seo';

import { NotesIndex, notesPageCount } from '../../../../notes-index';

export const revalidate = 3600;

/** 分頁走路徑的理由見 `/notes/page/[page]`。 */
export async function generateStaticParams() {
  const params: { locale: string; category: string; page: string }[] = [];
  for (const locale of locales) {
    for (const category of await getCategories(locale)) {
      const total = await notesPageCount(locale, category.slug);
      for (let page = 2; page <= total; page += 1) {
        params.push({ locale, category: category.slug, page: String(page) });
      }
    }
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
  params: Promise<{ locale: string; category: string; page: string }>;
}): Promise<Metadata> {
  const { locale, category: slug, page } = await params;
  if (!isLocale(locale)) return {};
  const parsed = parsePage(page);
  if (parsed === null) return {};

  const category = (await getCategories(locale)).find((item) => item.slug === slug);
  if (!category) return notFoundMetadata;

  return {
    title: `${category.name} · ${parsed}`,
    description: category.description ?? undefined,
    alternates: pageAlternates(locale, `/notes/c/${slug}/page/${parsed}`),
  };
}

export default async function CategoryPagedPage({
  params,
}: {
  params: Promise<{ locale: string; category: string; page: string }>;
}) {
  const { locale: raw, category: slug, page } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  setRequestLocale(locale);

  const parsed = parsePage(page);
  if (parsed === null) notFound();
  if (parsed === 1) redirect(localePath(locale, `/notes/c/${slug}`));

  const total = await notesPageCount(locale, slug);
  if (parsed > total) notFound();

  return <NotesIndex locale={locale} page={parsed} categorySlug={slug} />;
}
