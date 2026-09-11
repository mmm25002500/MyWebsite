import { cache } from 'react';

import { cacheTags, cached } from '@/lib/data/cache';

import { renderMarkdown } from '@/lib/content/markdown';
import { seedPosts, seedSeries, type PostSeed } from '@/lib/data/seed/posts';
import { findTags, seedCategories } from '@/lib/data/seed/taxonomy';
import { publicClient, rows, usingSeed } from '@/lib/data/source';
import type { Locale } from '@/lib/i18n/config';
import { locales } from '@/lib/i18n/config';
import type { Category, Paginated, Post, PostSummary, Series, Tag } from '@/types/content';

export const POSTS_PER_PAGE = 12;

export interface PostQuery {
  locale: Locale;
  categorySlug?: string;
  tagSlug?: string;
  seriesSlug?: string;
  page?: number;
  sort?: 'latest' | 'popular';
  pageSize?: number;
}

// —— seed 模式的輔助 ——

function seedSummary(post: PostSeed, locale: Locale): PostSummary | null {
  const i18n = post.i18n[locale];
  if (!i18n) return null;

  const categories = seedCategories(locale).filter((category) =>
    post.categories.includes(category.slug),
  );
  const plain = i18n.markdown.replace(/[#*`>[\]()_~-]/g, ' ');
  const cjk = (plain.match(/[㐀-鿿]/g) ?? []).length;
  const words = (plain.replace(/[㐀-鿿]/g, ' ').match(/[A-Za-z0-9'-]+/g) ?? []).length;

  return {
    id: `post-${post.slug}`,
    slug: post.slug,
    title: i18n.title,
    subtitle: i18n.subtitle,
    excerpt: i18n.excerpt,
    coverUrl: null,
    publishedAt: post.publishedAt,
    updatedAt: post.updatedAt,
    readingTimeMin: Math.max(1, Math.round(cjk / 350 + words / 220)),
    viewCount: post.viewCount,
    commentCount: 0,
    likeCount: post.likeCount,
    isPinned: post.isPinned,
    categories,
    primaryCategorySlug: post.primaryCategory,
    tags: findTags(post.tags),
    availableLocales: locales.filter((item) => Boolean(post.i18n[item])),
  };
}

function seedSummaries(locale: Locale): PostSummary[] {
  return seedPosts
    .map((post) => seedSummary(post, locale))
    .filter((post): post is PostSummary => post !== null);
}

function sortPosts(items: PostSummary[], sort: PostQuery['sort']): PostSummary[] {
  return [...items].sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
    if (sort === 'popular') return b.viewCount - a.viewCount;
    return (b.publishedAt ?? '').localeCompare(a.publishedAt ?? '');
  });
}

// —— 查詢 ——

export const getCategories = cached(
  ['getCategories'],
  async (locale: Locale): Promise<Category[]> => {
    if (usingSeed) {
      const summaries = seedSummaries(locale);
      return seedCategories(locale).map((category) => ({
        ...category,
        postCount: summaries.filter((post) =>
          post.categories.some((item) => item.slug === category.slug),
        ).length,
      }));
    }

    const { data, error } = await publicClient()
      .from('categories')
      .select('id, slug, icon, color, sort_order, categories_i18n!inner(name, description, locale)')
      .eq('is_visible', true)
      .eq('categories_i18n.locale', locale)
      .order('sort_order');
    if (error) throw new Error(`[data] categories: ${error.message}`);

    return rows<{
      id: string;
      slug: string;
      icon: string | null;
      color: string | null;
      sort_order: number;
      categories_i18n: { name: string; description: string | null }[];
    }>(data).map((row) => ({
      id: row.id,
      slug: row.slug,
      name: row.categories_i18n[0]?.name ?? row.slug,
      description: row.categories_i18n[0]?.description ?? null,
      icon: row.icon,
      color: row.color,
      sortOrder: row.sort_order,
      postCount: 0,
    }));
  },
  { tags: [cacheTags.taxonomy] },
);

export const getTags = cached(
  ['getTags'],
  async (locale: Locale): Promise<Tag[]> => {
    if (usingSeed) {
      const summaries = seedSummaries(locale);
      const counts = new Map<string, number>();
      for (const post of summaries) {
        for (const tag of post.tags) counts.set(tag.slug, (counts.get(tag.slug) ?? 0) + 1);
      }
      return findTags([...new Set(seedPosts.flatMap((post) => post.tags))])
        .map((tag) => ({ ...tag, postCount: counts.get(tag.slug) ?? 0 }))
        .sort((a, b) => b.postCount - a.postCount);
    }

    const { data, error } = await publicClient()
      .from('tags')
      .select('id, slug, color, post_count, project_count, tags_i18n!inner(name, locale)')
      .eq('tags_i18n.locale', locale)
      .order('post_count', { ascending: false });
    if (error) throw new Error(`[data] tags: ${error.message}`);

    return rows<{
      id: string;
      slug: string;
      color: string | null;
      post_count: number;
      project_count: number;
      tags_i18n: { name: string }[];
    }>(data).map((row) => ({
      id: row.id,
      slug: row.slug,
      name: row.tags_i18n[0]?.name ?? row.slug,
      color: row.color,
      postCount: row.post_count,
      projectCount: row.project_count,
    }));
  },
  { tags: [cacheTags.taxonomy] },
);

export const getSeriesList = cached(
  ['getSeriesList'],
  async (locale: Locale): Promise<Series[]> => {
    if (usingSeed) {
      return seedSeries.map((series) => ({
        id: `series-${series.slug}`,
        slug: series.slug,
        title: series.title[locale],
        description: series.description[locale],
        coverUrl: null,
        postCount: seedPosts.filter((post) => post.seriesSlug === series.slug && post.i18n[locale])
          .length,
      }));
    }

    const { data, error } = await publicClient()
      .from('series')
      .select('id, slug, cover_url, sort_order, series_i18n!inner(title, description, locale)')
      .eq('is_visible', true)
      .eq('series_i18n.locale', locale)
      .order('sort_order');
    if (error) throw new Error(`[data] series: ${error.message}`);

    return rows<{
      id: string;
      slug: string;
      cover_url: string | null;
      series_i18n: { title: string; description: string | null }[];
    }>(data).map((row) => ({
      id: row.id,
      slug: row.slug,
      title: row.series_i18n[0]?.title ?? row.slug,
      description: row.series_i18n[0]?.description ?? null,
      coverUrl: row.cover_url,
      postCount: 0,
    }));
  },
  { tags: [cacheTags.taxonomy] },
);

async function fetchPosts(query: PostQuery): Promise<Paginated<PostSummary>> {
  const page = Math.max(1, query.page ?? 1);
  const pageSize = query.pageSize ?? POSTS_PER_PAGE;

  if (usingSeed) {
    let items = seedSummaries(query.locale);
    if (query.categorySlug) {
      items = items.filter((post) =>
        post.categories.some((category) => category.slug === query.categorySlug),
      );
    }
    if (query.tagSlug) {
      items = items.filter((post) => post.tags.some((tag) => tag.slug === query.tagSlug));
    }
    if (query.seriesSlug) {
      const slugs = new Set(
        seedPosts.filter((post) => post.seriesSlug === query.seriesSlug).map((post) => post.slug),
      );
      items = items.filter((post) => slugs.has(post.slug));
    }
    const sorted = sortPosts(items, query.sort);
    const start = (page - 1) * pageSize;
    return {
      items: sorted.slice(start, start + pageSize),
      total: sorted.length,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(sorted.length / pageSize)),
    };
  }

  // `v_public_posts` 已在 DB 端把分類與標籤聚合成陣列，並只包含 status='published'。
  let builder = publicClient()
    .from('v_public_posts')
    .select('*', { count: 'exact' })
    .eq('locale', query.locale);

  if (query.categorySlug) builder = builder.contains('category_slugs', [query.categorySlug]);
  if (query.tagSlug) builder = builder.contains('tag_slugs', [query.tagSlug]);
  if (query.seriesSlug) builder = builder.eq('series_slug', query.seriesSlug);

  const { data, error, count } = await builder
    .order('is_pinned', { ascending: false })
    .order(query.sort === 'popular' ? 'view_count' : 'published_at', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);
  if (error) throw new Error(`[data] v_public_posts: ${error.message}`);

  const total = count ?? 0;
  return {
    items: rows<PublicPostRow>(data).map(mapPostRow),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

/**
 * 文章列表。跨請求快取，後台儲存時以 `posts` tag 失效（規格 §12.1）。
 * `unstable_cache` 會把參數納入快取鍵，因此不同的分類／分頁各自成一份。
 */
export const getPosts = cached(['posts-list'], fetchPosts, { tags: [cacheTags.posts] });

interface PublicPostRow {
  id: string;
  slug: string;
  locale: Locale;
  title: string;
  subtitle: string | null;
  excerpt: string | null;
  cover_url: string | null;
  published_at: string | null;
  updated_at: string | null;
  reading_time_min: number | null;
  view_count: number;
  comment_count: number;
  like_count: number;
  is_pinned: boolean;
  primary_category_slug: string | null;
  categories: { id: string; slug: string; name: string }[] | null;
  tags: { id: string; slug: string; name: string }[] | null;
  available_locales: Locale[] | null;
}

function mapPostRow(row: PublicPostRow): PostSummary {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle,
    excerpt: row.excerpt,
    coverUrl: row.cover_url,
    publishedAt: row.published_at,
    updatedAt: row.updated_at,
    readingTimeMin: row.reading_time_min ?? 1,
    viewCount: row.view_count,
    commentCount: row.comment_count,
    likeCount: row.like_count,
    isPinned: row.is_pinned,
    categories: (row.categories ?? []).map((category) => ({
      ...category,
      description: null,
      icon: null,
      color: null,
      sortOrder: 0,
      postCount: 0,
    })),
    primaryCategorySlug: row.primary_category_slug,
    tags: (row.tags ?? []).map((tag) => ({
      ...tag,
      color: null,
      postCount: 0,
      projectCount: 0,
    })),
    availableLocales: row.available_locales ?? [row.locale],
  };
}

export const getPostBySlug = cached(
  ['getPostBySlug'],
  async (locale: Locale, slug: string): Promise<Post | null> => {
    if (usingSeed) {
      const seed = seedPosts.find((post) => post.slug === slug);
      const summary = seed ? seedSummary(seed, locale) : null;
      if (!seed || !summary) return null;

      const i18n = seed.i18n[locale];
      if (!i18n) return null;

      const rendered = await renderMarkdown(i18n.markdown);
      return {
        ...summary,
        readingTimeMin: rendered.readingTimeMin,
        contentHtml: rendered.html,
        toc: rendered.toc,
        seriesId: seed.seriesSlug ? `series-${seed.seriesSlug}` : null,
        seriesOrder: seed.seriesOrder,
        allowComments: true,
        canonicalUrl: null,
        ogImageUrl: null,
        seoTitle: null,
        seoDescription: null,
        wordCount: rendered.wordCount,
      };
    }

    const { data, error } = await publicClient()
      .from('v_public_posts')
      .select(
        '*, content_html, toc, series_id, series_order, allow_comments, canonical_url, og_image_url, seo_title, seo_description, word_count',
      )
      .eq('slug', slug)
      .eq('locale', locale)
      .maybeSingle();
    if (error) throw new Error(`[data] v_public_posts(${slug}): ${error.message}`);
    if (!data) return null;

    const row = data as unknown as PublicPostRow & {
      content_html: string | null;
      toc: Post['toc'] | null;
      series_id: string | null;
      series_order: number | null;
      allow_comments: boolean;
      canonical_url: string | null;
      og_image_url: string | null;
      seo_title: string | null;
      seo_description: string | null;
      word_count: number | null;
    };

    return {
      ...mapPostRow(row),
      contentHtml: row.content_html ?? '',
      toc: row.toc ?? [],
      seriesId: row.series_id,
      seriesOrder: row.series_order,
      allowComments: row.allow_comments,
      canonicalUrl: row.canonical_url,
      ogImageUrl: row.og_image_url,
      seoTitle: row.seo_title,
      seoDescription: row.seo_description,
      wordCount: row.word_count ?? 0,
    };
  },
  { tags: [cacheTags.posts] },
);

export const getPostCount = cached(
  ['getPostCount'],
  async (locale: Locale): Promise<number> => {
    if (usingSeed) return seedSummaries(locale).length;

    const { count, error } = await publicClient()
      .from('v_public_posts')
      .select('id', { count: 'exact', head: true })
      .eq('locale', locale);
    if (error) throw new Error(`[data] v_public_posts count: ${error.message}`);
    return count ?? 0;
  },
  { tags: [cacheTags.posts] },
);

export const getLatestPosts = cache(
  async (locale: Locale, limit: number): Promise<PostSummary[]> => {
    const result = await getPosts({ locale, pageSize: limit, page: 1 });
    return result.items;
  },
);

/** 同系列的其他文章，用於文章頁的系列導覽。 */
export const getSeriesPosts = cache(
  async (locale: Locale, seriesSlug: string): Promise<PostSummary[]> => {
    const result = await getPosts({ locale, seriesSlug, pageSize: 100 });
    return [...result.items].sort((a, b) =>
      (a.publishedAt ?? '').localeCompare(b.publishedAt ?? ''),
    );
  },
);

/** 相關文章：先取同分類，再以共同標籤數排序。 */
export const getRelatedPosts = cache(
  async (locale: Locale, post: PostSummary, limit = 3): Promise<PostSummary[]> => {
    const primary = post.primaryCategorySlug ?? post.categories[0]?.slug;
    if (!primary) return [];

    const pool = await getPosts({ locale, categorySlug: primary, pageSize: 24 });
    const tagSlugs = new Set(post.tags.map((tag) => tag.slug));

    return pool.items
      .filter((item) => item.slug !== post.slug)
      .map((item) => ({
        item,
        score: item.tags.filter((tag) => tagSlugs.has(tag.slug)).length,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((entry) => entry.item);
  },
);

export interface ArchiveGroup {
  year: number;
  months: { month: number; posts: PostSummary[] }[];
}

export const getPostArchive = cached(
  ['getPostArchive'],
  async (locale: Locale): Promise<ArchiveGroup[]> => {
    const all = await getPosts({ locale, pageSize: 500 });
    const byYear = new Map<number, Map<number, PostSummary[]>>();

    for (const post of all.items) {
      if (!post.publishedAt) continue;
      const date = new Date(post.publishedAt);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const months = byYear.get(year) ?? new Map<number, PostSummary[]>();
      months.set(month, [...(months.get(month) ?? []), post]);
      byYear.set(year, months);
    }

    return [...byYear.entries()]
      .sort((a, b) => b[0] - a[0])
      .map(([year, months]) => ({
        year,
        months: [...months.entries()]
          .sort((a, b) => b[0] - a[0])
          .map(([month, posts]) => ({ month, posts })),
      }));
  },
  { tags: [cacheTags.posts] },
);

/** 供 `generateStaticParams` 使用：所有已發佈文章的 slug。 */
export async function getAllPostSlugs(locale: Locale): Promise<string[]> {
  const result = await getPosts({ locale, pageSize: 500 });
  return result.items.map((post) => post.slug);
}
