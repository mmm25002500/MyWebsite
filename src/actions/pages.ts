'use server';

import { revalidateTag } from 'next/cache';
import { z } from 'zod';

import { buildDiff, writeAuditLog } from '@/lib/audit';
import { requireRole } from '@/lib/auth/session';
import { renderMarkdown } from '@/lib/content/markdown';
import { cacheTags } from '@/lib/data/cache';
import { locales } from '@/lib/i18n/config';
import { createServerSupabase } from '@/lib/supabase/server';
import type { Json } from '@/types/database';

export interface ActionResult {
  ok: boolean;
  error?: string;
  issues?: { name: string; message: string; line: number | null }[];
}

const savePageSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['draft', 'published']),
  contents: z
    .array(
      z.object({
        locale: z.enum(locales),
        title: z.string().trim().min(1, '標題不能空白').max(200),
        contentMd: z.string().max(200_000),
        seoTitle: z
          .preprocess((v) => (v === '' ? null : v), z.string().trim().max(200).nullable())
          .default(null),
        seoDescription: z
          .preprocess((v) => (v === '' ? null : v), z.string().trim().max(400).nullable())
          .default(null),
      }),
    )
    .min(1),
});

export type SavePageInput = z.input<typeof savePageSchema>;

/**
 * 儲存單頁（隱私權政策、使用條款…）。
 *
 * 與文章同一套規則：`content_md` 是唯一真實來源，html／text／toc 一律在這裡
 * 重新產生，不接受客戶端傳進來的衍生欄位（規格 §9.1）。
 *
 * slug 不開放修改——`/privacy` 與 `/terms` 是寫在路由裡的固定路徑，
 * 改了 slug 頁面就會 404。
 */
export async function savePage(input: SavePageInput): Promise<ActionResult> {
  await requireRole('editor');

  const parsed = savePageSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? '欄位驗證失敗' };
  }

  const data = parsed.data;
  const supabase = await createServerSupabase();

  const { data: before } = await supabase
    .from('pages')
    .select('slug, status')
    .eq('id', data.id)
    .maybeSingle();

  if (!before) return { ok: false, error: '找不到這個頁面' };

  const { error: statusError } = await supabase
    .from('pages')
    .update({ status: data.status })
    .eq('id', data.id);

  if (statusError) {
    console.error('[actions] savePage 狀態儲存失敗：', statusError);
    return { ok: false, error: '儲存失敗' };
  }

  const issues: ActionResult['issues'] = [];

  for (const content of data.contents) {
    const rendered = await renderMarkdown(content.contentMd);
    issues.push(...rendered.issues);

    const { error } = await supabase.from('pages_i18n').upsert(
      {
        page_id: data.id,
        locale: content.locale,
        title: content.title,
        content_md: content.contentMd,
        content_html: rendered.html,
        content_text: rendered.text,
        // TocItem 是具名介面，沒有索引簽章，因此無法直接指派給 Json。
        toc: rendered.toc as unknown as Json,
        seo_title: content.seoTitle,
        seo_description: content.seoDescription,
      },
      { onConflict: 'page_id,locale' },
    );

    if (error) {
      console.error('[actions] savePage 內容儲存失敗：', error);
      return { ok: false, error: `${content.locale} 內容儲存失敗` };
    }
  }

  await writeAuditLog({
    action: 'page.update',
    entityType: 'page',
    entityId: data.id,
    entityLabel: before.slug,
    diff: buildDiff({ status: before.status }, { status: data.status }) as Json,
    severity: 'warning',
  });

  revalidateTag(cacheTags.pages);
  return { ok: true, issues };
}

const navSchema = z.object({
  key: z.string().min(1).max(40),
  isVisible: z.boolean(),
});

/**
 * 導覽列的顯示與順序。
 *
 * 存進 `site_settings.nav_items`，前台由 `getNavItems()` 讀回來。項目本身
 * 是固定的十個路由，這裡只決定「顯示哪些、照什麼順序」——新增路由要改程式碼。
 */
export async function saveNavItems(items: z.input<typeof navSchema>[]): Promise<ActionResult> {
  await requireRole('editor');

  const parsed = z.array(navSchema).min(1).max(40).safeParse(items);
  if (!parsed.success) return { ok: false, error: '欄位驗證失敗' };

  if (!parsed.data.some((item) => item.isVisible)) {
    return { ok: false, error: '至少要保留一個顯示的項目' };
  }

  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from('site_settings')
    .upsert({ key: 'nav_items', value: parsed.data as unknown as Json }, { onConflict: 'key' });

  if (error) {
    console.error('[actions] saveNavItems 儲存失敗：', error);
    return { ok: false, error: '儲存失敗' };
  }

  await writeAuditLog({
    action: 'page.nav',
    entityType: 'page',
    entityLabel: '導覽列',
    severity: 'warning',
  });

  revalidateTag(cacheTags.site);
  return { ok: true };
}

const sectionSchema = z.object({
  id: z.string().uuid(),
  isVisible: z.boolean(),
  sortOrder: z.number().int().min(0).max(99),
});

/** 首頁區塊的顯示與排序（規格 §8.5）。 */
export async function saveHomeSections(
  sections: z.input<typeof sectionSchema>[],
): Promise<ActionResult> {
  await requireRole('editor');

  const parsed = z.array(sectionSchema).max(50).safeParse(sections);
  if (!parsed.success) return { ok: false, error: '欄位驗證失敗' };

  const supabase = await createServerSupabase();

  for (const section of parsed.data) {
    const { error } = await supabase
      .from('page_sections')
      .update({ is_visible: section.isVisible, sort_order: section.sortOrder })
      .eq('id', section.id);

    if (error) {
      console.error('[actions] saveHomeSections 儲存失敗：', error);
      return { ok: false, error: '儲存失敗' };
    }
  }

  await writeAuditLog({
    action: 'page.sections',
    entityType: 'page',
    entityLabel: 'home',
    severity: 'warning',
  });

  revalidateTag(cacheTags.site);
  return { ok: true };
}
