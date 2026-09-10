'use server';

import { revalidateTag } from 'next/cache';
import { z } from 'zod';

import { writeAuditLog } from '@/lib/audit';
import { requireRole } from '@/lib/auth/session';
import { cacheTags } from '@/lib/data/cache';
import { createServerSupabase } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import type { Json } from '@/types/database';

export interface ActionResult {
  ok: boolean;
  error?: string;
}

type CommentStatus = 'published' | 'pending' | 'hidden' | 'spam' | 'deleted';

/** 變更留言狀態（核准／隱藏／標記垃圾／刪除，規格 §8.6）。 */
export async function setCommentStatus(
  commentIds: string[],
  status: CommentStatus,
): Promise<ActionResult> {
  await requireRole('editor');
  if (commentIds.length === 0) return { ok: true };

  const supabase = await createServerSupabase();
  const { error } = await supabase.from('comments').update({ status }).in('id', commentIds);
  if (error) return { ok: false, error: error.message };

  await writeAuditLog({
    action: `comment.${status}`,
    entityType: 'comment',
    entityLabel: `${commentIds.length} 則`,
    severity: status === 'deleted' ? 'critical' : 'warning',
  });

  revalidateTag(cacheTags.posts);
  return { ok: true };
}

export async function updateCommentContent(
  commentId: string,
  content: string,
): Promise<ActionResult> {
  await requireRole('editor');

  const parsed = z.string().trim().min(1).max(2000).safeParse(content);
  if (!parsed.success) return { ok: false, error: '內容長度需在 1 到 2000 字之間' };

  const supabase = await createServerSupabase();

  // 站長改動別人的留言時記下前後內容，避免事後說不清楚。
  const { data: before } = await supabase
    .from('comments')
    .select('content')
    .eq('id', commentId)
    .maybeSingle();

  const { error } = await supabase
    .from('comments')
    .update({ content: parsed.data, edited_at: new Date().toISOString() })
    .eq('id', commentId);
  if (error) return { ok: false, error: error.message };

  await writeAuditLog({
    action: 'comment.edit',
    entityType: 'comment',
    entityId: commentId,
    diff: { before: before?.content ?? null, after: parsed.data } as Json,
    severity: 'warning',
  });

  revalidateTag(cacheTags.posts);
  return { ok: true };
}

export async function pinComment(commentId: string, pinned: boolean): Promise<ActionResult> {
  await requireRole('editor');

  const supabase = await createServerSupabase();
  const { error } = await supabase.from('comments').update({ is_pinned: pinned }).eq('id', commentId);
  if (error) return { ok: false, error: error.message };

  await writeAuditLog({ action: 'comment.pin', entityType: 'comment', entityId: commentId });
  return { ok: true };
}

// ---------------------------------------------------------------------------
// 使用者（規格 §8.7）
// ---------------------------------------------------------------------------

const roleSchema = z.enum(['user', 'editor', 'admin', 'owner']);

/**
 * 變更角色。
 *
 * 僅站長可操作，且**不得動到任何 owner 帳號**（規格 §5.3：owner 不可被降級
 * 或刪除）。這裡擋在應用層，RLS 則擋住非 owner 的一切角色寫入。
 */
export async function setUserRole(
  userId: string,
  role: z.infer<typeof roleSchema>,
): Promise<ActionResult> {
  const session = await requireRole('owner');

  const parsed = roleSchema.safeParse(role);
  if (!parsed.success) return { ok: false, error: '角色不正確' };

  // profiles 的 role／封鎖欄位已經收回 authenticated 的讀寫權（欄位級授權），
  // 後台這幾條路徑改走 service client；授權在上面的 requireRole 就做完了。
  const supabase = createServiceClient();
  const { data: target } = await supabase
    .from('profiles')
    .select('role, display_name')
    .eq('user_id', userId)
    .maybeSingle();

  if (!target) return { ok: false, error: '找不到使用者' };
  if (target.role === 'owner') return { ok: false, error: '站長帳號不可變更角色' };
  if (userId === session.user.id) return { ok: false, error: '不能變更自己的角色' };

  const { error } = await supabase.from('profiles').update({ role: parsed.data }).eq('user_id', userId);
  if (error) return { ok: false, error: error.message };

  await writeAuditLog({
    action: 'user.role_change',
    entityType: 'user',
    entityId: userId,
    entityLabel: target.display_name,
    diff: { before: target.role, after: parsed.data } as Json,
    severity: 'critical',
  });

  return { ok: true };
}

const banSchema = z.object({
  userId: z.string().uuid(),
  reason: z.string().trim().max(300),
  /** null 代表永久封鎖。 */
  expiresAt: z.string().nullable(),
});

export async function banUser(input: z.infer<typeof banSchema>): Promise<ActionResult> {
  const session = await requireRole('admin');

  const parsed = banSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: '欄位驗證失敗' };

  const supabase = createServiceClient();
  const { data: target } = await supabase
    .from('profiles')
    .select('role, display_name')
    .eq('user_id', parsed.data.userId)
    .maybeSingle();

  if (!target) return { ok: false, error: '找不到使用者' };
  if (target.role === 'owner') return { ok: false, error: '站長帳號不可被封鎖' };

  const { error } = await supabase
    .from('profiles')
    .update({
      is_banned: true,
      banned_until: parsed.data.expiresAt,
      ban_reason: parsed.data.reason || null,
    })
    .eq('user_id', parsed.data.userId);

  if (error) return { ok: false, error: error.message };

  await supabase.from('user_bans').insert({
    user_id: parsed.data.userId,
    banned_by: session.user.id,
    reason: parsed.data.reason || null,
    expires_at: parsed.data.expiresAt,
    is_active: true,
  });

  await writeAuditLog({
    action: 'user.ban',
    entityType: 'user',
    entityId: parsed.data.userId,
    entityLabel: target.display_name,
    diff: { reason: parsed.data.reason, expiresAt: parsed.data.expiresAt } as Json,
    severity: 'critical',
  });

  return { ok: true };
}

export async function unbanUser(userId: string): Promise<ActionResult> {
  await requireRole('admin');

  const supabase = createServiceClient();
  const { error } = await supabase
    .from('profiles')
    .update({ is_banned: false, banned_until: null, ban_reason: null })
    .eq('user_id', userId);

  if (error) return { ok: false, error: error.message };

  await supabase.from('user_bans').update({ is_active: false }).eq('user_id', userId);

  await writeAuditLog({
    action: 'user.unban',
    entityType: 'user',
    entityId: userId,
    severity: 'warning',
  });

  return { ok: true };
}

/** 修改不當暱稱（規格 §8.7）。頭像不可編輯，它來自 OAuth。 */
export async function updateDisplayName(userId: string, displayName: string): Promise<ActionResult> {
  await requireRole('admin');

  const parsed = z.string().trim().min(1).max(40).safeParse(displayName);
  if (!parsed.success) return { ok: false, error: '暱稱長度需在 1 到 40 字之間' };

  const supabase = createServiceClient();
  const { data: before } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('user_id', userId)
    .maybeSingle();

  const { error } = await supabase
    .from('profiles')
    .update({ display_name: parsed.data })
    .eq('user_id', userId);
  if (error) return { ok: false, error: error.message };

  await writeAuditLog({
    action: 'user.rename',
    entityType: 'user',
    entityId: userId,
    diff: { before: before?.display_name ?? null, after: parsed.data } as Json,
    severity: 'warning',
  });

  return { ok: true };
}
