import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';

import { CategoryTabs } from '@/components/site/category-tabs';
import { PageHeader } from '@/components/site/page-header';
import { Container } from '@/components/ui/typography';
import { getCategories } from '@/lib/data';
import { isLocale, locales, type Locale } from '@/lib/i18n/config';
import { notFoundMetadata, pageAlternates } from '@/lib/seo';

import { NotesList } from '../../notes-list';

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
  searchParams,
}: {
  params: Promise<{ locale: string; category: string }>;
  searchParams: Promise<{ page?: string; sort?: string }>;
}) {
  const { locale: raw, category: slug } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  setRequestLocale(locale);

  const { page, sort } = await searchParams;
  const t = await getTranslations({ locale });
  const categories = await getCategories(locale);
  const category = categories.find((item) => item.slug === slug);
  if (!category) notFound();

  return (
    <>
      <PageHeader
        kicker={t('nav.notes')}
        title={category.name}
        description={category.description ?? undefined}
      />
      <Container className="mt-8">
        <CategoryTabs categories={categories} allLabel={t('notes.allCategories')} />
      </Container>
      <NotesList
        locale={locale}
        basePath={`/notes/c/${slug}`}
        query={{
          categorySlug: slug,
          page: page ? Number(page) : 1,
          sort: sort === 'popular' ? 'popular' : 'latest',
        }}
      />
    </>
  );
}
