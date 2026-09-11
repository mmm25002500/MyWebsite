'use server';

import { revalidateTag } from 'next/cache';
import { z } from 'zod';

import { writeAuditLog } from '@/lib/audit';
import { requireRole } from '@/lib/auth/session';
import { renderMarkdown } from '@/lib/content/markdown';
import { cacheTags } from '@/lib/data/cache';
import { createServerSupabase } from '@/lib/supabase/server';
import { saveProjectSchema, type SaveProjectInput } from '@/lib/validators/project';
import type { Json } from '@/types/database';

export interface ActionResult {
  ok: boolean;
  error?: string;
  projectId?: string;
}

/** 這些動作直接收 id 或自由字串，`string` 在執行期擋不住任何東西。 */
const idSchema = z.string().uuid();
const repoListSchema = z
  .array(
    z
      .string()
      .trim()
      .regex(/^[\w.-]+\/[\w.-]+$/),
  )
  .max(100);

/**
 * 儲存作品（規格 §8.4）。
 *
 * 圖片、連結、標籤、關聯文章都以「先刪後建」同步。作品的子項目數量少
 * （圖片上限 10 張），逐筆比對差異的複雜度不划算。
 */
export async function saveProject(input: SaveProjectInput): Promise<ActionResult> {
  await requireRole('editor');

  const parsed = saveProjectSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? '欄位驗證失敗' };
  }

  const data = parsed.data;
  const supabase = await createServerSupabase();

  let previousSlug: string | null = null;
  if (data.id) {
    const { data: row } = await supabase
      .from('projects')
      .select('slug')
      .eq('id', data.id)
      .maybeSingle();
    previousSlug = row?.slug ?? null;
  }

  const projectRow = {
    slug: data.slug,
    status: data.status,
    started_at: data.startedAt,
    ended_at: data.endedAt,
    category_id: data.categoryId,
    organization_id: data.organizationId,
    cover_url: data.coverUrl,
    github_repo: data.githubRepo,
    is_featured: data.isFeatured,
    is_visible: data.isVisible,
    allow_comments: data.allowComments,
    sort_order: data.sortOrder,
    metrics: data.metrics as Json,
  };

  const { data: saved, error } = data.id
    ? await supabase.from('projects').update(projectRow).eq('id', data.id).select('id').single()
    : await supabase.from('projects').insert(projectRow).select('id').single();

  if (error || !saved) {
    console.error('[actions] saveProject 失敗：', error);
    return { ok: false, error: '儲存失敗' };
  }
  const projectId = saved.id;

  for (const content of data.contents) {
    const rendered = await renderMarkdown(content.contentMd);
    const { error: i18nError } = await supabase.from('projects_i18n').upsert(
      {
        project_id: projectId,
        locale: content.locale,
        name: content.name,
        tagline: content.tagline,
        summary: content.summary,
        content_md: content.contentMd,
        content_html: rendered.html,
        content_text: rendered.text,
        toc: rendered.toc as unknown as Json,
        role: content.role,
        seo_title: content.seoTitle,
        seo_description: content.seoDescription,
      },
      { onConflict: 'project_id,locale' },
    );
    if (i18nError) return { ok: false, error: `${content.locale}：${i18nError.message}` };
  }

  await supabase.from('project_tags').delete().eq('project_id', projectId);
  if (data.tagIds.length > 0) {
    await supabase
      .from('project_tags')
      .insert(data.tagIds.map((tagId) => ({ project_id: projectId, tag_id: tagId })));
  }

  await supabase.from('project_posts').delete().eq('project_id', projectId);
  if (data.relatedPostIds.length > 0) {
    await supabase.from('project_posts').insert(
      data.relatedPostIds.map((postId, index) => ({
        project_id: projectId,
        post_id: postId,
        sort_order: index,
      })),
    );
  }

  // 圖片：先刪再建，才不會撞到 DB 端「最多 10 張」的 trigger。
  await supabase.from('project_images').delete().eq('project_id', projectId);
  for (const [index, image] of data.images.entries()) {
    const { data: savedImage, error: imageError } = await supabase
      .from('project_images')
      .insert({
        project_id: projectId,
        url: image.url,
        sort_order: index,
        is_cover: image.isCover,
      })
      .select('id')
      .single();

    if (imageError || !savedImage) {
      return { ok: false, error: `圖片儲存失敗：${imageError?.message ?? ''}` };
    }

    if (image.alt || image.caption) {
      await supabase.from('project_images_i18n').insert(
        data.contents.map((content) => ({
          image_id: savedImage.id,
          locale: content.locale,
          alt: image.alt || null,
          caption: image.caption || null,
        })),
      );
    }
  }

  await supabase.from('project_links').delete().eq('project_id', projectId);
  for (const [index, link] of data.links.entries()) {
    const { data: savedLink, error: linkError } = await supabase
      .from('project_links')
      .insert({
        project_id: projectId,
        type: link.type,
        url: link.url,
        sort_order: index,
        is_visible: true,
      })
      .select('id')
      .single();

    if (linkError || !savedLink) {
      return { ok: false, error: `連結儲存失敗：${linkError?.message ?? ''}` };
    }

    await supabase.from('project_links_i18n').insert(
      data.contents.map((content) => ({
        link_id: savedLink.id,
        locale: content.locale,
        label: link.label,
      })),
    );
  }

  if (previousSlug && previousSlug !== data.slug) {
    await supabase.from('redirects').upsert(
      {
        from_path: `/projects/${previousSlug}`,
        to_path: `/projects/${data.slug}`,
        status_code: 301,
        reason: 'slug_change',
      },
      { onConflict: 'from_path' },
    );
  }

  await writeAuditLog({
    action: data.id ? 'project.update' : 'project.create',
    entityType: 'project',
    entityId: projectId,
    entityLabel: data.contents[0]?.name ?? data.slug,
  });

  revalidateTag(cacheTags.projects);
  return { ok: true, projectId };
}

export async function deleteProject(projectId: string): Promise<ActionResult> {
  await requireRole('owner');

  if (!idSchema.safeParse(projectId).success) return { ok: false, error: '作品編號不正確' };

  const supabase = await createServerSupabase();
  const { data: project } = await supabase
    .from('projects')
    .select('slug')
    .eq('id', projectId)
    .maybeSingle();

  const { error } = await supabase.from('projects').delete().eq('id', projectId);
  if (error) {
    console.error('[actions] deleteProject 失敗：', error);
    return { ok: false, error: '刪除失敗' };
  }

  await writeAuditLog({
    action: 'project.delete',
    entityType: 'project',
    entityId: projectId,
    entityLabel: project?.slug ?? projectId,
    severity: 'critical',
  });

  revalidateTag(cacheTags.projects);
  return { ok: true };
}

interface GithubRepoSummary {
  fullName: string;
  name: string;
  url: string;
  description: string | null;
  language: string | null;
  stars: number;
  forks: number;
  pushedAt: string;
}

/**
 * 從 GitHub 匯入專案草稿（規格 §8.4）。
 *
 * 走自家的 /api/github 代理而不是直接打 GitHub：金鑰只在 server 端，
 * 而且那支有六小時快取，重複開啟匯入畫面不會一直消耗 API 額度。
 */
export async function importFromGithub(
  repoFullNames: string[],
): Promise<ActionResult & { created?: number }> {
  await requireRole('editor');
  if (repoFullNames.length === 0) return { ok: true, created: 0 };

  const parsedRepos = repoListSchema.safeParse(repoFullNames);
  if (!parsedRepos.success) return { ok: false, error: 'repo 名稱格式不正確' };

  const { siteUrl } = await import('@/lib/env');
  const response = await fetch(`${siteUrl}/api/github`, { next: { revalidate: 21600 } });
  if (!response.ok) return { ok: false, error: '無法取得 GitHub 資料' };

  const payload = (await response.json()) as { repos: GithubRepoSummary[] };
  const wanted = new Set(parsedRepos.data);
  const repos = payload.repos.filter((repo) => wanted.has(repo.fullName));

  const supabase = await createServerSupabase();
  let created = 0;

  for (const repo of repos) {
    const slug = repo.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const { data: existing } = await supabase
      .from('projects')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();
    if (existing) continue;

    const { data: project, error } = await supabase
      .from('projects')
      .insert({
        slug,
        status: 'completed',
        started_at: repo.pushedAt.slice(0, 10),
        github_repo: repo.fullName,
        stars: repo.stars,
        forks: repo.forks,
        primary_language: repo.language,
        last_pushed_at: repo.pushedAt,
        // 匯入的一律先隱藏，確認內容後再上架（同 §8.2.1 匯入文章先進草稿）。
        is_visible: false,
      })
      .select('id')
      .single();

    if (error || !project) continue;

    await supabase.from('projects_i18n').insert({
      project_id: project.id,
      locale: 'zh-TW',
      name: repo.name,
      tagline: repo.description,
      content_md: '',
    });

    await supabase.from('project_links').insert({
      project_id: project.id,
      type: 'github',
      url: repo.url,
      sort_order: 0,
    });

    created += 1;
  }

  await writeAuditLog({
    action: 'project.github_import',
    entityType: 'project',
    entityLabel: `匯入 ${created} 個專案`,
    severity: 'warning',
  });

  revalidateTag(cacheTags.projects);
  return { ok: true, created };
}
