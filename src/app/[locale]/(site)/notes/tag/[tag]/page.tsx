import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';

import { PageHeader } from '@/components/site/page-header';
import { PostListRow } from '@/components/site/post-list-row';
import { ProjectCard } from '@/components/site/project-card';
import { Container, Display } from '@/components/ui/typography';
import { getPosts, getProjects, getTags } from '@/lib/data';
import { isLocale, locales, type Locale } from '@/lib/i18n/config';
import { notFoundMetadata, pageAlternates } from '@/lib/seo';

export const revalidate = 3600;

export async function generateStaticParams() {
  const params: { locale: string; tag: string }[] = [];
  for (const locale of locales) {
    for (const tag of await getTags(locale)) params.push({ locale, tag: tag.slug });
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; tag: string }>;
}): Promise<Metadata> {
  const { locale, tag: slug } = await params;
  if (!isLocale(locale)) return {};
  const tag = (await getTags(locale)).find((item) => item.slug === slug);
  return tag
    ? { title: tag.name, alternates: pageAlternates(locale, `/notes/tag/${slug}`) }
    : notFoundMetadata;
}

/** 標籤全站共用，因此同時列出相關文章與相關作品（規格 §3.1）。 */
export default async function TagPage({
  params,
}: {
  params: Promise<{ locale: string; tag: string }>;
}) {
  const { locale: raw, tag: slug } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  setRequestLocale(locale);

  const t = await getTranslations({ locale });
  const tags = await getTags(locale);
  const tag = tags.find((item) => item.slug === slug);
  if (!tag) notFound();

  const [posts, projects] = await Promise.all([
    getPosts({ locale, tagSlug: slug, pageSize: 50 }),
    getProjects({ locale, tagSlug: slug, pageSize: 50 }),
  ]);

  if (posts.items.length === 0 && projects.items.length === 0) notFound();

  return (
    <>
      <PageHeader kicker={t('notes.tagCloud')} title={tag.name} />

      {posts.items.length > 0 ? (
        <Container className="pt-12">
          <Display level={2} className="mb-5">
            {t('notes.title')}
          </Display>
          {posts.items.map((post) => (
            <PostListRow key={post.id} post={post} locale={locale} />
          ))}
        </Container>
      ) : null}

      {projects.items.length > 0 ? (
        <Container className="pt-14">
          <Display level={2} className="mb-6">
            {t('projects.title')}
          </Display>
          <div className="grid gap-6.5 md:grid-cols-3">
            {projects.items.map((project) => (
              <ProjectCard key={project.id} project={project} present={t('common.present')} />
            ))}
          </div>
        </Container>
      ) : null}
    </>
  );
}
