import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';

import { isLocale, type Locale } from '@/lib/i18n/config';
import { pageAlternates } from '@/lib/seo';

import { NotesIndex } from './notes-index';

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslations({ locale });
  return {
    title: t('notes.title'),
    description: t('notes.description'),
    alternates: pageAlternates(locale, '/notes'),
  };
}

export default async function NotesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  setRequestLocale(locale);

  return <NotesIndex locale={locale} page={1} />;
}
