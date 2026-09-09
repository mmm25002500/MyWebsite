import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';

import { PageHeader } from '@/components/site/page-header';
import { Pagination } from '@/components/site/pagination';
import { ProjectCard } from '@/components/site/project-card';
import { ProjectFilters } from '@/components/site/project-filters';
import { Container } from '@/components/ui/typography';
import { getProjectFilters, getProjects } from '@/lib/data';
import { isLocale, type Locale } from '@/lib/i18n/config';
import type { ProjectStatus } from '@/types/content';

export const revalidate = 3600;

const statuses: ProjectStatus[] = ['in_progress', 'completed', 'maintained', 'archived', 'idea'];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslations({ locale });
  return { title: t('projects.title'), description: t('projects.description') };
}

export default async function ProjectsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    category?: string;
    tag?: string;
    status?: string;
    year?: string;
    page?: string;
  }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  setRequestLocale(locale);

  const query = await searchParams;
  const t = await getTranslations({ locale });
  const filters = await getProjectFilters(locale);

  const status = statuses.find((item) => item === query.status);
  const result = await getProjects({
    locale,
    categorySlug: query.category,
    tagSlug: query.tag,
    status,
    year: query.year ? Number(query.year) : undefined,
    page: query.page ? Number(query.page) : 1,
  });

  const statusLabel: Record<ProjectStatus, string> = {
    idea: t('projects.statusIdea'),
    in_progress: t('projects.statusInProgress'),
    completed: t('projects.statusCompleted'),
    maintained: t('projects.statusMaintained'),
    archived: t('projects.statusArchived'),
  };

  return (
    <>
      <PageHeader
        kicker={t('nav.projects')}
        title={t('projects.title')}
        description={t('projects.description')}
      />

      <Container className="pt-8">
        <Suspense fallback={null}>
          <ProjectFilters
            groups={[
              {
                key: 'category',
                label: t('projects.filterCategory'),
                allLabel: t('projects.all'),
                options: filters.categories.map((item) => ({ value: item.slug, label: item.name })),
              },
              {
                key: 'tag',
                label: t('projects.filterTag'),
                allLabel: t('projects.all'),
                options: filters.tags.map((item) => ({ value: item.slug, label: item.name })),
              },
              {
                key: 'status',
                label: t('projects.filterStatus'),
                allLabel: t('projects.all'),
                options: statuses.map((item) => ({ value: item, label: statusLabel[item] })),
              },
              {
                key: 'year',
                label: t('projects.filterYear'),
                allLabel: t('projects.all'),
                options: filters.years.map((year) => ({
                  value: String(year),
                  label: String(year),
                })),
              },
            ]}
          />
        </Suspense>
      </Container>

      <Container className="pt-10">
        {result.items.length === 0 ? (
          <p className="py-16 text-center text-[15px] text-ink-55">{t('common.empty')}</p>
        ) : (
          <div className="grid gap-9 md:grid-cols-3">
            {result.items.map((project) => (
              <ProjectCard key={project.id} project={project} present={t('common.present')} />
            ))}
          </div>
        )}

        <Pagination
          page={result.page}
          totalPages={result.totalPages}
          basePath="/projects"
          query={query}
          previousLabel={t('common.previous')}
          nextLabel={t('common.next')}
        />
      </Container>
    </>
  );
}
