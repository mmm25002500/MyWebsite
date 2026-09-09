'use server';

import { revalidateTag } from 'next/cache';
import { z } from 'zod';

import { writeAuditLog } from '@/lib/audit';
import { requireRole } from '@/lib/auth/session';
import { cacheTags } from '@/lib/data/cache';
import { createServerSupabase } from '@/lib/supabase/server';
import type { Json } from '@/types/database';

export interface ActionResult {
  ok: boolean;
  error?: string;
  id?: string;
}

/**
 * 後台的簡單資源（組織、時間軸、連結樹、贊助、更新日誌、轉址…）。
 *
 * 這些表的形狀一致：一張主表加一張 `*_i18n` 子表，操作只有新增／更新／刪除／排序。
 * 為每一個各寫一支 Server Action 會產生十幾份只有表名不同的程式碼，因此改為
 * 一支通用動作，以白名單限制可操作的表與可寫入的欄位——不能讓呼叫端指定
 * 任意表名，那等於把整個資料庫開放給前端。
 */
const resourceConfig = {
  organizations: {
    i18nTable: 'organizations_i18n',
    i18nKey: 'org_id',
    columns: ['slug', 'logo_url', 'website_url', 'github_org', 'started_at', 'ended_at', 'status', 'sort_order', 'is_visible'],
    i18nColumns: ['name', 'role', 'description_md', 'description_html'],
    minRole: 'editor',
    tag: 'site',
  },
  timeline_events: {
    i18nTable: 'timeline_events_i18n',
    i18nKey: 'event_id',
    columns: ['event_date', 'end_date', 'branch', 'type', 'icon', 'color', 'image_url', 'link_url', 'is_milestone', 'is_visible', 'sort_order'],
    i18nColumns: ['title', 'subtitle', 'description'],
    minRole: 'editor',
    tag: 'timeline',
  },
  link_groups: {
    i18nTable: 'link_groups_i18n',
    i18nKey: 'group_id',
    columns: ['key', 'sort_order', 'is_visible'],
    i18nColumns: ['name'],
    minRole: 'editor',
    tag: 'site',
  },
  link_buttons: {
    i18nTable: 'link_buttons_i18n',
    i18nKey: 'button_id',
    columns: ['group_id', 'url', 'image_url', 'icon', 'bg_color', 'text_color', 'is_highlighted', 'sort_order', 'is_visible'],
    i18nColumns: ['label', 'description'],
    minRole: 'editor',
    tag: 'site',
  },
  sponsor_methods: {
    i18nTable: 'sponsor_methods_i18n',
    i18nKey: 'method_id',
    columns: ['key', 'type', 'address_or_url', 'qr_image_url', 'network', 'icon', 'sort_order', 'is_visible'],
    i18nColumns: ['label', 'note'],
    minRole: 'editor',
    tag: 'site',
  },
  sponsors: {
    i18nTable: 'sponsors_i18n',
    i18nKey: 'sponsor_id',
    columns: ['display_name', 'avatar_url', 'url', 'tier', 'amount_note', 'sponsored_at', 'is_anonymous', 'is_visible', 'sort_order'],
    i18nColumns: ['message'],
    minRole: 'editor',
    tag: 'site',
  },
  changelog_entries: {
    i18nTable: 'changelog_entries_i18n',
    i18nKey: 'entry_id',
    columns: ['version', 'released_at', 'sort_order', 'is_visible'],
    i18nColumns: ['title', 'items'],
    minRole: 'editor',
    tag: 'site',
  },
  redirects: {
    i18nTable: null,
    i18nKey: null,
    columns: ['from_path', 'to_path', 'status_code', 'is_active', 'reason'],
    i18nColumns: [],
    minRole: 'admin',
    tag: 'site',
  },
  video_meta: {
    i18nTable: 'video_meta_i18n',
    i18nKey: 'video_meta_id',
    columns: ['youtube_id', 'category', 'is_featured', 'is_hidden', 'sort_order'],
    i18nColumns: ['title_override', 'description_override'],
    minRole: 'editor',
    tag: 'site',
  },
  interests: {
    i18nTable: 'interests_i18n',
    i18nKey: 'interest_id',
    columns: ['icon', 'sort_order', 'is_visible'],
    i18nColumns: ['title', 'description'],
    minRole: 'editor',
    tag: 'site',
  },
} as const;

export type ResourceTable = keyof typeof resourceConfig;

const saveSchema = z.object({
  table: z.enum(Object.keys(resourceConfig) as [ResourceTable, ...ResourceTable[]]),
  id: z.string().uuid().nullable(),
  values: z.record(z.string(), z.unknown()),
  i18n: z.array(z.object({ locale: z.string() }).catchall(z.unknown())).default([]),
  label: z.string().max(200).optional(),
});

export type SaveResourceInput = z.input<typeof saveSchema>;

/**
 * 只保留白名單內的欄位，其餘一律丟棄。
 *
 * 回傳型別刻意放寬成 `never`：這支動作在多張表之間共用，產生的 schema 型別
 * 無法表達「欄位取決於執行期的表名」。安全性由上面的白名單保證——呼叫端
 * 送進來的任何額外欄位在這裡就被丟掉，不會抵達資料庫。
 */
function pick(values: Record<string, unknown>, allowed: readonly string[]) {
  const out: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in values) out[key] = values[key];
  }
  return out as never;
}

export async function saveResource(input: SaveResourceInput): Promise<ActionResult> {
  const parsed = saveSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: '欄位驗證失敗' };

  const { table, id, values, i18n, label } = parsed.data;
  const config = resourceConfig[table];
  await requireRole(config.minRole);

  const supabase = await createServerSupabase();
  const row = pick(values, config.columns);

  const { data: saved, error } = id
    ? await supabase.from(table).update(row).eq('id', id).select('id').single()
    : await supabase.from(table).insert(row).select('id').single();

  if (error || !saved) return { ok: false, error: error?.message ?? '儲存失敗' };

  if (config.i18nTable && config.i18nKey) {
    for (const content of i18n) {
      const { locale, ...rest } = content;
      const { error: i18nError } = await supabase.from(config.i18nTable).upsert(
        { [config.i18nKey]: saved.id, locale, ...(pick(rest, config.i18nColumns) as object) } as never,
        { onConflict: `${config.i18nKey},locale` },
      );
      if (i18nError) return { ok: false, error: i18nError.message };
    }
  }

  await writeAuditLog({
    action: id ? `${table}.update` : `${table}.create`,
    entityType: table,
    entityId: saved.id,
    entityLabel: label,
  });

  revalidateTag(config.tag);
  return { ok: true, id: saved.id };
}

export async function deleteResource(table: ResourceTable, id: string): Promise<ActionResult> {
  const config = resourceConfig[table];
  if (!config) return { ok: false, error: '不允許操作這個資源' };

  await requireRole('admin');

  const supabase = await createServerSupabase();
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) return { ok: false, error: error.message };

  await writeAuditLog({
    action: `${table}.delete`,
    entityType: table,
    entityId: id,
    severity: 'warning',
  });

  revalidateTag(config.tag);
  return { ok: true };
}

export async function reorderResource(
  table: ResourceTable,
  orderedIds: string[],
): Promise<ActionResult> {
  const config = resourceConfig[table];
  if (!config) return { ok: false, error: '不允許操作這個資源' };

  await requireRole(config.minRole);

  const supabase = await createServerSupabase();
  for (const [index, id] of orderedIds.entries()) {
    // 同上：表名在執行期才決定，產生的型別無法收斂。
    const { error } = await supabase
      .from(table)
      .update({ sort_order: index } as never)
      .eq('id', id);
    if (error) return { ok: false, error: error.message };
  }

  await writeAuditLog({ action: `${table}.reorder`, entityType: table });
  revalidateTag(config.tag);
  return { ok: true };
}

/** 站台設定（規格 §8.9）。敏感金鑰只放環境變數，不進 DB。 */
export async function saveSetting(key: string, value: Json): Promise<ActionResult> {
  await requireRole('owner');

  const parsed = z.string().min(1).max(80).safeParse(key);
  if (!parsed.success) return { ok: false, error: '設定鍵不正確' };

  const supabase = await createServerSupabase();
  const { data: before } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', parsed.data)
    .maybeSingle();

  const { error } = await supabase
    .from('site_settings')
    .upsert({ key: parsed.data, value }, { onConflict: 'key' });
  if (error) return { ok: false, error: error.message };

  await writeAuditLog({
    action: 'settings.update',
    entityType: 'settings',
    entityLabel: parsed.data,
    diff: { before: before?.value ?? null, after: value } as Json,
    severity: 'critical',
  });

  revalidateTag(cacheTags.site);
  return { ok: true };
}
