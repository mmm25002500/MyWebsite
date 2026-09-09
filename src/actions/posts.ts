'use server';

import { revalidateTag } from 'next/cache';

import { requireRole } from '@/lib/auth/session';
import { renderMarkdown } from '@/lib/content/markdown';
import { cacheTags } from '@/lib/data/cache';
import { buildDiff, writeAuditLog } from '@/lib/audit';
import { createServerSupabase } from '@/lib/supabase/server';
import type { Json } from '@/types/database';
import { savePostSchema, validatePrimaryCategory, type SavePostInput } from '@/lib/validators/post';

export interface ActionResult {
  ok: boolean;
  error?: string;
  postId?: string;
  issues?: { name: string; message: string; line: number | null }[];
}

/**
 * 儲存文章（規格 §5：驗證 session → 檢查權限 → zod 驗證 → 寫入 → audit → revalidate）。
 *
 * `content_md` 是唯一真實來源，html／text／toc 一律在這裡重新產生，
 * 不接受由客戶端傳進來的衍生欄位。
 */
export async function savePost(input: SavePostInput): Promise<ActionResult> {
  // 權限不足時 requireRole 會直接拋錯，這裡不需要回傳值。
  await requireRole('editor');

  const parsed = savePostSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? '欄位驗證失敗' };
  }

  const data = parsed.data;
  const primaryError = validatePrimaryCategory(data);
  if (primaryError) return { ok: false, error: primaryError };

  const supabase = await createServerSupabase();

  // slug 變更時要自動寫入轉址（規格 §6.3），因此先取舊值。
  let previous: { slug: string; status: string } | null = null;
  if (data.id) {
    const { data: row } = await supabase
      .from('posts')
      .select('slug, status')
      .eq('id', data.id)
      .maybeSingle();
    previous = row;
  }

  const postRow = {
    slug: data.slug,
    status: data.status,
    published_at:
      data.status === 'published'
        ? (data.publishedAt ?? new Date().toISOString())
        : data.publishedAt,
    cover_url: data.coverUrl,
    canonical_url: data.canonicalUrl,
    is_pinned: data.isPinned,
    is_featured: data.isFeatured,
    allow_comments: data.allowComments,
    series_id: data.seriesId,
    series_order: data.seriesOrder,
  };

  const { data: saved, error: saveError } = data.id
    ? await supabase.from('posts').update(postRow).eq('id', data.id).select('id').single()
    : await supabase.from('posts').insert(postRow).select('id').single();

  if (saveError || !saved) {
    return { ok: false, error: saveError?.message ?? '儲存失敗' };
  }

  const postId = saved.id;
  const issues: ActionResult['issues'] = [];

  for (const content of data.contents) {
    const rendered = await renderMarkdown(content.contentMd);
    issues.push(...rendered.issues);

    const { error } = await supabase.from('posts_i18n').upsert(
      {
        post_id: postId,
        locale: content.locale,
        title: content.title,
        subtitle: content.subtitle,
        excerpt: content.excerpt || rendered.text.slice(0, 150),
        content_md: content.contentMd,
        content_html: rendered.html,
        content_text: rendered.text,
        // TocItem 是具名介面，沒有索引簽章，因此無法直接指派給 Json。
        toc: rendered.toc as unknown as Json,
        reading_time_min: rendered.readingTimeMin,
        word_count: rendered.wordCount,
        seo_title: content.seoTitle,
        seo_description: content.seoDescription,
      },
      { onConflict: 'post_id,locale' },
    );

    if (error) return { ok: false, error: `${content.locale} 內容儲存失敗：${error.message}` };
  }

  // 分類與標籤以「先刪後建」同步，避免殘留舊的關聯。
  await supabase.from('post_categories').delete().eq('post_id', postId);
  const categoryRows = data.categoryIds.map((categoryId) => ({
    post_id: postId,
    category_id: categoryId,
    is_primary: categoryId === data.primaryCategoryId,
  }));
  const { error: categoryError } = await supabase.from('post_categories').insert(categoryRows);
  if (categoryError) return { ok: false, error: `分類儲存失敗：${categoryError.message}` };

  await supabase.from('post_tags').delete().eq('post_id', postId);
  if (data.tagIds.length > 0) {
    await supabase
      .from('post_tags')
      .insert(data.tagIds.map((tagId) => ({ post_id: postId, tag_id: tagId })));
  }

  // slug 變更：自動建立 301 轉址，舊網址不會死掉（規格 §6.3）。
  if (previous && previous.slug !== data.slug) {
    await supabase.from('redirects').upsert(
      {
        from_path: `/notes/p/${previous.slug}`,
        to_path: `/notes/p/${data.slug}`,
        status_code: 301,
        reason: 'slug_change',
      },
      { onConflict: 'from_path' },
    );
  }

  await writeAuditLog({
    action: data.id ? 'post.update' : 'post.create',
    entityType: 'post',
    entityId: postId,
    entityLabel: data.contents[0]?.title ?? data.slug,
    diff: previous
      ? buildDiff(
          { slug: previous.slug, status: previous.status },
          { slug: data.slug, status: data.status },
        )
      : null,
    severity: previous?.status !== data.status ? 'warning' : 'info',
  });

  revalidateTag(cacheTags.posts);
  revalidateTag(cacheTags.taxonomy);

  return { ok: true, postId, issues: issues.length > 0 ? issues : undefined };
}

/** 刪除文章。依規格 §6.12 僅 owner 可刪。 */
export async function deletePost(postId: string): Promise<ActionResult> {
  await requireRole('owner');

  const supabase = await createServerSupabase();
  const { data: post } = await supabase
    .from('posts')
    .select('slug, posts_i18n(title, locale)')
    .eq('id', postId)
    .maybeSingle();

  const { error } = await supabase.from('posts').delete().eq('id', postId);
  if (error) return { ok: false, error: error.message };

  await writeAuditLog({
    action: 'post.delete',
    entityType: 'post',
    entityId: postId,
    entityLabel: post?.posts_i18n[0]?.title ?? post?.slug ?? postId,
    severity: 'critical',
  });

  revalidateTag(cacheTags.posts);
  return { ok: true };
}

/** 批次改狀態，供列表頁的多選操作使用（規格 §8.0）。 */
export async function bulkUpdateStatus(
  postIds: string[],
  status: SavePostInput['status'],
): Promise<ActionResult> {
  await requireRole('editor');
  if (postIds.length === 0) return { ok: true };

  const supabase = await createServerSupabase();

  // 發佈時補上發佈時間；其他狀態沿用原本的值。
  const patch =
    status === 'published'
      ? { status, published_at: new Date().toISOString() }
      : { status };

  const { error } = await supabase.from('posts').update(patch).in('id', postIds);
  if (error) return { ok: false, error: error.message };

  await writeAuditLog({
    action: 'post.bulk_status',
    entityType: 'post',
    entityLabel: `${postIds.length} 篇 → ${status}`,
    severity: 'warning',
  });

  revalidateTag(cacheTags.posts);
  return { ok: true };
}
