import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';

import { MarkdownContent } from '@/components/content/markdown-content';
import { PageHeader } from '@/components/site/page-header';
import { ProjectCard } from '@/components/site/project-card';
import { Button } from '@/components/ui/button';
import { Container, Display, Kicker } from '@/components/ui/typography';
import { getOrganizations, getProjects } from '@/lib/data';
import { isLocale, locales, type Locale } from '@/lib/i18n/config';
import { Link } from '@/lib/i18n/routing';
import { formatPeriod } from '@/lib/utils';
import { pageAlternates } from '@/lib/seo';
import type { OrganizationStatus } from '@/types/content';

export const revalidate = 3600;

export async function generateStaticParams() {
  const params: { locale: string; slug: string[] }[] = [];
  for (const locale of locales) {
    params.push({ locale, slug: [] });
    for (const org of await getOrganizations(locale)) params.push({ locale, slug: [org.slug] });
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug?: string[] }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslations({ locale });

  const target = slug?.[0];
  if (!target) {
    return {
      title: t('organizations.title'),
      alternates: pageAlternates(locale, '/organizations'),
    };
  }

  const org = (await getOrganizations(locale)).find((item) => item.slug === target);
  return org
    ? {
        title: org.name,
        description: org.role,
        alternates: pageAlternates(locale, `/organizations/${target}`),
      }
    : {};
}

/** `/organizations` 與 `/organizations/[slug]` 共用同一個 optional catch-all 路由。 */
export default async function OrganizationsPage({
  params,
}: {
  params: Promise<{ locale: string; slug?: string[] }>;
}) {
  const { locale: raw, slug } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  setRequestLocale(locale);

  const t = await getTranslations({ locale });
  const organizations = await getOrganizations(locale);

  const statusLabel: Record<OrganizationStatus, string> = {
    active: t('organizations.statusActive'),
    ended: t('organizations.statusEnded'),
    reviving: t('organizations.statusReviving'),
  };

  const target = slug?.[0];

  if (target) {
    const org = organizations.find((item) => item.slug === target);
    if (!org) notFound();

    const projects = await getProjects({ locale, pageSize: 200 });
    const related = projects.items.filter((project) => project.organizationSlug === org.slug);

    return (
      <>
        <PageHeader kicker={statusLabel[org.status]} title={org.name} />
        <Container className="pt-8">
          <Kicker>
            {org.role} · {formatPeriod(org.startedAt, org.endedAt, t('common.present'))}
          </Kicker>

          {org.descriptionHtml ? (
            <MarkdownContent html={org.descriptionHtml} className="mt-6 max-w-[68ch]" />
          ) : null}

          {org.websiteUrl || org.githubOrg ? (
            <div className="mt-7 flex flex-wrap gap-2">
              {org.websiteUrl ? (
                <Button
                  as="a"
                  href={org.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  size="sm"
                >
                  {org.websiteUrl.replace(/^https?:\/\//, '')}
                </Button>
              ) : null}
              {org.githubOrg ? (
                <Button
                  as="a"
                  href={`https://github.com/${org.githubOrg}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="secondary"
                  size="sm"
                >
                  GitHub
                </Button>
              ) : null}
            </div>
          ) : null}
        </Container>

        {related.length > 0 ? (
          <Container className="pt-14">
            <Display level={2} className="mb-6">
              {t('organizations.relatedProjects')}
            </Display>
            <div className="grid gap-6.5 md:grid-cols-3">
              {related.map((project) => (
                <ProjectCard key={project.id} project={project} present={t('common.present')} />
              ))}
            </div>
          </Container>
        ) : null}
      </>
    );
  }

  return (
    <>
      <PageHeader kicker={t('nav.organizations')} title={t('organizations.title')} />
      <Container className="pt-10">
        <ul className="divide-y divide-divider">
          {organizations.map((org) => (
            <li key={org.id}>
              <Link
                href={`/organizations/${org.slug}`}
                className="flex flex-col gap-2 py-6 text-text transition-colors hover:bg-ink-4 hover:text-text md:flex-row md:items-baseline md:gap-6"
              >
                <div className="size-11 shrink-0 rounded-sm media-slot" />
                <div className="min-w-0 flex-1">
                  <h2 className="font-heading text-[23px] font-bold">{org.name}</h2>
                  <p className="mt-1 text-[15px] text-ink-62">
                    {org.role} · {formatPeriod(org.startedAt, org.endedAt, t('common.present'))} ·{' '}
                    {statusLabel[org.status]}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </>
  );
}
