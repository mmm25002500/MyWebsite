import 'server-only';

import { requireRole } from '@/lib/auth/session';
import { createServerSupabase } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import type { Locale } from '@/lib/i18n/config';

export interface DashboardStats {
  viewsToday: number;
  views7d: number;
  views30d: number;
  visitors30d: number;
  pendingComments: number;
  newContactMessages: number;
  draftPosts: number;
  publishedPosts: number;
  projects: number;
}

export interface TrafficPoint {
  date: string;
  views: number;
  visitors: number;
}

export interface TopRow {
  label: string;
  href: string | null;
  count: number;
}

export interface AuditEntry {
  id: number;
  action: string;
  actorName: string | null;
  entityLabel: string | null;
  severity: 'info' | 'warning' | 'critical';
  createdAt: string;
}

function daysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

/**
 * 儀表板資料（規格 §8.1）。
 *
 * 近 30 日的流量走 `analytics_events` 原始表，因為 `analytics_daily` 由
 * pg_cron 每日 00:10 才彙總，當天的數字不會在裡面。
 */
export async function getDashboard(): Promise<{
  stats: DashboardStats;
  traffic: TrafficPoint[];
  topPages: TopRow[];
  topPosts: TopRow[];
  recentAudit: AuditEntry[];
}> {
  await requireRole('editor');
  const supabase = await createServerSupabase();

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [
    eventsToday,
    events7d,
    events30d,
    pendingComments,
    newMessages,
    draftPosts,
    publishedPosts,
    projects,
  ] = await Promise.all([
    supabase
      .from('analytics_events')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', startOfToday.toISOString()),
    supabase
      .from('analytics_events')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', daysAgo(7)),
    supabase
      .from('analytics_events')
      .select('created_at, visitor_hash, path')
      .gte('created_at', daysAgo(30))
      .limit(20000),
    supabase.from('comments').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase
      .from('contact_messages')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'new'),
    supabase.from('posts').select('id', { count: 'exact', head: true }).eq('status', 'draft'),
    supabase.from('posts').select('id', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('projects').select('id', { count: 'exact', head: true }),
  ]);

  const events = events30d.data ?? [];

  // 依日期分組，補齊沒有流量的日子，折線圖才不會斷。
  const byDate = new Map<string, { views: number; visitors: Set<string> }>();
  for (const event of events) {
    const key = event.created_at.slice(0, 10);
    const bucket = byDate.get(key) ?? { views: 0, visitors: new Set<string>() };
    bucket.views += 1;
    bucket.visitors.add(event.visitor_hash);
    byDate.set(key, bucket);
  }

  const traffic: TrafficPoint[] = [];
  for (let index = 29; index >= 0; index -= 1) {
    const date = new Date();
    date.setDate(date.getDate() - index);
    const key = date.toISOString().slice(0, 10);
    const bucket = byDate.get(key);
    traffic.push({
      date: key,
      views: bucket?.views ?? 0,
      visitors: bucket?.visitors.size ?? 0,
    });
  }

  const pathCounts = new Map<string, number>();
  for (const event of events) {
    pathCounts.set(event.path, (pathCounts.get(event.path) ?? 0) + 1);
  }
  const topPages: TopRow[] = [...pathCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([path, count]) => ({ label: path, href: path, count }));

  const { data: popular } = await supabase
    .from('posts')
    .select('slug, view_count, posts_i18n(title, locale)')
    .eq('status', 'published')
    .order('view_count', { ascending: false })
    .limit(10);

  const topPosts: TopRow[] = (popular ?? []).map((post) => ({
    label:
      post.posts_i18n.find((row) => row.locale === 'zh-TW')?.title ??
      post.posts_i18n[0]?.title ??
      post.slug,
    href: `/notes/p/${post.slug}`,
    count: post.view_count,
  }));

  const { data: audit } = await supabase
    .from('audit_logs')
    .select('id, action, actor_name, entity_label, severity, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  const recentAudit: AuditEntry[] = (audit ?? []).map((row) => ({
    id: row.id,
    action: row.action,
    actorName: row.actor_name,
    entityLabel: row.entity_label,
    severity: row.severity as AuditEntry['severity'],
    createdAt: row.created_at,
  }));

  const visitors30d = new Set(events.map((event) => event.visitor_hash)).size;

  return {
    stats: {
      viewsToday: eventsToday.count ?? 0,
      views7d: events7d.count ?? 0,
      views30d: events.length,
      visitors30d,
      pendingComments: pendingComments.count ?? 0,
      newContactMessages: newMessages.count ?? 0,
      draftPosts: draftPosts.count ?? 0,
      publishedPosts: publishedPosts.count ?? 0,
      projects: projects.count ?? 0,
    },
    traffic,
    topPages,
    topPosts,
    recentAudit,
  };
}

// ---------------------------------------------------------------------------
// 文章管理（規格 §8.2）
// ---------------------------------------------------------------------------

export interface AdminPostRow {
  id: string;
  slug: string;
  title: string;
  status: string;
  publishedAt: string | null;
  updatedAt: string;
  viewCount: number;
  commentCount: number;
  isPinned: boolean;
  isFeatured: boolean;
  categories: string[];
  tags: string[];
  /** 語言完成度：哪些語系已經有內容（規格 §14.2）。 */
  locales: string[];
}

export interface AdminPostQuery {
  status?: string;
  categoryId?: string;
  tagId?: string;
  search?: string;
  missingLocale?: string;
  page?: number;
  pageSize?: number;
}

export async function getAdminPosts(query: AdminPostQuery = {}): Promise<{
  rows: AdminPostRow[];
  total: number;
  page: number;
  totalPages: number;
}> {
  await requireRole('editor');
  const supabase = await createServerSupabase();

  const page = Math.max(1, query.page ?? 1);
  const pageSize = query.pageSize ?? 20;

  let builder = supabase.from('posts').select(
    `id, slug, status, published_at, updated_at, view_count, comment_count, is_pinned, is_featured,
       posts_i18n(locale, title),
       post_categories(category_id, is_primary, categories(slug, categories_i18n(name, locale))),
       post_tags(tag_id, tags(slug))`,
    { count: 'exact' },
  );

  if (query.status) builder = builder.eq('status', query.status);

  const { data, error, count } = await builder
    .order('updated_at', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (error) throw new Error(`[admin] posts: ${error.message}`);

  let rows: AdminPostRow[] = (data ?? []).map((post) => {
    const zh = post.posts_i18n.find((row) => row.locale === 'zh-TW');
    return {
      id: post.id,
      slug: post.slug,
      title: zh?.title ?? post.posts_i18n[0]?.title ?? post.slug,
      status: post.status,
      publishedAt: post.published_at,
      updatedAt: post.updated_at,
      viewCount: post.view_count,
      commentCount: post.comment_count,
      isPinned: post.is_pinned,
      isFeatured: post.is_featured,
      categories: post.post_categories
        .map(
          (row) =>
            row.categories?.categories_i18n.find((item) => item.locale === 'zh-TW')?.name ??
            row.categories?.slug ??
            '',
        )
        .filter(Boolean),
      tags: post.post_tags.map((row) => row.tags?.slug ?? '').filter(Boolean),
      locales: post.posts_i18n.map((row) => row.locale),
    };
  });

  // 分類、標籤與關鍵字在取回後過濾：關聯欄位無法直接下條件，
  // 而後台每頁只有 20 筆，在應用層篩選比多打一次 DB 便宜。
  if (query.categoryId) {
    const ids = new Set(
      (data ?? [])
        .filter((post) => post.post_categories.some((row) => row.category_id === query.categoryId))
        .map((post) => post.id),
    );
    rows = rows.filter((row) => ids.has(row.id));
  }

  if (query.tagId) {
    const ids = new Set(
      (data ?? [])
        .filter((post) => post.post_tags.some((row) => row.tag_id === query.tagId))
        .map((post) => post.id),
    );
    rows = rows.filter((row) => ids.has(row.id));
  }

  if (query.search) {
    const needle = query.search.toLowerCase();
    rows = rows.filter(
      (row) => row.title.toLowerCase().includes(needle) || row.slug.toLowerCase().includes(needle),
    );
  }

  if (query.missingLocale) {
    rows = rows.filter((row) => !row.locales.includes(query.missingLocale!));
  }

  const total = count ?? rows.length;
  return { rows, total, page, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

export interface AdminPostDetail {
  id: string;
  slug: string;
  status: string;
  publishedAt: string | null;
  coverUrl: string | null;
  canonicalUrl: string | null;
  isPinned: boolean;
  isFeatured: boolean;
  allowComments: boolean;
  seriesId: string | null;
  seriesOrder: number | null;
  categoryIds: string[];
  primaryCategoryId: string | null;
  tagIds: string[];
  contents: {
    locale: string;
    title: string;
    subtitle: string | null;
    excerpt: string | null;
    contentMd: string;
    seoTitle: string | null;
    seoDescription: string | null;
  }[];
}

export async function getAdminPost(postId: string): Promise<AdminPostDetail | null> {
  await requireRole('editor');
  const supabase = await createServerSupabase();

  const { data, error } = await supabase
    .from('posts')
    .select(
      `id, slug, status, published_at, cover_url, canonical_url, is_pinned, is_featured,
       allow_comments, series_id, series_order,
       posts_i18n(locale, title, subtitle, excerpt, content_md, seo_title, seo_description),
       post_categories(category_id, is_primary),
       post_tags(tag_id)`,
    )
    .eq('id', postId)
    .maybeSingle();

  if (error) throw new Error(`[admin] post(${postId}): ${error.message}`);
  if (!data) return null;

  return {
    id: data.id,
    slug: data.slug,
    status: data.status,
    publishedAt: data.published_at,
    coverUrl: data.cover_url,
    canonicalUrl: data.canonical_url,
    isPinned: data.is_pinned,
    isFeatured: data.is_featured,
    allowComments: data.allow_comments,
    seriesId: data.series_id,
    seriesOrder: data.series_order,
    categoryIds: data.post_categories.map((row) => row.category_id),
    primaryCategoryId: data.post_categories.find((row) => row.is_primary)?.category_id ?? null,
    tagIds: data.post_tags.map((row) => row.tag_id),
    contents: data.posts_i18n.map((row) => ({
      locale: row.locale,
      title: row.title,
      subtitle: row.subtitle,
      excerpt: row.excerpt,
      contentMd: row.content_md ?? '',
      seoTitle: row.seo_title,
      seoDescription: row.seo_description,
    })),
  };
}

/** 編輯頁需要的選項：分類、標籤、系列。 */
export async function getPostFormOptions() {
  await requireRole('editor');
  const supabase = await createServerSupabase();

  const [categories, tags, series] = await Promise.all([
    supabase
      .from('categories')
      .select('id, slug, categories_i18n(name, locale)')
      .order('sort_order'),
    supabase.from('tags').select('id, slug, tags_i18n(name, locale)').order('slug'),
    supabase.from('series').select('id, slug, series_i18n(title, locale)').order('sort_order'),
  ]);

  const label = <T extends { locale: string }>(rows: T[], key: keyof T): string =>
    String(rows.find((row) => row.locale === 'zh-TW')?.[key] ?? rows[0]?.[key] ?? '');

  return {
    categories: (categories.data ?? []).map((row) => ({
      id: row.id,
      slug: row.slug,
      name: label(row.categories_i18n, 'name') || row.slug,
    })),
    tags: (tags.data ?? []).map((row) => ({
      id: row.id,
      slug: row.slug,
      name: label(row.tags_i18n, 'name') || row.slug,
    })),
    series: (series.data ?? []).map((row) => ({
      id: row.id,
      slug: row.slug,
      title: label(row.series_i18n, 'title') || row.slug,
    })),
  };
}

// ---------------------------------------------------------------------------
// 分類 / 標籤 / 系列（規格 §8.3）
// ---------------------------------------------------------------------------

export interface AdminTaxonomyRow {
  id: string;
  slug: string;
  names: Record<string, string>;
  descriptions: Record<string, string | null>;
  icon: string | null;
  isVisible: boolean;
  sortOrder: number;
  postCount: number;
  projectCount: number;
}

export async function getAdminCategories(): Promise<AdminTaxonomyRow[]> {
  await requireRole('editor');
  const supabase = await createServerSupabase();

  const { data, error } = await supabase
    .from('categories')
    .select(
      'id, slug, icon, is_visible, sort_order, categories_i18n(locale, name, description), post_categories(post_id)',
    )
    .order('sort_order');

  if (error) throw new Error(`[admin] categories: ${error.message}`);

  return (data ?? []).map((row) => ({
    id: row.id,
    slug: row.slug,
    names: Object.fromEntries(row.categories_i18n.map((item) => [item.locale, item.name])),
    descriptions: Object.fromEntries(
      row.categories_i18n.map((item) => [item.locale, item.description]),
    ),
    icon: row.icon,
    isVisible: row.is_visible,
    sortOrder: row.sort_order,
    postCount: row.post_categories.length,
    projectCount: 0,
  }));
}

export async function getAdminTags(): Promise<AdminTaxonomyRow[]> {
  await requireRole('editor');
  const supabase = await createServerSupabase();

  const { data, error } = await supabase
    .from('tags')
    .select('id, slug, post_count, project_count, tags_i18n(locale, name)')
    .order('post_count', { ascending: false });

  if (error) throw new Error(`[admin] tags: ${error.message}`);

  return (data ?? []).map((row) => ({
    id: row.id,
    slug: row.slug,
    names: Object.fromEntries(row.tags_i18n.map((item) => [item.locale, item.name])),
    descriptions: {},
    icon: null,
    isVisible: true,
    sortOrder: 0,
    postCount: row.post_count,
    projectCount: row.project_count,
  }));
}

export interface AdminSeriesRow extends AdminTaxonomyRow {
  posts: { id: string; title: string; order: number | null }[];
}

export async function getAdminSeries(): Promise<AdminSeriesRow[]> {
  await requireRole('editor');
  const supabase = await createServerSupabase();

  const { data, error } = await supabase
    .from('series')
    .select(
      'id, slug, is_visible, sort_order, series_i18n(locale, title, description), posts(id, series_order, posts_i18n(locale, title))',
    )
    .order('sort_order');

  if (error) throw new Error(`[admin] series: ${error.message}`);

  return (data ?? []).map((row) => ({
    id: row.id,
    slug: row.slug,
    names: Object.fromEntries(row.series_i18n.map((item) => [item.locale, item.title])),
    descriptions: Object.fromEntries(
      row.series_i18n.map((item) => [item.locale, item.description]),
    ),
    icon: null,
    isVisible: row.is_visible,
    sortOrder: row.sort_order,
    postCount: row.posts.length,
    projectCount: 0,
    posts: row.posts
      .map((post) => ({
        id: post.id,
        title:
          post.posts_i18n.find((item) => item.locale === 'zh-TW')?.title ??
          post.posts_i18n[0]?.title ??
          post.id,
        order: post.series_order,
      }))
      .sort((a, b) => (a.order ?? 999) - (b.order ?? 999)),
  }));
}

// ---------------------------------------------------------------------------
// 作品集（規格 §8.4）
// ---------------------------------------------------------------------------

export interface AdminProjectRow {
  id: string;
  slug: string;
  name: string;
  status: string;
  startedAt: string;
  endedAt: string | null;
  isFeatured: boolean;
  isVisible: boolean;
  sortOrder: number;
  categoryName: string | null;
  coverUrl: string | null;
  imageCount: number;
  locales: string[];
}

export async function getAdminProjects(): Promise<AdminProjectRow[]> {
  await requireRole('editor');
  const supabase = await createServerSupabase();

  const { data, error } = await supabase
    .from('projects')
    .select(
      `id, slug, status, started_at, ended_at, is_featured, is_visible, sort_order, cover_url,
       projects_i18n(locale, name),
       project_categories(slug, project_categories_i18n(locale, name)),
       project_images(id)`,
    )
    .order('is_featured', { ascending: false })
    .order('started_at', { ascending: false });

  if (error) throw new Error(`[admin] projects: ${error.message}`);

  return (data ?? []).map((row) => ({
    id: row.id,
    slug: row.slug,
    name:
      row.projects_i18n.find((item) => item.locale === 'zh-TW')?.name ??
      row.projects_i18n[0]?.name ??
      row.slug,
    status: row.status,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    isFeatured: row.is_featured,
    isVisible: row.is_visible,
    sortOrder: row.sort_order,
    categoryName:
      row.project_categories?.project_categories_i18n.find((item) => item.locale === 'zh-TW')
        ?.name ??
      row.project_categories?.slug ??
      null,
    coverUrl: row.cover_url,
    imageCount: row.project_images.length,
    locales: row.projects_i18n.map((item) => item.locale),
  }));
}

export interface AdminProjectDetail {
  id: string;
  slug: string;
  status: string;
  startedAt: string;
  endedAt: string | null;
  categoryId: string | null;
  organizationId: string | null;
  coverUrl: string | null;
  githubRepo: string | null;
  isFeatured: boolean;
  isVisible: boolean;
  allowComments: boolean;
  sortOrder: number;
  metrics: Record<string, string>;
  tagIds: string[];
  relatedPostIds: string[];
  images: { id: string; url: string; alt: string; caption: string; isCover: boolean }[];
  links: { id: string; type: string; url: string; label: string }[];
  contents: {
    locale: string;
    name: string;
    tagline: string | null;
    summary: string | null;
    contentMd: string;
    role: string | null;
    seoTitle: string | null;
    seoDescription: string | null;
  }[];
}

export async function getAdminProject(projectId: string): Promise<AdminProjectDetail | null> {
  await requireRole('editor');
  const supabase = await createServerSupabase();

  const { data, error } = await supabase
    .from('projects')
    .select(
      `id, slug, status, started_at, ended_at, category_id, organization_id, cover_url,
       github_repo, is_featured, is_visible, allow_comments, sort_order, metrics,
       projects_i18n(locale, name, tagline, summary, content_md, role, seo_title, seo_description),
       project_tags(tag_id),
       project_posts(post_id, sort_order),
       project_images(id, url, is_cover, sort_order, project_images_i18n(locale, alt, caption)),
       project_links(id, type, url, sort_order, project_links_i18n(locale, label))`,
    )
    .eq('id', projectId)
    .maybeSingle();

  if (error) throw new Error(`[admin] project(${projectId}): ${error.message}`);
  if (!data) return null;

  return {
    id: data.id,
    slug: data.slug,
    status: data.status,
    startedAt: data.started_at,
    endedAt: data.ended_at,
    categoryId: data.category_id,
    organizationId: data.organization_id,
    coverUrl: data.cover_url,
    githubRepo: data.github_repo,
    isFeatured: data.is_featured,
    isVisible: data.is_visible,
    allowComments: data.allow_comments,
    sortOrder: data.sort_order,
    metrics: (data.metrics ?? {}) as Record<string, string>,
    tagIds: data.project_tags.map((row) => row.tag_id),
    relatedPostIds: data.project_posts
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((row) => row.post_id),
    images: data.project_images
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((row) => {
        const i18n = row.project_images_i18n.find((item) => item.locale === 'zh-TW');
        return {
          id: row.id,
          url: row.url,
          alt: i18n?.alt ?? '',
          caption: i18n?.caption ?? '',
          isCover: row.is_cover,
        };
      }),
    links: data.project_links
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((row) => ({
        id: row.id,
        type: row.type,
        url: row.url,
        label: row.project_links_i18n.find((item) => item.locale === 'zh-TW')?.label ?? row.url,
      })),
    contents: data.projects_i18n.map((row) => ({
      locale: row.locale,
      name: row.name,
      tagline: row.tagline,
      summary: row.summary,
      contentMd: row.content_md ?? '',
      role: row.role,
      seoTitle: row.seo_title,
      seoDescription: row.seo_description,
    })),
  };
}

export async function getProjectFormOptions() {
  await requireRole('editor');
  const supabase = await createServerSupabase();

  const [categories, organizations, tags, posts] = await Promise.all([
    supabase
      .from('project_categories')
      .select('id, slug, project_categories_i18n(locale, name)')
      .order('sort_order'),
    supabase
      .from('organizations')
      .select('id, slug, organizations_i18n(locale, name)')
      .order('sort_order'),
    supabase.from('tags').select('id, slug, tags_i18n(locale, name)').order('slug'),
    supabase.from('posts').select('id, slug, posts_i18n(locale, title)').eq('status', 'published'),
  ]);

  const pick = <T extends { locale: string }>(rows: T[], key: keyof T, fallback: string): string =>
    String(rows.find((row) => row.locale === 'zh-TW')?.[key] ?? rows[0]?.[key] ?? fallback);

  return {
    categories: (categories.data ?? []).map((row) => ({
      id: row.id,
      name: pick(row.project_categories_i18n, 'name', row.slug),
    })),
    organizations: (organizations.data ?? []).map((row) => ({
      id: row.id,
      name: pick(row.organizations_i18n, 'name', row.slug),
    })),
    tags: (tags.data ?? []).map((row) => ({
      id: row.id,
      name: pick(row.tags_i18n, 'name', row.slug),
    })),
    posts: (posts.data ?? []).map((row) => ({
      id: row.id,
      name: pick(row.posts_i18n, 'title', row.slug),
    })),
  };
}

// ---------------------------------------------------------------------------
// 履歷（規格 §8.5）
// ---------------------------------------------------------------------------

export interface AdminExperience {
  id: string;
  organizationId: string | null;
  employmentType: string;
  startedAt: string;
  endedAt: string | null;
  isCurrent: boolean;
  showCompanyName: boolean;
  isVisible: boolean;
  sortOrder: number;
  url: string | null;
  contents: Record<
    string,
    {
      companyName: string;
      title: string;
      location: string | null;
      highlights: string[];
      tech: string[];
    }
  >;
}

export interface AdminEducation {
  id: string;
  startedAt: string;
  endedAt: string | null;
  isCurrent: boolean;
  isVisible: boolean;
  sortOrder: number;
  contents: Record<string, { school: string; degree: string | null; field: string | null }>;
}

export interface AdminSkillGroup {
  id: string;
  key: string;
  name: string;
  skills: {
    id: string;
    name: string;
    level: number | null;
    isPrimary: boolean;
    showOnHome: boolean;
    isVisible: boolean;
    sortOrder: number;
  }[];
}

export async function getAdminResume() {
  await requireRole('editor');
  const supabase = await createServerSupabase();

  const [experiences, education, skillGroups, certifications, languages, settings, organizations] =
    await Promise.all([
      supabase
        .from('experiences')
        .select(
          'id, organization_id, employment_type, started_at, ended_at, is_current, show_company_name, is_visible, sort_order, url, experiences_i18n(locale, company_name, title, location, highlights, tech)',
        )
        .order('sort_order'),
      supabase
        .from('education')
        .select(
          'id, started_at, ended_at, is_current, is_visible, sort_order, education_i18n(locale, school, degree, field)',
        )
        .order('sort_order'),
      supabase
        .from('skill_groups')
        .select(
          'id, key, sort_order, skill_groups_i18n(locale, name), skills(id, name, level, is_primary, show_on_home, is_visible, sort_order)',
        )
        .order('sort_order'),
      supabase
        .from('certifications')
        .select(
          'id, issued_at, credential_url, is_visible, sort_order, certifications_i18n(locale, name, issuer)',
        )
        .order('sort_order'),
      supabase
        .from('languages_spoken')
        .select(
          'id, code, proficiency, is_visible, sort_order, languages_spoken_i18n(locale, name)',
        )
        .order('sort_order'),
      supabase
        .from('site_settings')
        .select('key, value')
        .in('key', ['show_company_name', 'show_certifications']),
      supabase
        .from('organizations')
        .select('id, slug, organizations_i18n(locale, name)')
        .order('sort_order'),
    ]);

  const settingsMap = new Map((settings.data ?? []).map((row) => [row.key, row.value]));

  return {
    experiences: (experiences.data ?? []).map<AdminExperience>((row) => ({
      id: row.id,
      organizationId: row.organization_id,
      employmentType: row.employment_type,
      startedAt: row.started_at,
      endedAt: row.ended_at,
      isCurrent: row.is_current,
      showCompanyName: row.show_company_name,
      isVisible: row.is_visible,
      sortOrder: row.sort_order,
      url: row.url,
      contents: Object.fromEntries(
        row.experiences_i18n.map((item) => [
          item.locale,
          {
            companyName: item.company_name,
            title: item.title,
            location: item.location,
            highlights: (item.highlights ?? []) as string[],
            tech: item.tech ?? [],
          },
        ]),
      ),
    })),
    education: (education.data ?? []).map<AdminEducation>((row) => ({
      id: row.id,
      startedAt: row.started_at,
      endedAt: row.ended_at,
      isCurrent: row.is_current,
      isVisible: row.is_visible,
      sortOrder: row.sort_order,
      contents: Object.fromEntries(
        row.education_i18n.map((item) => [
          item.locale,
          { school: item.school, degree: item.degree, field: item.field },
        ]),
      ),
    })),
    skillGroups: (skillGroups.data ?? []).map<AdminSkillGroup>((row) => ({
      id: row.id,
      key: row.key,
      name: row.skill_groups_i18n.find((item) => item.locale === 'zh-TW')?.name ?? row.key,
      skills: row.skills
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((skill) => ({
          id: skill.id,
          name: skill.name,
          level: skill.level,
          isPrimary: skill.is_primary,
          showOnHome: skill.show_on_home,
          isVisible: skill.is_visible,
          sortOrder: skill.sort_order,
        })),
    })),
    certifications: (certifications.data ?? []).map((row) => ({
      id: row.id,
      issuedAt: row.issued_at,
      credentialUrl: row.credential_url,
      isVisible: row.is_visible,
      name: row.certifications_i18n.find((item) => item.locale === 'zh-TW')?.name ?? '',
      issuer: row.certifications_i18n.find((item) => item.locale === 'zh-TW')?.issuer ?? '',
    })),
    languages: (languages.data ?? []).map((row) => ({
      id: row.id,
      code: row.code,
      proficiency: row.proficiency,
      isVisible: row.is_visible,
      name: row.languages_spoken_i18n.find((item) => item.locale === 'zh-TW')?.name ?? row.code,
    })),
    organizations: (organizations.data ?? []).map((row) => ({
      id: row.id,
      name: row.organizations_i18n.find((item) => item.locale === 'zh-TW')?.name ?? row.slug,
    })),
    settings: {
      showCompanyName: settingsMap.get('show_company_name') === true,
      showCertifications: settingsMap.get('show_certifications') === true,
    },
  };
}

// ---------------------------------------------------------------------------
// 留言與使用者（規格 §8.6、§8.7）
// ---------------------------------------------------------------------------

export interface AdminComment {
  id: string;
  content: string;
  status: string;
  isPinned: boolean;
  createdAt: string;
  editedAt: string | null;
  authorId: string | null;
  authorName: string;
  authorBanned: boolean;
  targetType: string;
  postSlug: string | null;
  postTitle: string | null;
  reportCount: number;
}

export async function getAdminComments(status?: string): Promise<AdminComment[]> {
  await requireRole('editor');
  // 要一併帶出留言者的封鎖狀態，而 profiles 的敏感欄位已收回 authenticated
  // 的讀取權，因此這裡走 service client；授權由上一行的 requireRole 負責。
  const supabase = createServiceClient();

  let builder = supabase
    .from('comments')
    .select(
      `id, content, status, is_pinned, created_at, edited_at, user_id, target_type, target_id,
       profiles!comments_user_id_fkey(display_name, is_banned),
       comment_reports(id)`,
    )
    .order('created_at', { ascending: false })
    .limit(200);

  if (status) builder = builder.eq('status', status);

  const { data, error } = await builder;
  if (error) throw new Error(`[admin] comments: ${error.message}`);

  const rows = data ?? [];
  const postIds = [
    ...new Set(rows.filter((r) => r.target_type === 'post').map((r) => r.target_id)),
  ];

  const titles = new Map<string, { slug: string; title: string }>();
  if (postIds.length > 0) {
    const { data: posts } = await supabase
      .from('posts')
      .select('id, slug, posts_i18n(locale, title)')
      .in('id', postIds);

    for (const post of posts ?? []) {
      titles.set(post.id, {
        slug: post.slug,
        title:
          post.posts_i18n.find((i) => i.locale === 'zh-TW')?.title ??
          post.posts_i18n[0]?.title ??
          post.slug,
      });
    }
  }

  return rows.map((row) => ({
    id: row.id,
    content: row.content,
    status: row.status,
    isPinned: row.is_pinned,
    createdAt: row.created_at,
    editedAt: row.edited_at,
    authorId: row.user_id,
    authorName: row.profiles?.display_name ?? '（已刪除的使用者）',
    authorBanned: row.profiles?.is_banned ?? false,
    targetType: row.target_type,
    postSlug: titles.get(row.target_id)?.slug ?? null,
    postTitle: titles.get(row.target_id)?.title ?? null,
    reportCount: row.comment_reports.length,
  }));
}

export interface AdminUser {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  avatarSource: string;
  role: string;
  isBanned: boolean;
  bannedUntil: string | null;
  banReason: string | null;
  createdAt: string;
  lastSeenAt: string | null;
  commentCount: number;
}

export async function getAdminUsers(): Promise<AdminUser[]> {
  await requireRole('admin');
  // 使用者列表本來就是 profiles 的全欄位，同樣改走 service client。
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('profiles')
    .select(
      'user_id, display_name, avatar_url, avatar_source, role, is_banned, banned_until, ban_reason, created_at, last_seen_at',
    )
    .order('created_at', { ascending: false });

  if (error) throw new Error(`[admin] users: ${error.message}`);

  // 留言數另外查：profiles 與 comments 之間有兩條關聯路徑，
  // 直接嵌套會撞到 PostgREST 的 PGRST201。
  const { data: comments } = await supabase.from('comments').select('user_id');
  const counts = new Map<string, number>();
  for (const row of comments ?? []) {
    if (!row.user_id) continue;
    counts.set(row.user_id, (counts.get(row.user_id) ?? 0) + 1);
  }

  return (data ?? []).map((row) => ({
    userId: row.user_id,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    avatarSource: row.avatar_source,
    role: row.role,
    isBanned: row.is_banned,
    bannedUntil: row.banned_until,
    banReason: row.ban_reason,
    createdAt: row.created_at,
    lastSeenAt: row.last_seen_at,
    commentCount: counts.get(row.user_id) ?? 0,
  }));
}

// ---------------------------------------------------------------------------
// §8.8 的其餘模組
// ---------------------------------------------------------------------------

export async function getAdminOrganizations() {
  await requireRole('editor');
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from('organizations')
    .select(
      'id, slug, website_url, github_org, started_at, ended_at, status, is_visible, sort_order, organizations_i18n(locale, name, role, description_md)',
    )
    .order('sort_order');
  if (error) throw new Error(`[admin] organizations: ${error.message}`);
  return data ?? [];
}

export async function getAdminTimeline() {
  await requireRole('editor');
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from('timeline_events')
    .select(
      'id, event_date, branch, type, icon, link_url, is_milestone, is_visible, sort_order, timeline_events_i18n(locale, title, subtitle, description)',
    )
    .order('event_date');
  if (error) throw new Error(`[admin] timeline: ${error.message}`);
  return data ?? [];
}

export async function getAdminLinks() {
  await requireRole('editor');
  const supabase = await createServerSupabase();
  const [groups, buttons] = await Promise.all([
    supabase
      .from('link_groups')
      .select('id, key, sort_order, is_visible, link_groups_i18n(locale, name)')
      .order('sort_order'),
    supabase
      .from('link_buttons')
      .select(
        'id, group_id, url, icon, image_url, is_highlighted, is_visible, sort_order, click_count, link_buttons_i18n(locale, label, description)',
      )
      .order('sort_order'),
  ]);
  return { groups: groups.data ?? [], buttons: buttons.data ?? [] };
}

export async function getAdminSponsors() {
  await requireRole('editor');
  const supabase = await createServerSupabase();
  const [methods, sponsors] = await Promise.all([
    supabase
      .from('sponsor_methods')
      .select(
        'id, key, type, address_or_url, qr_image_url, network, icon, is_visible, sort_order, sponsor_methods_i18n(locale, label, note)',
      )
      .order('sort_order'),
    supabase
      .from('sponsors')
      .select(
        'id, display_name, tier, amount_note, sponsored_at, is_anonymous, is_visible, sort_order',
      )
      .order('sort_order'),
  ]);
  return { methods: methods.data ?? [], sponsors: sponsors.data ?? [] };
}

export async function getAdminChangelog() {
  await requireRole('editor');
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from('changelog_entries')
    .select(
      'id, version, released_at, is_visible, sort_order, changelog_entries_i18n(locale, title, items)',
    )
    .order('released_at', { ascending: false });
  if (error) throw new Error(`[admin] changelog: ${error.message}`);
  return data ?? [];
}

export async function getAdminRedirects() {
  await requireRole('admin');
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from('redirects')
    .select('id, from_path, to_path, status_code, hit_count, is_active, reason, created_at')
    .order('created_at', { ascending: false });
  if (error) throw new Error(`[admin] redirects: ${error.message}`);
  return data ?? [];
}

export async function getAdminContactMessages() {
  await requireRole('admin');
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from('contact_messages')
    .select('id, name, email, subject, message, type, status, admin_note, created_at, replied_at')
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) throw new Error(`[admin] contact: ${error.message}`);
  return data ?? [];
}

export async function getAdminSubscribers() {
  await requireRole('admin');
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from('subscribers')
    .select('id, email, locale, confirmed, confirmed_at, unsubscribed_at, created_at')
    .order('created_at', { ascending: false });
  if (error) throw new Error(`[admin] subscribers: ${error.message}`);
  return data ?? [];
}

export async function getAdminMedia() {
  await requireRole('editor');
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from('media')
    .select('id, bucket, path, url, mime, size_bytes, width, height, folder, created_at')
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) throw new Error(`[admin] media: ${error.message}`);
  return data ?? [];
}

export interface AdminPageDetailRow {
  id: string;
  slug: string;
  status: 'draft' | 'published';
  contents: {
    locale: Locale;
    title: string;
    contentMd: string;
    seoTitle: string;
    seoDescription: string;
  }[];
}

/** 單頁的編輯資料。 */
export async function getAdminPage(slug: string): Promise<AdminPageDetailRow | null> {
  await requireRole('editor');
  const supabase = await createServerSupabase();

  const { data } = await supabase
    .from('pages')
    .select('id, slug, status, pages_i18n(locale, title, content_md, seo_title, seo_description)')
    .eq('slug', slug)
    .maybeSingle();

  if (!data) return null;

  return {
    id: data.id,
    slug: data.slug,
    status: data.status === 'published' ? 'published' : 'draft',
    contents: (data.pages_i18n ?? []).map((row) => ({
      locale: row.locale as Locale,
      title: row.title,
      contentMd: row.content_md ?? '',
      seoTitle: row.seo_title ?? '',
      seoDescription: row.seo_description ?? '',
    })),
  };
}

export async function getAdminPages() {
  await requireRole('editor');
  const supabase = await createServerSupabase();
  const [pages, sections] = await Promise.all([
    supabase
      .from('pages')
      .select('id, slug, status, updated_at, pages_i18n(locale, title, content_md)')
      .order('sort_order'),
    supabase
      .from('page_sections')
      .select('id, page_slug, section_key, is_visible, sort_order')
      .eq('page_slug', 'home')
      .order('sort_order'),
  ]);
  return { pages: pages.data ?? [], sections: sections.data ?? [] };
}

export interface AuditLogRow {
  id: number;
  action: string;
  actorName: string | null;
  entityType: string | null;
  entityLabel: string | null;
  diff: unknown;
  severity: string;
  createdAt: string;
}

export async function getAuditLogs(options: { severity?: string; action?: string } = {}) {
  await requireRole('admin');
  const supabase = await createServerSupabase();

  let builder = supabase
    .from('audit_logs')
    .select('id, action, actor_name, entity_type, entity_label, diff, severity, created_at')
    .order('created_at', { ascending: false })
    .limit(200);

  if (options.severity) builder = builder.eq('severity', options.severity);
  if (options.action) builder = builder.ilike('action', `%${options.action}%`);

  const { data, error } = await builder;
  if (error) throw new Error(`[admin] audit_logs: ${error.message}`);

  return (data ?? []).map<AuditLogRow>((row) => ({
    id: row.id,
    action: row.action,
    actorName: row.actor_name,
    entityType: row.entity_type,
    entityLabel: row.entity_label,
    diff: row.diff,
    severity: row.severity,
    createdAt: row.created_at,
  }));
}

export async function getAnalyticsDashboard(days = 30) {
  await requireRole('admin');
  const supabase = await createServerSupabase();

  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await supabase
    .from('analytics_events')
    .select(
      'created_at, visitor_hash, session_id, path, device_type, browser, os, country, referrer_source, locale, duration_sec',
    )
    .gte('created_at', since.toISOString())
    .limit(50000);

  if (error) throw new Error(`[admin] analytics: ${error.message}`);
  const events = data ?? [];

  const tally = (key: keyof (typeof events)[number]) => {
    const counts = new Map<string, number>();
    for (const event of events) {
      const value = event[key];
      if (!value) continue;
      counts.set(String(value), (counts.get(String(value)) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20);
  };

  const durations = events.map((e) => e.duration_sec).filter((d): d is number => d !== null);

  return {
    totalViews: events.length,
    uniqueVisitors: new Set(events.map((e) => e.visitor_hash)).size,
    sessions: new Set(events.map((e) => e.session_id)).size,
    avgDuration: durations.length
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : 0,
    byPath: tally('path'),
    byDevice: tally('device_type'),
    byBrowser: tally('browser'),
    byOs: tally('os'),
    byCountry: tally('country'),
    bySource: tally('referrer_source'),
    byLocale: tally('locale'),
  };
}
