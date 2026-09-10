import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';

import { PageHeader } from '@/components/site/page-header';
import { Container, Display } from '@/components/ui/typography';
import { getPostArchive } from '@/lib/data';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { Link } from '@/lib/i18n/routing';
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
  return { title: t('notes.archiveTitle'), alternates: pageAlternates(locale, '/notes/archive') };
}

export default async function ArchivePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  setRequestLocale(locale);

  const t = await getTranslations({ locale });
  const archive = await getPostArchive(locale);

  const monthName = (year: number, month: number) =>
    formatDate(new Date(Date.UTC(year, month - 1, 1)), locale, { year: 'numeric', month: 'long' });

  return (
    <>
      <PageHeader kicker={t('nav.notes')} title={t('notes.archiveTitle')} />
      <Container className="pt-12">
        {archive.length === 0 ? (
          <p className="py-16 text-center text-[15px] text-ink-55">{t('common.empty')}</p>
        ) : null}

        {archive.map((group) => (
          <section key={group.year} className="pb-12">
            <Display level={2}>{group.year}</Display>
            {group.months.map((month) => (
              <div key={month.month} className="mt-6">
                <p className="font-heading text-kicker font-bold uppercase text-ink-55">
                  {monthName(group.year, month.month)}
                </p>
                <ul className="mt-2.5">
                  {month.posts.map((post) => (
                    <li key={post.id} className="border-t border-divider">
                      <Link
                        href={`/notes/p/${post.slug}`}
                        className="flex flex-col gap-1 py-3 text-text hover:bg-ink-4 hover:text-text md:flex-row md:items-baseline md:gap-4"
                      >
                        <span className="shrink-0 font-heading text-kicker uppercase text-ink-55">
                          {formatDate(post.publishedAt, locale, {
                            month: '2-digit',
                            day: '2-digit',
                          })}
                        </span>
                        <span className="font-heading text-[18px] font-bold">{post.title}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        ))}
      </Container>
    </>
  );
}
