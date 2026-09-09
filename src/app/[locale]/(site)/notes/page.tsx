import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';

import { CategoryTabs } from '@/components/site/category-tabs';
import { PageHeader } from '@/components/site/page-header';
import { Container } from '@/components/ui/typography';
import { getCategories } from '@/lib/data';
import { isLocale, type Locale } from '@/lib/i18n/config';

import { NotesList } from './notes-list';

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslations({ locale });
  return { title: t('notes.title'), description: t('notes.description') };
}

export default async function NotesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string; sort?: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  setRequestLocale(locale);

  const { page, sort } = await searchParams;
  const t = await getTranslations({ locale });
  const categories = await getCategories(locale);

  return (
    <>
      <PageHeader
        kicker={t('nav.notes')}
        title={t('notes.title')}
        description={t('notes.description')}
      />
      <Container className="mt-8">
        <CategoryTabs categories={categories} allLabel={t('notes.allCategories')} />
      </Container>
      <NotesList
        locale={locale}
        basePath="/notes"
        query={{
          page: page ? Number(page) : 1,
          sort: sort === 'popular' ? 'popular' : 'latest',
        }}
      />
    </>
  );
}
