import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';

import { PageHeader } from '@/components/site/page-header';
import { Container, Kicker } from '@/components/ui/typography';
import { getChangelog } from '@/lib/data';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { formatDate } from '@/lib/utils';
import { pageAlternates } from '@/lib/seo';

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
    title: t('changelog.title'),
    description: t('changelog.description'),
    alternates: pageAlternates(locale, '/changelog'),
  };
}

export default async function ChangelogPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  setRequestLocale(locale);

  const t = await getTranslations({ locale });
  const entries = await getChangelog(locale);

  return (
    <>
      <PageHeader
        kicker={t('nav.changelog')}
        title={t('changelog.title')}
        description={t('changelog.description')}
      />
      <Container className="pt-12">
        <ol className="space-y-12">
          {entries.map((entry) => (
            <li key={entry.id} className="grid gap-3 md:grid-cols-[160px_minmax(0,1fr)]">
              <div>
                <Kicker>{entry.version}</Kicker>
                <p className="mt-1 text-[13px] text-ink-55">
                  {formatDate(entry.releasedAt, locale)}
                </p>
              </div>
              <div>
                <h2 className="font-heading text-[20px] font-bold">{entry.title}</h2>
                <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[15px] leading-relaxed text-ink-62">
                  {entry.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ol>
      </Container>
    </>
  );
}
