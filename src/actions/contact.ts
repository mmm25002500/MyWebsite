'use server';

import { z } from 'zod';

import { writeAuditLog } from '@/lib/audit';
import { requireRole } from '@/lib/auth/session';
import { createServerSupabase } from '@/lib/supabase/server';

export interface ActionResult {
  ok: boolean;
  error?: string;
}

const statuses = ['new', 'read', 'replied', 'spam'] as const;
export type ContactStatus = (typeof statuses)[number];

const updateSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(statuses),
  adminNote: z
    .preprocess((v) => (v === '' ? null : v), z.string().trim().max(2000).nullable())
    .optional(),
});

/** 變更聯絡訊息的狀態與備註（規格 §8.6）。 */
export async function updateContactMessage(
  input: z.input<typeof updateSchema>,
): Promise<ActionResult> {
  await requireRole('admin');

  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: '欄位驗證失敗' };

  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from('contact_messages')
    .update({
      status: parsed.data.status,
      // 標成已回覆時順手記下時間，之後才看得出隔了多久。
      replied_at: parsed.data.status === 'replied' ? new Date().toISOString() : null,
      ...(parsed.data.adminNote !== undefined ? { admin_note: parsed.data.adminNote } : {}),
    })
    .eq('id', parsed.data.id);

  if (error) {
    console.error('[actions] updateContactMessage 失敗：', error);
    return { ok: false, error: '儲存失敗' };
  }

  await writeAuditLog({
    action: `contact.${parsed.data.status}`,
    entityType: 'contact_message',
    entityId: parsed.data.id,
  });

  return { ok: true };
}

/** 刪除聯絡訊息。只有站長可以，且不可復原。 */
export async function deleteContactMessage(id: string): Promise<ActionResult> {
  await requireRole('owner');

  const parsed = z.string().uuid().safeParse(id);
  if (!parsed.success) return { ok: false, error: 'id 不正確' };

  const supabase = await createServerSupabase();
  const { error } = await supabase.from('contact_messages').delete().eq('id', parsed.data);
  if (error) {
    console.error('[actions] deleteContactMessage 失敗：', error);
    return { ok: false, error: '刪除失敗' };
  }

  await writeAuditLog({
    action: 'contact.delete',
    entityType: 'contact_message',
    entityId: parsed.data,
    severity: 'critical',
  });

  return { ok: true };
}
