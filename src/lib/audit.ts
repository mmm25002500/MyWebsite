import 'server-only';

import { getAdminSession } from '@/lib/auth/session';
import { createServiceClient } from '@/lib/supabase/service';
import type { Json } from '@/types/database';

export type AuditSeverity = 'info' | 'warning' | 'critical';

export interface AuditInput {
  action: string;
  entityType?: string;
  entityId?: string | null;
  entityLabel?: string | null;
  diff?: Json | null;
  severity?: AuditSeverity;
}

/**
 * 寫入操作紀錄（規格 §15）。
 *
 * 走 DB 的 `write_audit_log()`（security definer），因為 `audit_logs` 的 RLS
 * 沒有給任何角色 INSERT 權限——紀錄必須不可竄改，連寫入都只能經由函式。
 * 該函式只剩 service_role 執行得到（否則登入者可以自己偽造紀錄），因此
 * 行為者不能再靠 auth.uid()，改由這裡從後台 session 取出後傳進去。
 *
 * 記錄失敗不會讓主要操作跟著失敗：稽核是旁路，讓它擋下使用者的編輯並不合理。
 */
export async function writeAuditLog(input: AuditInput): Promise<void> {
  try {
    const session = await getAdminSession();
    await createServiceClient().rpc('write_audit_log', {
      p_action: input.action,
      // 產生的型別把有 default 的參數標成 optional，因此以 undefined 略過
      // 而不是傳 null。
      p_entity_type: input.entityType,
      p_entity_id: input.entityId ?? undefined,
      p_entity_label: input.entityLabel ?? undefined,
      p_diff: input.diff ?? undefined,
      p_severity: input.severity ?? 'info',
      p_actor_id: session?.user.id,
      p_actor_name: session?.displayName,
    });
  } catch (error) {
    console.error('[audit] 寫入失敗', error);
  }
}

/**
 * 只保留有變動的欄位（規格 §15.2）。
 *
 * 長文不整份存進 diff，改記字數變化；完整內容由 `content_revisions` 負責。
 */
export function buildDiff<T extends Record<string, unknown>>(
  before: T,
  after: T,
  longTextFields: (keyof T)[] = [],
): Json | null {
  const changedBefore: Record<string, Json> = {};
  const changedAfter: Record<string, Json> = {};

  for (const key of Object.keys(after) as (keyof T)[]) {
    const previous = before[key];
    const next = after[key];
    if (JSON.stringify(previous) === JSON.stringify(next)) continue;

    if (longTextFields.includes(key)) {
      changedBefore[key as string] = `${String(previous ?? '').length} 字`;
      changedAfter[key as string] = `${String(next ?? '').length} 字`;
      continue;
    }

    changedBefore[key as string] = (previous ?? null) as Json;
    changedAfter[key as string] = (next ?? null) as Json;
  }

  if (Object.keys(changedAfter).length === 0) return null;
  return { before: changedBefore, after: changedAfter };
}
