import { cache } from 'react';

import { cacheTags, cached } from '@/lib/data/cache';

import { renderMarkdown } from '@/lib/content/markdown';
import { seedProjectMarkdown, seedProjects } from '@/lib/data/seed/projects';
import { publicClient, rows, usingSeed } from '@/lib/data/source';
import type { Locale } from '@/lib/i18n/config';
import type { Paginated, Project, ProjectSummary, Tag } from '@/types/content';

export interface ProjectQuery {
  locale: Locale;
  categorySlug?: string;
  tagSlug?: string;
  status?: Project['status'];
  year?: number;
  page?: number;
  pageSize?: number;
}

interface PublicProjectRow {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  summary: string | null;
  cover_url: string | null;
  status: Project['status'];
  started_at: string;
  ended_at: string | null;
  is_featured: boolean;
  category_slug: string | null;
  category_name: string | null;
  organization_slug: string | null;
  organization_name: string | null;
  tags: { id: string; slug: string; name: string }[] | null;
  stars: number | null;
  forks: number | null;
  primary_language: string | null;
  github_repo: string | null;
  view_count: number;
}

function mapProjectRow(row: PublicProjectRow): ProjectSummary {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    tagline: row.tagline,
    summary: row.summary,
    coverUrl: row.cover_url,
    status: row.status,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    isFeatured: row.is_featured,
    categorySlug: row.category_slug,
    categoryName: row.category_name,
    organizationSlug: row.organization_slug,
    organizationName: row.organization_name,
    tags: (row.tags ?? []).map((tag) => ({
      ...tag,
      color: null,
      postCount: 0,
      projectCount: 0,
    })) satisfies Tag[],
    stars: row.stars,
    forks: row.forks,
    primaryLanguage: row.primary_language,
    githubRepo: row.github_repo,
    viewCount: row.view_count,
  };
}

/** 精選優先、再依開始時間新到舊——與作品集列表的預設排序一致。 */
function sortProjects(items: ProjectSummary[]): ProjectSummary[] {
  return [...items].sort((a, b) => {
    if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;
    return b.startedAt.localeCompare(a.startedAt);
  });
}

async function fetchProjects(query: ProjectQuery): Promise<Paginated<ProjectSummary>> {
  const page = Math.max(1, query.page ?? 1);
  const pageSize = query.pageSize ?? 24;

  if (usingSeed) {
    let items: ProjectSummary[] = seedProjects(query.locale);
    if (query.categorySlug) items = items.filter((p) => p.categorySlug === query.categorySlug);
    if (query.tagSlug) items = items.filter((p) => p.tags.some((t) => t.slug === query.tagSlug));
    if (query.status) items = items.filter((p) => p.status === query.status);
    if (query.year) {
      items = items.filter((p) => {
        const start = Number(p.startedAt.slice(0, 4));
        const end = p.endedAt ? Number(p.endedAt.slice(0, 4)) : new Date().getFullYear();
        return start <= query.year! && query.year! <= end;
      });
    }
    const sorted = sortProjects(items);
    const start = (page - 1) * pageSize;
    return {
      items: sorted.slice(start, start + pageSize),
      total: sorted.length,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(sorted.length / pageSize)),
    };
  }

  let builder = publicClient()
    .from('v_public_projects')
    .select('*', { count: 'exact' })
    .eq('locale', query.locale);

  if (query.categorySlug) builder = builder.eq('category_slug', query.categorySlug);
  if (query.tagSlug) builder = builder.contains('tag_slugs', [query.tagSlug]);
  if (query.status) builder = builder.eq('status', query.status);

  const { data, error, count } = await builder
    .order('is_featured', { ascending: false })
    .order('started_at', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);
  if (error) throw new Error(`[data] v_public_projects: ${error.message}`);

  const total = count ?? 0;
  return {
    items: rows<PublicProjectRow>(data).map(mapProjectRow),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

/** 作品集列表。跨請求快取，後台儲存時以 `projects` tag 失效。 */
export const getProjects = cached(['projects-list'], fetchProjects, {
  tags: [cacheTags.projects],
});

export const getFeaturedProjects = cache(
  async (locale: Locale, limit: number): Promise<ProjectSummary[]> => {
    const result = await getProjects({ locale, pageSize: 100 });
    const featured = result.items.filter((project) => project.isFeatured);
    return (featured.length > 0 ? featured : result.items).slice(0, limit);
  },
);

export const getProjectCount = cached(['getProjectCount'], async (locale: Locale): Promise<number> => {
  if (usingSeed) return seedProjects(locale).length;

  const { count, error } = await publicClient()
    .from('v_public_projects')
    .select('id', { count: 'exact', head: true })
    .eq('locale', locale);
  if (error) throw new Error(`[data] v_public_projects count: ${error.message}`);
  return count ?? 0;
}, { tags: [cacheTags.projects] });

export const getProjectBySlug = cache(
  async (locale: Locale, slug: string): Promise<Project | null> => {
    if (usingSeed) {
      const project = seedProjects(locale).find((item) => item.slug === slug);
      if (!project) return null;

      const markdown = seedProjectMarkdown(slug, locale);
      const rendered = markdown ? await renderMarkdown(markdown) : null;
      return {
        ...project,
        contentHtml: rendered?.html ?? '',
        toc: rendered?.toc ?? [],
      };
    }

    const { data, error } = await publicClient()
      .from('v_public_projects')
      .select('*, content_html, toc, role, metrics, seo_title, seo_description, allow_comments')
      .eq('slug', slug)
      .eq('locale', locale)
      .maybeSingle();
    if (error) throw new Error(`[data] v_public_projects(${slug}): ${error.message}`);
    if (!data) return null;

    const row = data as unknown as PublicProjectRow & {
      content_html: string | null;
      toc: Project['toc'] | null;
      role: string | null;
      metrics: Record<string, string> | null;
      seo_title: string | null;
      seo_description: string | null;
      allow_comments: boolean;
    };

    const [images, links] = await Promise.all([
      getProjectImages(row.id, locale),
      getProjectLinks(row.id, locale),
    ]);

    return {
      ...mapProjectRow(row),
      contentHtml: row.content_html ?? '',
      toc: row.toc ?? [],
      role: row.role,
      metrics: row.metrics ?? {},
      images,
      links,
      relatedPosts: [],
      seoTitle: row.seo_title,
      seoDescription: row.seo_description,
      allowComments: row.allow_comments,
    };
  },
);

async function getProjectImages(projectId: string, locale: Locale): Promise<Project['images']> {
  const { data, error } = await publicClient()
    .from('project_images')
    .select(
      'id, url, thumbnail_url, width, height, is_cover, sort_order, project_images_i18n(caption, alt, locale)',
    )
    .eq('project_id', projectId)
    .order('sort_order')
    .limit(10);
  if (error) throw new Error(`[data] project_images: ${error.message}`);

  return rows<{
    id: string;
    url: string;
    thumbnail_url: string | null;
    width: number | null;
    height: number | null;
    is_cover: boolean;
    project_images_i18n: { caption: string | null; alt: string | null; locale: string }[] | null;
  }>(data).map((row) => {
    const i18n = (row.project_images_i18n ?? []).find((item) => item.locale === locale);
    return {
      id: row.id,
      url: row.url,
      thumbnailUrl: row.thumbnail_url,
      width: row.width,
      height: row.height,
      alt: i18n?.alt ?? null,
      caption: i18n?.caption ?? null,
      isCover: row.is_cover,
    };
  });
}

async function getProjectLinks(projectId: string, locale: Locale): Promise<Project['links']> {
  const { data, error } = await publicClient()
    .from('project_links')
    .select('id, type, url, icon, sort_order, project_links_i18n(label, locale)')
    .eq('project_id', projectId)
    .eq('is_visible', true)
    .order('sort_order');
  if (error) throw new Error(`[data] project_links: ${error.message}`);

  return rows<{
    id: string;
    type: Project['links'][number]['type'];
    url: string;
    icon: string | null;
    project_links_i18n: { label: string; locale: string }[] | null;
  }>(data).map((row) => ({
    id: row.id,
    type: row.type,
    url: row.url,
    label: (row.project_links_i18n ?? []).find((item) => item.locale === locale)?.label ?? row.url,
    icon: row.icon,
  }));
}

export async function getAllProjectSlugs(locale: Locale): Promise<string[]> {
  const result = await getProjects({ locale, pageSize: 200 });
  return result.items.map((project) => project.slug);
}

/** 作品集的篩選選項，由目前資料推導，不另建設定表。 */
export const getProjectFilters = cached(['getProjectFilters'], async (locale: Locale) => {
  const result = await getProjects({ locale, pageSize: 200 });
  const categories = new Map<string, string>();
  const tags = new Map<string, string>();
  const years = new Set<number>();

  for (const project of result.items) {
    if (project.categorySlug && project.categoryName) {
      categories.set(project.categorySlug, project.categoryName);
    }
    for (const tag of project.tags) tags.set(tag.slug, tag.name);
    years.add(Number(project.startedAt.slice(0, 4)));
  }

  return {
    categories: [...categories].map(([slug, name]) => ({ slug, name })),
    tags: [...tags].map(([slug, name]) => ({ slug, name })),
    years: [...years].sort((a, b) => b - a),
  };
}, { tags: [cacheTags.projects] });
