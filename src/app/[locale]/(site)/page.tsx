import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';

import { HeroCanvas } from '@/components/site/hero-canvas';
import { PostListRow } from '@/components/site/post-list-row';
import { ProjectCard } from '@/components/site/project-card';
import { Button } from '@/components/ui/button';
import { Container, Display, Kicker, Lede } from '@/components/ui/typography';
import {
  getHomeSections,
  getLatestPosts,
  getFeaturedProjects,
  getOrganizations,
  getSiteSettings,
  getSiteStats,
  getHomeSkillGroups,
  getProjectCount,
} from '@/lib/data';
import { htmlLang, isLocale, type Locale } from '@/lib/i18n/config';
import { Link } from '@/lib/i18n/routing';
import { siteUrl } from '@/lib/env';
import { formatCompactNumber, formatPeriod } from '@/lib/utils';
import { pageAlternates } from '@/lib/seo';
import { Tag } from '@/components/ui/tag';

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
    alternates: pageAlternates(locale, ''),
    title: `${t('site.name')} ${t('site.nameEn')}`,
    description: t('site.role'),
  };
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  setRequestLocale(locale);

  const t = await getTranslations({ locale });
  const [sections, settings, stats, projects, posts, skillGroups, organizations, projectCount] =
    await Promise.all([
      getHomeSections(),
      getSiteSettings(locale),
      getSiteStats(locale),
      getFeaturedProjects(locale, 3),
      getLatestPosts(locale, 4),
      getHomeSkillGroups(locale),
      getOrganizations(locale),
      getProjectCount(locale),
    ]);

  const ordered = sections.filter((s) => s.isVisible).sort((a, b) => a.sortOrder - b.sortOrder);

  const statItems = [
    { key: 'repos', value: stats.repoCount, label: t('home.statsRepos') },
    { key: 'stars', value: stats.starCount, label: t('home.statsStars') },
    { key: 'posts', value: stats.postCount, label: t('home.statsPosts') },
    { key: 'projects', value: stats.projectCount, label: t('home.statsProjects') },
    { key: 'subs', value: stats.subscriberCount, label: t('home.statsSubscribers') },
  ].filter((item) => item.value > 0);

  /*
   * 一次給 Person 與 WebSite 兩個實體。WebSite 帶 SearchAction 讓 Google 有機會
   * 在搜尋結果直接顯示站內搜尋框（sitelinks searchbox）。
   */
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Person',
        '@id': `${siteUrl}/#person`,
        name: t('site.name'),
        alternateName: t('site.nameEn'),
        url: siteUrl,
        jobTitle: t('site.role'),
        sameAs: settings.socialLinks.map((link) => link.url),
      },
      {
        '@type': 'WebSite',
        '@id': `${siteUrl}/#website`,
        url: siteUrl,
        name: `${t('site.name')} ${t('site.nameEn')}`.trim(),
        description: t('site.role'),
        inLanguage: htmlLang[locale],
        publisher: { '@id': `${siteUrl}/#person` },
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${siteUrl}/search?q={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
      },
    ],
  };

  const renderSection = (key: string) => {
    switch (key) {
      case 'hero':
        return (
          <section key={key} className="relative overflow-hidden">
            <HeroCanvas />
            <Container className="relative pb-16 pt-20 text-center">
              <Kicker className="animate-rise [animation-delay:0.05s]">{t('site.kicker')}</Kicker>
              <Display as="h1" level={1} className="mt-3.5 animate-rise [animation-delay:0.12s]">
                TSX
              </Display>
              <Lede className="mx-auto mt-5 max-w-[44ch] animate-rise [animation-delay:0.2s]">
                {settings.heroTagline}
              </Lede>
              <div className="mt-7 flex flex-wrap justify-center gap-2.5 animate-rise [animation-delay:0.28s]">
                <Button as={Link} href="/projects" variant="primary">
                  {t('home.heroCtaProjects')}
                </Button>
                <Button as={Link} href="/resume" variant="secondary">
                  {t('home.heroCtaResume')}
                </Button>
                <Button as={Link} href="/contact" variant="ghost">
                  {t('home.heroCtaContact')}
                </Button>
              </div>
            </Container>
          </section>
        );

      case 'stats':
        return statItems.length > 0 ? (
          <Container key={key}>
            <section className="py-11">
              <div className="grid grid-cols-2 gap-4.5 md:grid-cols-4">
                {statItems.slice(0, 4).map((item) => (
                  <div key={item.key}>
                    <div className="font-heading text-[clamp(30px,4vw,44px)] font-bold leading-none text-accent-700">
                      {formatCompactNumber(item.value, locale)}
                    </div>
                    <Kicker className="mt-1.5">{item.label}</Kicker>
                  </div>
                ))}
              </div>
            </section>
          </Container>
        ) : null;

      case 'featured_projects':
        return projects.length > 0 ? (
          <Container key={key}>
            <section className="pb-2.5 pt-9">
              <div className="mb-6 flex items-baseline justify-between gap-4">
                <Display level={2}>{t('home.featuredProjects')}</Display>
                <Link
                  href="/projects"
                  className="border-b border-ink-30 pb-px text-[14px] text-text hover:border-accent hover:text-accent"
                >
                  {t('home.allProjects', { count: projectCount })}
                </Link>
              </div>
              <div className="grid gap-6.5 md:grid-cols-3">
                {projects.map((project) => (
                  <ProjectCard key={project.id} project={project} present={t('common.present')} />
                ))}
              </div>
            </section>
          </Container>
        ) : null;

      case 'latest_posts':
        return posts.length > 0 ? (
          <Container key={key}>
            <section className="pb-2.5 pt-14">
              <div className="mb-5 flex items-baseline justify-between gap-4">
                <Display level={2}>{t('home.latestPosts')}</Display>
                <Link
                  href="/notes"
                  className="border-b border-ink-30 pb-px text-[14px] text-text hover:border-accent hover:text-accent"
                >
                  {t('home.toNotes')}
                </Link>
              </div>
              <div>
                {posts.map((post) => (
                  <PostListRow key={post.id} post={post} locale={locale} />
                ))}
              </div>
            </section>
          </Container>
        ) : null;

      case 'skills':
        return skillGroups.length > 0 ? (
          <Container key={key}>
            <section className="pb-2.5 pt-14">
              <Display level={2} className="mb-6">
                {t('home.skills')}
              </Display>
              <div className="grid gap-6.5 md:grid-cols-3">
                {skillGroups.map((group) => (
                  <div key={group.id}>
                    <h3 className="font-heading text-[18px] font-bold text-text">{group.name}</h3>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {group.skills.map((skill) => (
                        <Tag key={skill.id} variant="bordered">
                          {skill.name}
                        </Tag>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </Container>
        ) : null;

      case 'organizations':
        return organizations.length > 0 ? (
          <Container key={key}>
            <section className="pb-2.5 pt-14">
              <Display level={2} className="mb-5">
                {t('home.organizations')}
              </Display>
              <div className="grid gap-4.5 md:grid-cols-3">
                {organizations.map((org) => (
                  <Link
                    key={org.id}
                    href={`/organizations/${org.slug}`}
                    className="flex items-center gap-3.5 rounded-md bg-surface p-3.5 text-text transition-colors hover:bg-ink-8 hover:text-text"
                  >
                    <div className="size-11 shrink-0 rounded-sm media-slot" />
                    <div className="min-w-0">
                      <p className="m-0 font-heading text-[16px] font-bold">{org.name}</p>
                      <p className="mt-0.5 text-[13px] text-ink-62">
                        {org.role} · {formatPeriod(org.startedAt, org.endedAt, t('common.present'))}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          </Container>
        ) : null;

      default:
        return null;
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {ordered.map((section) => renderSection(section.key))}
    </>
  );
}
