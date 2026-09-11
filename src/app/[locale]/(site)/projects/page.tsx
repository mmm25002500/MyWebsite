import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';

import { PageHeader } from '@/components/site/page-header';
import { ProjectBrowser } from '@/components/site/project-browser';
import { ProjectCard } from '@/components/site/project-card';
import { Container } from '@/components/ui/typography';
import { getProjectFilters, getProjects } from '@/lib/data';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { pageAlternates } from '@/lib/seo';
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
  return {
    title: t('projects.title'),
    description: t('projects.description'),
    alternates: pageAlternates(locale, '/projects'),
  };
}

/** 專案涵蓋的每一年。CSS 的屬性選擇器不會比大小，只能逐年列出來讓 `~=` 比對。 */
function projectYears(startedAt: string, endedAt: string | null): number[] {
  const start = Number(startedAt.slice(0, 4));
  const end = endedAt ? Number(endedAt.slice(0, 4)) : new Date().getFullYear();
  const years: number[] = [];
  for (let year = start; year <= end; year += 1) years.push(year);
  return years;
}

export default async function ProjectsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  setRequestLocale(locale);

  const t = await getTranslations({ locale });
  const [filters, result] = await Promise.all([
    getProjectFilters(locale),
    // 全部撈回來交給瀏覽器篩選，這一頁才能是靜態的；篩選邏輯見 ProjectBrowser。
    getProjects({ locale, pageSize: 500 }),
  ]);

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
        <ProjectBrowser
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
              options: filters.years.map((year) => ({ value: String(year), label: String(year) })),
            },
          ]}
          meta={result.items.map((project) => ({
            category: project.categorySlug ?? '',
            tags: project.tags.map((tag) => tag.slug),
            status: project.status,
            years: projectYears(project.startedAt, project.endedAt),
          }))}
          gridId="project-grid"
          emptyLabel={t('common.empty')}
        />
      </Container>

      <Container className="pt-10">
        {/*
          卡片由伺服器輸出，篩選只靠 ProjectBrowser 送出的 CSS 規則把不符合的藏起來。
          年份要比對區間而 CSS 不會比大小，因此把專案涵蓋的每一年都展開寫進 data-years。
        */}
        <div id="project-grid" className="grid gap-9 md:grid-cols-3">
          {result.items.map((project) => (
            <div
              key={project.id}
              data-category={project.categorySlug ?? ''}
              data-tags={project.tags.map((tag) => tag.slug).join(' ')}
              data-status={project.status}
              data-years={projectYears(project.startedAt, project.endedAt).join(' ')}
            >
              <ProjectCard project={project} present={t('common.present')} />
            </div>
          ))}
        </div>
      </Container>
    </>
  );
}
