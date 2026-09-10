'use server';

import { revalidateTag } from 'next/cache';
import { z } from 'zod';

import { writeAuditLog } from '@/lib/audit';
import { requireRole } from '@/lib/auth/session';
import { cacheTags } from '@/lib/data/cache';
import { createServerSupabase } from '@/lib/supabase/server';
import {
  httpUrl,
  optionalHttpUrl,
  redirectSource,
  redirectTarget,
} from '@/lib/validators/url';
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
    urlColumns: ['logo_url', 'website_url'],
    minRole: 'editor',
    tag: 'site',
  },
  timeline_events: {
    i18nTable: 'timeline_events_i18n',
    i18nKey: 'event_id',
    columns: ['event_date', 'end_date', 'branch', 'type', 'icon', 'color', 'image_url', 'link_url', 'is_milestone', 'is_visible', 'sort_order'],
    i18nColumns: ['title', 'subtitle', 'description'],
    urlColumns: ['image_url', 'link_url'],
    minRole: 'editor',
    tag: 'timeline',
  },
  link_groups: {
    i18nTable: 'link_groups_i18n',
    i18nKey: 'group_id',
    columns: ['key', 'sort_order', 'is_visible'],
    i18nColumns: ['name'],
    urlColumns: [],
    minRole: 'editor',
    tag: 'site',
  },
  link_buttons: {
    i18nTable: 'link_buttons_i18n',
    i18nKey: 'button_id',
    columns: ['group_id', 'url', 'image_url', 'icon', 'bg_color', 'text_color', 'is_highlighted', 'sort_order', 'is_visible'],
    i18nColumns: ['label', 'description'],
    urlColumns: ['url', 'image_url'],
    minRole: 'editor',
    tag: 'site',
  },
  sponsor_methods: {
    i18nTable: 'sponsor_methods_i18n',
    i18nKey: 'method_id',
    columns: ['key', 'type', 'address_or_url', 'qr_image_url', 'network', 'icon', 'sort_order', 'is_visible'],
    i18nColumns: ['label', 'note'],
    urlColumns: ['qr_image_url'],
    minRole: 'editor',
    tag: 'site',
  },
  sponsors: {
    i18nTable: 'sponsors_i18n',
    i18nKey: 'sponsor_id',
    columns: ['display_name', 'avatar_url', 'url', 'tier', 'amount_note', 'sponsored_at', 'is_anonymous', 'is_visible', 'sort_order'],
    i18nColumns: ['message'],
    urlColumns: ['avatar_url', 'url'],
    minRole: 'editor',
    tag: 'site',
  },
  changelog_entries: {
    i18nTable: 'changelog_entries_i18n',
    i18nKey: 'entry_id',
    columns: ['version', 'released_at', 'sort_order', 'is_visible'],
    i18nColumns: ['title', 'items'],
    urlColumns: [],
    minRole: 'editor',
    tag: 'site',
  },
  redirects: {
    i18nTable: null,
    i18nKey: null,
    columns: ['from_path', 'to_path', 'status_code', 'is_active', 'reason'],
    i18nColumns: [],
    urlColumns: [],
    minRole: 'admin',
    tag: 'site',
  },
  video_meta: {
    i18nTable: 'video_meta_i18n',
    i18nKey: 'video_meta_id',
    columns: ['youtube_id', 'category', 'is_featured', 'is_hidden', 'sort_order'],
    i18nColumns: ['title_override', 'description_override'],
    urlColumns: [],
    minRole: 'editor',
    tag: 'site',
  },
  interests: {
    i18nTable: 'interests_i18n',
    i18nKey: 'interest_id',
    columns: ['icon', 'sort_order', 'is_visible'],
    i18nColumns: ['title', 'description'],
    urlColumns: [],
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
 * 回傳的是普通物件，好讓下面的網址驗證看得到欄位；寫進 Supabase 前才轉成
 * `never`——這支動作在多張表之間共用，產生的 schema 型別無法表達「欄位取決於
 * 執行期的表名」。安全性由上面的白名單保證——呼叫端送進來的任何額外欄位在
 * 這裡就被丟掉，不會抵達資料庫。
 */
function pick(values: Record<string, unknown>, allowed: readonly string[]) {
  const out: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in values) out[key] = values[key];
  }
  return out;
}

/** 空值（未填）一律放行，其餘必須是 http/https 網址。 */
function isValidUrlValue(value: unknown): boolean {
  if (value === null || value === undefined || value === '') return true;
  return typeof value === 'string' && optionalHttpUrl.safeParse(value).success;
}

/**
 * 網址欄位驗證（規格 §13.4）。
 *
 * 這些值最後都會變成前台的 `href` 或 `src`；`z.string()` 擋不住
 * `javascript:` 與 `data:`，因此逐一比對協定。哪些欄位算網址寫在
 * `resourceConfig.urlColumns`，新增資源表時跟著填就好，不必回頭改這裡。
 */
function validateUrlColumns(table: ResourceTable, row: Record<string, unknown>): boolean {
  const config = resourceConfig[table];

  for (const column of config.urlColumns) {
    if (!isValidUrlValue(row[column])) return false;
  }

  // 贊助方式的 address_or_url 兩用：type='link' 時是網址，其餘是加密貨幣位址。
  if (table === 'sponsor_methods' && row.type === 'link' && !isValidUrlValue(row.address_or_url)) {
    return false;
  }

  if (table === 'redirects') {
    if (row.from_path !== undefined && !redirectSource.safeParse(row.from_path).success) {
      return false;
    }
    if (row.to_path !== undefined && !redirectTarget.safeParse(row.to_path).success) return false;
  }

  return true;
}

export async function saveResource(input: SaveResourceInput): Promise<ActionResult> {
  const parsed = saveSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: '欄位驗證失敗' };

  const { table, id, values, i18n, label } = parsed.data;
  const config = resourceConfig[table];
  await requireRole(config.minRole);

  const supabase = await createServerSupabase();
  const picked = pick(values, config.columns);
  if (!validateUrlColumns(table, picked)) return { ok: false, error: '網址格式不正確' };

  const row = picked as never;

  const { data: saved, error } = id
    ? await supabase.from(table).update(row).eq('id', id).select('id').single()
    : await supabase.from(table).insert(row).select('id').single();

  if (error || !saved) {
    console.error('[actions] saveResource 失敗：', error);
    return { ok: false, error: '儲存失敗' };
  }

  if (config.i18nTable && config.i18nKey) {
    for (const content of i18n) {
      const { locale, ...rest } = content;
      const { error: i18nError } = await supabase.from(config.i18nTable).upsert(
        { [config.i18nKey]: saved.id, locale, ...(pick(rest, config.i18nColumns) as object) } as never,
        { onConflict: `${config.i18nKey},locale` },
      );
      if (i18nError) {
        console.error('[actions] saveResource i18n 失敗：', i18nError);
        return { ok: false, error: '儲存失敗' };
      }
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

/*
 * 表名與 id 都來自客戶端，而 `ResourceTable` 只是編譯期的型別，執行期擋不住
 * 任何東西。`Object.hasOwn` 確保表名真的在白名單裡（而不是 `toString` 之類
 * 從原型鏈拿到的東西），id 則過一次 uuid。
 */
const uuidSchema = z.string().uuid();
const orderedIdsSchema = z.array(uuidSchema).max(500);

function isResourceTable(table: string): table is ResourceTable {
  return Object.hasOwn(resourceConfig, table);
}

export async function deleteResource(table: ResourceTable, id: string): Promise<ActionResult> {
  if (!isResourceTable(table)) return { ok: false, error: '不允許操作這個資源' };
  if (!uuidSchema.safeParse(id).success) return { ok: false, error: '項目編號不正確' };

  const config = resourceConfig[table];
  await requireRole('admin');

  const supabase = await createServerSupabase();
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) {
    console.error('[actions] deleteResource 失敗：', error);
    return { ok: false, error: '刪除失敗' };
  }

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
  if (!isResourceTable(table)) return { ok: false, error: '不允許操作這個資源' };

  const parsedIds = orderedIdsSchema.safeParse(orderedIds);
  if (!parsedIds.success) return { ok: false, error: '排序資料不正確' };

  const config = resourceConfig[table];
  await requireRole(config.minRole);

  const supabase = await createServerSupabase();
  for (const [index, id] of parsedIds.data.entries()) {
    // 同上：表名在執行期才決定，產生的型別無法收斂。
    const { error } = await supabase
      .from(table)
      .update({ sort_order: index } as never)
      .eq('id', id);
    if (error) {
      console.error('[actions] reorderResource 失敗：', error);
      return { ok: false, error: '排序儲存失敗' };
    }
  }

  await writeAuditLog({ action: `${table}.reorder`, entityType: table });
  revalidateTag(config.tag);
  return { ok: true };
}

/**
 * 設定值的形狀檢查。
 *
 * 大多數設定是純文字或布林，不需要管；會被渲染成連結或 `mailto:` 的那幾個
 * 則必須擋住 `javascript:` 之類的協定——後台雖然只有站長進得去，但這些值
 * 會出現在每一位訪客的頁面上。
 */
function validateSettingValue(key: string, value: Json): boolean {
  if (key === 'contact_email') {
    return value === '' || z.string().trim().email().max(160).safeParse(value).success;
  }

  if (key === 'social_links') {
    if (!Array.isArray(value)) return false;
    return value.every((item) => {
      if (typeof item !== 'object' || item === null || Array.isArray(item)) return false;
      const url = (item as Record<string, unknown>).url;
      return url === '' || url === undefined || httpUrl.safeParse(url).success;
    });
  }

  return true;
}

/** 站台設定（規格 §8.9）。敏感金鑰只放環境變數，不進 DB。 */
export async function saveSetting(key: string, value: Json): Promise<ActionResult> {
  await requireRole('owner');

  const parsed = z.string().min(1).max(80).safeParse(key);
  if (!parsed.success) return { ok: false, error: '設定鍵不正確' };

  if (!validateSettingValue(parsed.data, value)) return { ok: false, error: '網址格式不正確' };

  const supabase = await createServerSupabase();
  const { data: before } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', parsed.data)
    .maybeSingle();

  const { error } = await supabase
    .from('site_settings')
    .upsert({ key: parsed.data, value }, { onConflict: 'key' });
  if (error) {
    console.error('[actions] saveSetting 失敗：', error);
    return { ok: false, error: '儲存失敗' };
  }

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
