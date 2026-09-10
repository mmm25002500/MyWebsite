import { ArrowSquareOutIcon } from '@phosphor-icons/react/dist/ssr';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';

import { AdSlot } from '@/components/ads/ad-slot';
import { CodeCopyButtons } from '@/components/content/code-copy';
import { MarkdownContent } from '@/components/content/markdown-content';
import { CommentSection } from '@/components/site/comments/comment-section';
import { PostListRow } from '@/components/site/post-list-row';
import { ProjectGallery } from '@/components/site/project-gallery';
import { ShareLinks } from '@/components/site/share-links';
import { ViewCounter } from '@/components/site/view-counter';
import { Button } from '@/components/ui/button';
import { Tag } from '@/components/ui/tag';
import { Container, Display, Kicker } from '@/components/ui/typography';
import { siteUrl } from '@/lib/env';
import { getAllProjectSlugs, getProjectBySlug } from '@/lib/data';
import { isLocale, locales, type Locale } from '@/lib/i18n/config';
import { Link } from '@/lib/i18n/routing';
import { formatPeriod } from '@/lib/utils';
import { notFoundMetadata, pageAlternates } from '@/lib/seo';
import type { ProjectStatus } from '@/types/content';

export const revalidate = 3600;

export async function generateStaticParams() {
  const params: { locale: string; slug: string }[] = [];
  for (const locale of locales) {
    for (const slug of await getAllProjectSlugs(locale)) params.push({ locale, slug });
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

  const project = await getProjectBySlug(locale, slug);
  if (!project) return notFoundMetadata;

  const title = project.seoTitle ?? project.name;
  const description = project.seoDescription ?? project.tagline ?? undefined;
  const ogImage = `/api/og?type=project&slug=${encodeURIComponent(slug)}`;

  return {
    title,
    description,
    alternates: pageAlternates(locale, `/projects/${slug}`),
    openGraph: { type: 'website', title, description, images: [ogImage] },
    twitter: { card: 'summary_large_image', title, description, images: [ogImage] },
  };
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: raw, slug } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  setRequestLocale(locale);

  const t = await getTranslations({ locale });
  const project = await getProjectBySlug(locale, slug);
  if (!project) notFound();

  const statusLabel: Record<ProjectStatus, string> = {
    idea: t('projects.statusIdea'),
    in_progress: t('projects.statusInProgress'),
    completed: t('projects.statusCompleted'),
    maintained: t('projects.statusMaintained'),
    archived: t('projects.statusArchived'),
  };

  const metrics = Object.entries(project.metrics);
  const url = `${siteUrl}${locale === 'zh-TW' ? '' : `/${locale}`}/projects/${slug}`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: project.name,
    description: project.tagline ?? undefined,
    applicationCategory: project.categoryName ?? undefined,
    author: { '@type': 'Person', name: t('site.name'), url: siteUrl },
    url,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ViewCounter type="project" id={project.id} />

      <Container className="pt-14">
        {project.categoryName ? <Kicker>{project.categoryName}</Kicker> : null}
        <Display as="h1" level={1} className="mt-3 max-w-[20ch] text-[clamp(32px,6vw,58px)]">
          {project.name}
        </Display>
        {project.tagline ? (
          <p className="mt-4 max-w-[52ch] text-lede text-ink-62">{project.tagline}</p>
        ) : null}

        <dl className="mt-8 grid gap-4 text-[15px] md:grid-cols-4">
          <div>
            <dt className="font-heading text-kicker font-bold uppercase text-ink-55">
              {t('projects.period')}
            </dt>
            <dd className="mt-1">
              {formatPeriod(project.startedAt, project.endedAt, t('common.present'))}
            </dd>
          </div>
          <div>
            <dt className="font-heading text-kicker font-bold uppercase text-ink-55">
              {t('projects.filterStatus')}
            </dt>
            <dd className="mt-1">{statusLabel[project.status]}</dd>
          </div>
          {project.role ? (
            <div>
              <dt className="font-heading text-kicker font-bold uppercase text-ink-55">
                {t('projects.role')}
              </dt>
              <dd className="mt-1">{project.role}</dd>
            </div>
          ) : null}
          {project.organizationSlug && project.organizationName ? (
            <div>
              <dt className="font-heading text-kicker font-bold uppercase text-ink-55">
                {t('projects.organization')}
              </dt>
              <dd className="mt-1">
                <Link
                  href={`/organizations/${project.organizationSlug}`}
                  className="text-accent-700 hover:text-accent"
                >
                  {project.organizationName}
                </Link>
              </dd>
            </div>
          ) : null}
        </dl>

        {project.links.length > 0 || project.githubRepo ? (
          <div className="mt-7 flex flex-wrap gap-2">
            {project.links.map((link) => (
              <Button
                key={link.id}
                as="a"
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                variant={link.type === 'demo' ? 'primary' : 'secondary'}
                size="sm"
              >
                {link.label}
                <ArrowSquareOutIcon size={14} weight="duotone" />
              </Button>
            ))}
            {project.githubRepo && project.links.every((link) => link.type !== 'github') ? (
              <Button
                as="a"
                href={`https://github.com/${project.githubRepo}`}
                target="_blank"
                rel="noopener noreferrer"
                variant="secondary"
                size="sm"
              >
                GitHub
                <ArrowSquareOutIcon size={14} weight="duotone" />
              </Button>
            ) : null}
          </div>
        ) : null}
      </Container>

      {project.images.length > 0 ? (
        <Container className="pt-10">
          <ProjectGallery images={project.images} label={t('projects.gallery')} />
        </Container>
      ) : null}

      <Container className="pt-12">
        <div className="grid grid-cols-[minmax(0,1fr)] gap-11 md:grid-cols-[minmax(0,1fr)_220px]">
          <article>
            {project.summary ? <p className="text-lede text-ink-62">{project.summary}</p> : null}
            {project.contentHtml ? (
              <>
                <MarkdownContent html={project.contentHtml} className="mt-8" />
                <CodeCopyButtons label={t('common.copy')} copiedLabel={t('common.copied')} />
              </>
            ) : null}

            <AdSlot name="article" label={t('ads.label')} />

            {project.tags.length > 0 ? (
              <div className="mt-10 flex flex-wrap gap-1.5">
                {project.tags.map((tag) => (
                  <Tag key={tag.id} as={Link} href={`/notes/tag/${tag.slug}`}>
                    {tag.name}
                  </Tag>
                ))}
              </div>
            ) : null}

            <div className="mt-8 border-t border-divider pt-6">
              <ShareLinks
                url={url}
                title={project.name}
                copyLabel={t('common.copyLink')}
                copiedLabel={t('common.copied')}
              />
            </div>

            {project.relatedPosts.length > 0 ? (
              <section className="mt-12">
                <Display level={3} className="mb-3">
                  {t('projects.relatedPosts')}
                </Display>
                {project.relatedPosts.map((post) => (
                  <PostListRow key={post.id} post={post} locale={locale} />
                ))}
              </section>
            ) : null}

            {project.allowComments ? (
              <CommentSection
                targetType="project"
                targetId={project.id}
                locale={locale}
                allowComments
              />
            ) : null}
          </article>

          <aside className="space-y-7 text-[15px]">
            {metrics.length > 0 ? (
              <section>
                <Kicker>{t('projects.metrics')}</Kicker>
                <dl className="mt-3 space-y-2">
                  {metrics.map(([key, value]) => (
                    <div key={key} className="flex justify-between gap-3">
                      <dt className="text-ink-62">{key}</dt>
                      <dd className="font-heading font-bold">{value}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            ) : null}

            {project.stars !== null || project.primaryLanguage ? (
              <section>
                <Kicker>GitHub</Kicker>
                <dl className="mt-3 space-y-2">
                  {project.stars !== null ? (
                    <div className="flex justify-between gap-3">
                      <dt className="text-ink-62">Stars</dt>
                      <dd className="tabular-nums">{project.stars}</dd>
                    </div>
                  ) : null}
                  {project.forks !== null ? (
                    <div className="flex justify-between gap-3">
                      <dt className="text-ink-62">Forks</dt>
                      <dd className="tabular-nums">{project.forks}</dd>
                    </div>
                  ) : null}
                  {project.primaryLanguage ? (
                    <div className="flex justify-between gap-3">
                      <dt className="text-ink-62">Language</dt>
                      <dd>{project.primaryLanguage}</dd>
                    </div>
                  ) : null}
                </dl>
              </section>
            ) : null}
          </aside>
        </div>
      </Container>
    </>
  );
}
