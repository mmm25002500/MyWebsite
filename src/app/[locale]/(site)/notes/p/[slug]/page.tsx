import { notFoundMetadata } from '@/lib/seo';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';

import { AdSlot } from '@/components/ads/ad-slot';
import { CodeCopyButtons } from '@/components/content/code-copy';
import { MarkdownContent } from '@/components/content/markdown-content';
import { TableOfContents } from '@/components/content/table-of-contents';
import { CommentSection } from '@/components/site/comments/comment-section';
import { LikeButton } from '@/components/site/like-button';
import { PostListRow } from '@/components/site/post-list-row';
import { ShareLinks } from '@/components/site/share-links';
import { ViewCounter } from '@/components/site/view-counter';
import { Tag } from '@/components/ui/tag';
import { Container, Display, Kicker } from '@/components/ui/typography';
import { siteUrl } from '@/lib/env';
import {
  getAllPostSlugs,
  getPostBySlug,
  getRelatedPosts,
  getSeriesList,
  getSeriesPosts,
} from '@/lib/data';
import { defaultLocale, htmlLang, isLocale, locales, type Locale } from '@/lib/i18n/config';
import { Link } from '@/lib/i18n/routing';
import { formatDate } from '@/lib/utils';

export const revalidate = 3600;

export async function generateStaticParams() {
  const params: { locale: string; slug: string }[] = [];
  for (const locale of locales) {
    for (const slug of await getAllPostSlugs(locale)) params.push({ locale, slug });
  }
  return params;
}

function canonicalRoot(locale: Locale) {
  return locale === 'zh-TW' ? '' : `/${locale}`;
}

function canonicalPath(locale: Locale, slug: string) {
  return `${canonicalRoot(locale)}/notes/p/${slug}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};

  const post = await getPostBySlug(locale, slug);
  if (!post) return notFoundMetadata;

  const title = post.seoTitle ?? post.title;
  const description = post.seoDescription ?? post.excerpt ?? undefined;
  const ogImage = post.ogImageUrl ?? `/api/og?type=post&slug=${encodeURIComponent(slug)}`;

  return {
    title,
    description,
    alternates: {
      canonical: post.canonicalUrl ?? canonicalPath(locale, slug),
      languages: {
        ...Object.fromEntries(
          post.availableLocales.map((item) => [htmlLang[item], canonicalPath(item, slug)]),
        ),
        // 只有中文版的文章就指向中文版，不要留給搜尋引擎自己猜。
        'x-default': canonicalPath(
          post.availableLocales.includes(defaultLocale) ? defaultLocale : locale,
          slug,
        ),
      },
    },
    openGraph: {
      type: 'article',
      title,
      description,
      publishedTime: post.publishedAt ?? undefined,
      modifiedTime: post.updatedAt ?? undefined,
      tags: post.tags.map((tag) => tag.name),
      images: [ogImage],
    },
    twitter: { card: 'summary_large_image', title, description, images: [ogImage] },
  };
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: raw, slug } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  setRequestLocale(locale);

  const t = await getTranslations({ locale });
  const post = await getPostBySlug(locale, slug);
  if (!post) notFound();

  const [related, seriesList] = await Promise.all([
    getRelatedPosts(locale, post),
    post.seriesId ? getSeriesList(locale) : Promise.resolve([]),
  ]);

  const series = seriesList.find((item) => `series-${item.slug}` === post.seriesId);
  const seriesPosts = series ? await getSeriesPosts(locale, series.slug) : [];
  const seriesIndex = seriesPosts.findIndex((item) => item.slug === post.slug);
  const previous = seriesIndex > 0 ? seriesPosts[seriesIndex - 1] : undefined;
  const next =
    seriesIndex >= 0 && seriesIndex < seriesPosts.length - 1
      ? seriesPosts[seriesIndex + 1]
      : undefined;

  const url = `${siteUrl}${canonicalPath(locale, slug)}`;
  const missingLocale = !post.availableLocales.includes(locale === 'zh-TW' ? 'en' : 'zh-TW');

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BlogPosting',
        headline: post.title,
        description: post.excerpt ?? undefined,
        datePublished: post.publishedAt ?? undefined,
        dateModified: post.updatedAt ?? post.publishedAt ?? undefined,
        author: { '@type': 'Person', '@id': `${siteUrl}/#person`, name: t('site.name') },
        publisher: { '@id': `${siteUrl}/#person` },
        mainEntityOfPage: url,
        inLanguage: htmlLang[locale],
        image: [`${siteUrl}/api/og?type=post&slug=${encodeURIComponent(slug)}`],
        keywords: post.tags.map((tag) => tag.name).join(', '),
        articleSection: post.categories[0]?.name,
        wordCount: post.wordCount,
      },
      // 麵包屑讓搜尋結果顯示「首頁 › 筆記 › 分類 › 標題」而不是一整條網址。
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { name: t('nav.home'), item: `${siteUrl}${canonicalRoot(locale)}` },
          { name: t('nav.notes'), item: `${siteUrl}${canonicalRoot(locale)}/notes` },
          ...(post.categories[0]
            ? [
                {
                  name: post.categories[0].name,
                  item: `${siteUrl}${canonicalRoot(locale)}/notes/c/${post.categories[0].slug}`,
                },
              ]
            : []),
          { name: post.title, item: url },
        ].map((entry, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: entry.name,
          item: entry.item,
        })),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ViewCounter type="post" id={post.id} />

      <Container className="pt-14">
        <nav aria-label="breadcrumb" className="flex flex-wrap gap-2">
          {post.categories.map((category) => (
            <Tag
              key={category.id}
              as={Link}
              href={`/notes/c/${category.slug}`}
              variant={category.slug === post.primaryCategorySlug ? 'accent' : 'neutral'}
            >
              {category.name}
            </Tag>
          ))}
        </nav>

        <Display as="h1" level={1} className="mt-4 max-w-[24ch] text-[clamp(32px,6vw,58px)]">
          {post.title}
        </Display>
        {post.subtitle ? (
          <p className="mt-4 max-w-[52ch] text-lede text-ink-62">{post.subtitle}</p>
        ) : null}

        <Kicker className="mt-6">
          {t('site.name')} · {formatDate(post.publishedAt, locale)}
          {post.updatedAt ? ` · ${t('notes.updatedAt')} ${formatDate(post.updatedAt, locale)}` : ''}
          {` · ${t('common.minutesRead', { minutes: post.readingTimeMin })}`}
          {post.viewCount > 0 ? ` · ${t('common.views', { count: post.viewCount })}` : ''}
        </Kicker>

        {missingLocale ? (
          <p className="mt-5 rounded-md border-l-[3px] border-accent bg-surface px-4 py-2.5 text-[15px] text-ink-62">
            {locale === 'zh-TW' ? t('notes.onlyZh') : t('notes.onlyEn')}
          </p>
        ) : null}
      </Container>

      <Container className="pt-10">
        <div className="grid grid-cols-[minmax(0,1fr)] gap-11 md:grid-cols-[minmax(0,1fr)_220px]">
          <article>
            <MarkdownContent html={post.contentHtml} />
            <CodeCopyButtons label={t('common.copy')} copiedLabel={t('common.copied')} />

            <AdSlot name="article" label={t('ads.label')} />

            {post.tags.length > 0 ? (
              <div className="mt-10 flex flex-wrap gap-1.5">
                {post.tags.map((tag) => (
                  <Tag key={tag.id} as={Link} href={`/notes/tag/${tag.slug}`}>
                    {tag.name}
                  </Tag>
                ))}
              </div>
            ) : null}

            <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-divider pt-6">
              <LikeButton
                postId={post.id}
                initialCount={post.likeCount}
                label={t('notes.like')}
                loginLabel={t('notes.likeLoginRequired')}
              />
              <ShareLinks
                url={url}
                title={post.title}
                copyLabel={t('common.copyLink')}
                copiedLabel={t('common.copied')}
              />
            </div>

            {series ? (
              <section className="mt-10 rounded-md bg-surface p-5">
                <Kicker>{t('notes.inSeries')}</Kicker>
                <Link
                  href={`/notes/series/${series.slug}`}
                  className="mt-1.5 block font-heading text-[20px] font-bold text-text hover:text-accent"
                >
                  {series.title}
                </Link>
                <p className="mt-1 text-[13px] text-ink-55">
                  {t('notes.seriesPart', {
                    index: seriesIndex + 1,
                    total: seriesPosts.length,
                  })}
                </p>
              </section>
            ) : null}

            {previous || next ? (
              <nav className="mt-8 grid gap-4 md:grid-cols-2">
                {previous ? (
                  <Link
                    href={`/notes/p/${previous.slug}`}
                    className="rounded-md border border-divider p-4 text-text hover:border-accent hover:text-text"
                  >
                    <Kicker>← {t('notes.prevPost')}</Kicker>
                    <p className="mt-1.5 font-heading font-bold">{previous.title}</p>
                  </Link>
                ) : (
                  <span />
                )}
                {next ? (
                  <Link
                    href={`/notes/p/${next.slug}`}
                    className="rounded-md border border-divider p-4 text-right text-text hover:border-accent hover:text-text"
                  >
                    <Kicker>{t('notes.nextPost')} →</Kicker>
                    <p className="mt-1.5 font-heading font-bold">{next.title}</p>
                  </Link>
                ) : null}
              </nav>
            ) : null}

            <CommentSection
              targetType="post"
              targetId={post.id}
              locale={locale}
              allowComments={post.allowComments}
            />
          </article>

          <div className="hidden md:block">
            <div className="sticky top-24">
              <TableOfContents items={post.toc} label={t('notes.toc')} />
              <AdSlot name="sidebar" format="rectangle" label={t('ads.label')} className="mt-6" />
            </div>
          </div>
        </div>
      </Container>

      {related.length > 0 ? (
        <Container className="pt-16">
          <Display level={2} className="mb-4">
            {t('notes.relatedPosts')}
          </Display>
          {related.map((item) => (
            <PostListRow key={item.id} post={item} locale={locale} />
          ))}
        </Container>
      ) : null}
    </>
  );
}
