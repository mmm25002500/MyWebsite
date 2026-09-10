import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';

import { PageHeader } from '@/components/site/page-header';
import { Container } from '@/components/ui/typography';
import { searchAll } from '@/lib/data';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { Link } from '@/lib/i18n/routing';
import { formatDate } from '@/lib/utils';
import { noIndex } from '@/lib/seo';
import type { SearchResult } from '@/types/content';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslations({ locale });
  // 搜尋結果頁不應進索引。
  return { title: t('search.title'), robots: noIndex };
}

const hrefFor = (result: SearchResult) =>
  result.type === 'post'
    ? `/notes/p/${result.slug}`
    : result.type === 'project'
      ? `/projects/${result.slug}`
      : `/${result.slug}`;

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; type?: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  setRequestLocale(locale);

  const { q, type } = await searchParams;
  const t = await getTranslations({ locale });
  const term = q?.trim() ?? '';
  const all = term ? await searchAll(locale, term, { limit: 50 }) : [];
  const results = type ? all.filter((result) => result.type === type) : all;

  const groupLabel: Record<SearchResult['type'], string> = {
    post: t('search.groupPosts'),
    project: t('search.groupProjects'),
    page: t('search.groupPages'),
  };

  const filters: { value: string | undefined; label: string }[] = [
    { value: undefined, label: t('projects.all') },
    { value: 'post', label: groupLabel.post },
    { value: 'project', label: groupLabel.project },
    { value: 'page', label: groupLabel.page },
  ];

  return (
    <>
      <PageHeader kicker={t('nav.search')} title={t('search.title')} />

      <Container className="pt-8">
        <form action="" method="get" className="flex max-w-xl gap-2">
          <input
            type="search"
            name="q"
            defaultValue={term}
            placeholder={t('search.placeholder')}
            aria-label={t('search.title')}
            className="min-h-9 flex-1 rounded-md border border-divider bg-surface px-2.5 py-1.5 text-[15px] text-text caret-accent outline-none focus-visible:border-accent"
          />
          <button
            type="submit"
            className="cursor-pointer rounded-md bg-accent px-4 py-2 font-heading text-[15px] font-bold text-bg transition-colors hover:bg-accent-600"
          >
            {t('search.title')}
          </button>
        </form>

        {term ? (
          <>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              {filters.map((filter) => {
                const params = new URLSearchParams({ q: term });
                if (filter.value) params.set('type', filter.value);
                return (
                  <Link
                    key={filter.label}
                    href={`/search?${params.toString()}`}
                    className={
                      (type ?? undefined) === filter.value
                        ? 'rounded-md bg-accent px-2.5 py-1 text-[14px] text-bg'
                        : 'rounded-md px-2.5 py-1 text-[14px] text-text hover:bg-ink-8'
                    }
                  >
                    {filter.label}
                  </Link>
                );
              })}
              <span className="ml-auto text-[13px] text-ink-55">
                {t('search.resultsCount', { count: results.length })}
              </span>
            </div>

            {results.length === 0 ? (
              <p className="py-16 text-center text-[15px] text-ink-55">{t('search.noResults')}</p>
            ) : (
              <ul className="mt-6 divide-y divide-divider">
                {results.map((result) => (
                  <li key={`${result.type}-${result.id}`}>
                    <Link
                      href={hrefFor(result)}
                      className="block py-4 text-text transition-colors hover:bg-ink-4 hover:text-text"
                    >
                      <p className="font-heading text-kicker font-bold uppercase text-ink-55">
                        {groupLabel[result.type]}
                        {result.date ? ` · ${formatDate(result.date, locale)}` : ''}
                      </p>
                      <h2 className="mt-1 font-heading text-[20px] font-bold">{result.title}</h2>
                      {result.snippet ? (
                        <p className="mt-1.5 max-w-[70ch] text-[15px] leading-relaxed text-ink-62">
                          {result.snippet}
                        </p>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <p className="py-16 text-center text-[15px] text-ink-55">{t('search.typeToSearch')}</p>
        )}
      </Container>
    </>
  );
}
