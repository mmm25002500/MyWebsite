'use server';

import { revalidateTag } from 'next/cache';
import { z } from 'zod';

import { writeAuditLog } from '@/lib/audit';
import { requireRole } from '@/lib/auth/session';
import { cacheTags } from '@/lib/data/cache';
import { createServerSupabase } from '@/lib/supabase/server';
import {
  saveCategorySchema,
  saveSeriesSchema,
  saveTagSchema,
  type SaveCategoryInput,
  type SaveSeriesInput,
  type SaveTagInput,
} from '@/lib/validators/taxonomy';

export interface ActionResult {
  ok: boolean;
  error?: string;
  id?: string;
}

/** 這些動作直接收 id，`string` 在執行期擋不住任何東西，因此逐一過 zod。 */
const idSchema = z.string().uuid();
const idListSchema = z.array(idSchema).max(500);

function invalidate() {
  revalidateTag(cacheTags.taxonomy);
  revalidateTag(cacheTags.posts);
  revalidateTag(cacheTags.projects);
}

/**
 * slug 變更時自動寫入轉址（規格 §6.3）。
 * 分類、標籤、系列的前台路徑各自不同，因此把前綴當參數傳進來。
 */
async function recordSlugRedirect(prefix: string, from: string, to: string) {
  if (from === to) return;
  const supabase = await createServerSupabase();
  await supabase.from('redirects').upsert(
    {
      from_path: `${prefix}/${from}`,
      to_path: `${prefix}/${to}`,
      status_code: 301,
      reason: 'slug_change',
    },
    { onConflict: 'from_path' },
  );
}

// ---------------------------------------------------------------------------
// 分類
// ---------------------------------------------------------------------------

export async function saveCategory(input: SaveCategoryInput): Promise<ActionResult> {
  await requireRole('editor');

  const parsed = saveCategorySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? '欄位驗證失敗' };
  }

  const data = parsed.data;
  const supabase = await createServerSupabase();

  let previousSlug: string | null = null;
  if (data.id) {
    const { data: row } = await supabase
      .from('categories')
      .select('slug')
      .eq('id', data.id)
      .maybeSingle();
    previousSlug = row?.slug ?? null;
  }

  const row = {
    slug: data.slug,
    icon: data.icon,
    is_visible: data.isVisible,
    sort_order: data.sortOrder,
  };

  const { data: saved, error } = data.id
    ? await supabase.from('categories').update(row).eq('id', data.id).select('id').single()
    : await supabase.from('categories').insert(row).select('id').single();

  if (error || !saved) {
    console.error('[actions] saveCategory 失敗：', error);
    return { ok: false, error: '儲存失敗' };
  }

  for (const content of data.contents) {
    const { error: i18nError } = await supabase.from('categories_i18n').upsert(
      {
        category_id: saved.id,
        locale: content.locale,
        name: content.name,
        description: content.description,
      },
      { onConflict: 'category_id,locale' },
    );
    if (i18nError) {
      console.error('[actions] saveCategory i18n 失敗：', i18nError);
      return { ok: false, error: '儲存失敗' };
    }
  }

  if (previousSlug) await recordSlugRedirect('/notes/c', previousSlug, data.slug);

  await writeAuditLog({
    action: data.id ? 'category.update' : 'category.create',
    entityType: 'category',
    entityId: saved.id,
    entityLabel: data.contents[0]?.name ?? data.slug,
  });

  invalidate();
  return { ok: true, id: saved.id };
}

/**
 * 刪除分類。
 *
 * DB 端有 trigger 擋住「會讓文章變成沒有分類」的刪除（規格 §6.3），
 * 這裡把那個錯誤翻成看得懂的訊息。
 */
export async function deleteCategory(categoryId: string): Promise<ActionResult> {
  await requireRole('admin');

  if (!idSchema.safeParse(categoryId).success) return { ok: false, error: '分類編號不正確' };

  const supabase = await createServerSupabase();
  const { data: category } = await supabase
    .from('categories')
    .select('slug, categories_i18n(name, locale)')
    .eq('id', categoryId)
    .maybeSingle();

  const { error } = await supabase.from('categories').delete().eq('id', categoryId);

  if (error) {
    console.error('[actions] deleteCategory 失敗：', error);
    /*
     * DB trigger 丟出的「僅屬於此分類」是寫給站長看的提示，照原樣轉出去；
     * 其餘一律收斂成固定訊息，免得把 Postgres 的內部細節送到瀏覽器。
     */
    const friendly = error.message.includes('僅屬於此分類') ? error.message : '刪除失敗';
    return { ok: false, error: friendly };
  }

  await writeAuditLog({
    action: 'category.delete',
    entityType: 'category',
    entityId: categoryId,
    entityLabel: category?.categories_i18n[0]?.name ?? category?.slug ?? categoryId,
    severity: 'critical',
  });

  invalidate();
  return { ok: true };
}

export async function reorderCategories(orderedIds: string[]): Promise<ActionResult> {
  await requireRole('editor');

  const parsedIds = idListSchema.safeParse(orderedIds);
  if (!parsedIds.success) return { ok: false, error: '排序資料不正確' };

  const supabase = await createServerSupabase();

  for (const [index, id] of parsedIds.data.entries()) {
    const { error } = await supabase.from('categories').update({ sort_order: index }).eq('id', id);
    if (error) {
      console.error('[actions] reorderCategories 失敗：', error);
      return { ok: false, error: '排序儲存失敗' };
    }
  }

  await writeAuditLog({ action: 'category.reorder', entityType: 'category' });
  invalidate();
  return { ok: true };
}

// ---------------------------------------------------------------------------
// 標籤
// ---------------------------------------------------------------------------

export async function saveTag(input: SaveTagInput): Promise<ActionResult> {
  await requireRole('editor');

  const parsed = saveTagSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? '欄位驗證失敗' };
  }

  const data = parsed.data;
  const supabase = await createServerSupabase();

  let previousSlug: string | null = null;
  if (data.id) {
    const { data: row } = await supabase
      .from('tags')
      .select('slug')
      .eq('id', data.id)
      .maybeSingle();
    previousSlug = row?.slug ?? null;
  }

  const { data: saved, error } = data.id
    ? await supabase
        .from('tags')
        .update({ slug: data.slug })
        .eq('id', data.id)
        .select('id')
        .single()
    : await supabase.from('tags').insert({ slug: data.slug }).select('id').single();

  if (error || !saved) {
    console.error('[actions] saveTag 失敗：', error);
    return { ok: false, error: '儲存失敗' };
  }

  for (const content of data.contents) {
    const { error: i18nError } = await supabase
      .from('tags_i18n')
      .upsert(
        { tag_id: saved.id, locale: content.locale, name: content.name },
        { onConflict: 'tag_id,locale' },
      );
    if (i18nError) {
      console.error('[actions] saveTag i18n 失敗：', i18nError);
      return { ok: false, error: '儲存失敗' };
    }
  }

  if (previousSlug) await recordSlugRedirect('/notes/tag', previousSlug, data.slug);

  await writeAuditLog({
    action: data.id ? 'tag.update' : 'tag.create',
    entityType: 'tag',
    entityId: saved.id,
    entityLabel: data.contents[0]?.name ?? data.slug,
  });

  invalidate();
  return { ok: true, id: saved.id };
}

export async function deleteTag(tagId: string): Promise<ActionResult> {
  await requireRole('admin');

  if (!idSchema.safeParse(tagId).success) return { ok: false, error: '標籤編號不正確' };

  const supabase = await createServerSupabase();
  const { data: tag } = await supabase.from('tags').select('slug').eq('id', tagId).maybeSingle();

  const { error } = await supabase.from('tags').delete().eq('id', tagId);
  if (error) {
    console.error('[actions] deleteTag 失敗：', error);
    return { ok: false, error: '刪除失敗' };
  }

  await writeAuditLog({
    action: 'tag.delete',
    entityType: 'tag',
    entityId: tagId,
    entityLabel: tag?.slug ?? tagId,
    severity: 'warning',
  });

  invalidate();
  return { ok: true };
}

/**
 * 合併標籤：把來源標籤的所有關聯改指到目標，再刪掉來源（規格 §8.3）。
 *
 * 關聯表的主鍵是 (post_id, tag_id)，直接 update 會在文章已有目標標籤時
 * 撞主鍵，因此先插入目標關聯（衝突時略過）再刪來源。
 */
export async function mergeTags(sourceId: string, targetId: string): Promise<ActionResult> {
  await requireRole('admin');
  if (sourceId === targetId) return { ok: false, error: '來源與目標不能相同' };
  if (!idSchema.safeParse(sourceId).success || !idSchema.safeParse(targetId).success) {
    return { ok: false, error: '標籤編號不正確' };
  }

  const supabase = await createServerSupabase();

  const [{ data: postLinks }, { data: projectLinks }] = await Promise.all([
    supabase.from('post_tags').select('post_id').eq('tag_id', sourceId),
    supabase.from('project_tags').select('project_id').eq('tag_id', sourceId),
  ]);

  if (postLinks && postLinks.length > 0) {
    const { error } = await supabase.from('post_tags').upsert(
      postLinks.map((row) => ({ post_id: row.post_id, tag_id: targetId })),
      { onConflict: 'post_id,tag_id', ignoreDuplicates: true },
    );
    if (error) {
      console.error('[actions] mergeTags post_tags 失敗：', error);
      return { ok: false, error: '合併失敗' };
    }
  }

  if (projectLinks && projectLinks.length > 0) {
    const { error } = await supabase.from('project_tags').upsert(
      projectLinks.map((row) => ({ project_id: row.project_id, tag_id: targetId })),
      { onConflict: 'project_id,tag_id', ignoreDuplicates: true },
    );
    if (error) {
      console.error('[actions] mergeTags project_tags 失敗：', error);
      return { ok: false, error: '合併失敗' };
    }
  }

  const { error: deleteError } = await supabase.from('tags').delete().eq('id', sourceId);
  if (deleteError) {
    console.error('[actions] mergeTags 刪除來源失敗：', deleteError);
    return { ok: false, error: '合併失敗' };
  }

  await writeAuditLog({
    action: 'tag.merge',
    entityType: 'tag',
    entityId: targetId,
    entityLabel: `${postLinks?.length ?? 0} 篇文章、${projectLinks?.length ?? 0} 個作品`,
    severity: 'warning',
  });

  invalidate();
  return { ok: true };
}

/** 清除沒有被任何文章或作品使用的標籤（規格 §8.3）。 */
export async function pruneUnusedTags(): Promise<ActionResult & { removed?: number }> {
  await requireRole('admin');

  const supabase = await createServerSupabase();
  const { data: unused, error } = await supabase
    .from('tags')
    .select('id, slug')
    .eq('post_count', 0)
    .eq('project_count', 0);

  if (error) {
    console.error('[actions] pruneUnusedTags 查詢失敗：', error);
    return { ok: false, error: '查詢失敗' };
  }
  if (!unused || unused.length === 0) return { ok: true, removed: 0 };

  const { error: deleteError } = await supabase
    .from('tags')
    .delete()
    .in(
      'id',
      unused.map((row) => row.id),
    );
  if (deleteError) {
    console.error('[actions] pruneUnusedTags 刪除失敗：', deleteError);
    return { ok: false, error: '清除失敗' };
  }

  await writeAuditLog({
    action: 'tag.prune',
    entityType: 'tag',
    entityLabel: `清除 ${unused.length} 個未使用標籤`,
    severity: 'warning',
  });

  invalidate();
  return { ok: true, removed: unused.length };
}

// ---------------------------------------------------------------------------
// 系列
// ---------------------------------------------------------------------------

export async function saveSeries(input: SaveSeriesInput): Promise<ActionResult> {
  await requireRole('editor');

  const parsed = saveSeriesSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? '欄位驗證失敗' };
  }

  const data = parsed.data;
  const supabase = await createServerSupabase();

  let previousSlug: string | null = null;
  if (data.id) {
    const { data: row } = await supabase
      .from('series')
      .select('slug')
      .eq('id', data.id)
      .maybeSingle();
    previousSlug = row?.slug ?? null;
  }

  const row = { slug: data.slug, is_visible: data.isVisible, sort_order: data.sortOrder };

  const { data: saved, error } = data.id
    ? await supabase.from('series').update(row).eq('id', data.id).select('id').single()
    : await supabase.from('series').insert(row).select('id').single();

  if (error || !saved) {
    console.error('[actions] saveSeries 失敗：', error);
    return { ok: false, error: '儲存失敗' };
  }

  for (const content of data.contents) {
    const { error: i18nError } = await supabase.from('series_i18n').upsert(
      {
        series_id: saved.id,
        locale: content.locale,
        title: content.title,
        description: content.description,
      },
      { onConflict: 'series_id,locale' },
    );
    if (i18nError) {
      console.error('[actions] saveSeries i18n 失敗：', i18nError);
      return { ok: false, error: '儲存失敗' };
    }
  }

  if (previousSlug) await recordSlugRedirect('/notes/series', previousSlug, data.slug);

  await writeAuditLog({
    action: data.id ? 'series.update' : 'series.create',
    entityType: 'series',
    entityId: saved.id,
    entityLabel: data.contents[0]?.title ?? data.slug,
  });

  invalidate();
  return { ok: true, id: saved.id };
}

export async function deleteSeries(seriesId: string): Promise<ActionResult> {
  await requireRole('admin');

  if (!idSchema.safeParse(seriesId).success) return { ok: false, error: '系列編號不正確' };

  const supabase = await createServerSupabase();
  const { data: series } = await supabase
    .from('series')
    .select('slug')
    .eq('id', seriesId)
    .maybeSingle();

  // 文章的 series_id 是 on delete set null，刪掉系列不會連帶刪文章。
  const { error } = await supabase.from('series').delete().eq('id', seriesId);
  if (error) {
    console.error('[actions] deleteSeries 失敗：', error);
    return { ok: false, error: '刪除失敗' };
  }

  await writeAuditLog({
    action: 'series.delete',
    entityType: 'series',
    entityId: seriesId,
    entityLabel: series?.slug ?? seriesId,
    severity: 'warning',
  });

  invalidate();
  return { ok: true };
}

/** 調整系列內的文章順序（規格 §8.3）。 */
export async function reorderSeriesPosts(
  seriesId: string,
  orderedPostIds: string[],
): Promise<ActionResult> {
  await requireRole('editor');

  if (!idSchema.safeParse(seriesId).success) return { ok: false, error: '系列編號不正確' };
  const parsedIds = idListSchema.safeParse(orderedPostIds);
  if (!parsedIds.success) return { ok: false, error: '排序資料不正確' };

  const supabase = await createServerSupabase();

  for (const [index, postId] of parsedIds.data.entries()) {
    const { error } = await supabase
      .from('posts')
      .update({ series_order: index + 1 })
      .eq('id', postId)
      .eq('series_id', seriesId);
    if (error) {
      console.error('[actions] reorderSeriesPosts 失敗：', error);
      return { ok: false, error: '排序儲存失敗' };
    }
  }

  await writeAuditLog({ action: 'series.reorder', entityType: 'series', entityId: seriesId });
  invalidate();
  return { ok: true };
}
