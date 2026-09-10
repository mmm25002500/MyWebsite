import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';

import { getCategories } from '@/lib/data';
import { isLocale, locales, type Locale } from '@/lib/i18n/config';
import { notFoundMetadata, pageAlternates } from '@/lib/seo';

import { NotesIndex } from '../../notes-index';

export const revalidate = 3600;

export async function generateStaticParams() {
  const params: { locale: string; category: string }[] = [];
  for (const locale of locales) {
    for (const category of await getCategories(locale)) {
      params.push({ locale, category: category.slug });
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; category: string }>;
}): Promise<Metadata> {
  const { locale, category: slug } = await params;
  if (!isLocale(locale)) return {};
  const category = (await getCategories(locale)).find((item) => item.slug === slug);
  return category
    ? {
        title: category.name,
        description: category.description ?? undefined,
        alternates: pageAlternates(locale, `/notes/c/${slug}`),
      }
    : notFoundMetadata;
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ locale: string; category: string }>;
}) {
  const { locale: raw, category: slug } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  setRequestLocale(locale);

  return <NotesIndex locale={locale} page={1} categorySlug={slug} />;
}
