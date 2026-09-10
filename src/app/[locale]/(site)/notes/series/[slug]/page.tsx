import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';

import { PageHeader } from '@/components/site/page-header';
import { PostListRow } from '@/components/site/post-list-row';
import { Container } from '@/components/ui/typography';
import { getSeriesList, getSeriesPosts } from '@/lib/data';
import { isLocale, locales, type Locale } from '@/lib/i18n/config';
import { notFoundMetadata, pageAlternates } from '@/lib/seo';

export const revalidate = 3600;

export async function generateStaticParams() {
  const params: { locale: string; slug: string }[] = [];
  for (const locale of locales) {
    for (const series of await getSeriesList(locale)) params.push({ locale, slug: series.slug });
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const series = (await getSeriesList(locale)).find((item) => item.slug === slug);
  return series
    ? {
        title: series.title,
        description: series.description ?? undefined,
        alternates: pageAlternates(locale, `/notes/series/${slug}`),
      }
    : notFoundMetadata;
}

export default async function SeriesPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: raw, slug } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  setRequestLocale(locale);

  const t = await getTranslations({ locale });
  const series = (await getSeriesList(locale)).find((item) => item.slug === slug);
  if (!series) notFound();

  const posts = await getSeriesPosts(locale, slug);

  return (
    <>
      <PageHeader
        kicker={t('notes.series')}
        title={series.title}
        description={series.description ?? undefined}
      />
      <Container className="pt-10">
        {posts.map((post, index) => (
          <div key={post.id} className="relative">
            <span className="absolute -left-1 top-5 hidden font-heading text-kicker text-ink-55 md:block">
              {String(index + 1).padStart(2, '0')}
            </span>
            <PostListRow post={post} locale={locale} />
          </div>
        ))}
      </Container>
    </>
  );
}
