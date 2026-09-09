import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { clientIp } from '@/lib/analytics/visitor';
import { checkRateLimit } from '@/lib/cache/ratelimit';
import { sendOwnerNotification } from '@/lib/email/notify';
import { hasSupabase } from '@/lib/env';
import { createPublicClient } from '@/lib/supabase/public';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(160),
  type: z.enum(['collab', 'hire', 'tech', 'other']),
  subject: z.string().trim().min(1).max(160),
  message: z.string().trim().min(10).max(4000),
  turnstileToken: z.string().max(4096).optional(),
});

/**
 * Cloudflare Turnstile 驗證（規格 §13.3）。
 *
 * 未設定 `TURNSTILE_SECRET_KEY` 時一律放行——本機開發與尚未申請 widget 的
 * 環境不會因此卡住。前端在沒有 site key 時同樣不渲染 widget，兩邊預設一致。
 * **正式環境務必設定**，否則聯絡表單只剩速率限制在擋。
 */
async function verifyTurnstile(token: string | undefined, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;

  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ secret, response: token, remoteip: ip }),
  });
  if (!response.ok) return false;

  const payload = (await response.json()) as { success?: boolean };
  return payload.success === true;
}

const typeLabels: Record<z.infer<typeof bodySchema>['type'], string> = {
  collab: '合作',
  hire: '職缺',
  tech: '技術',
  other: '其他',
};

export async function POST(request: NextRequest) {
  const ip = clientIp(request.headers);
  const { success } = await checkRateLimit('contact', ip, 3, 3600);
  if (!success) return NextResponse.json({ ok: false }, { status: 429 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });

  if (!(await verifyTurnstile(parsed.data.turnstileToken, ip))) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  if (!hasSupabase) return NextResponse.json({ ok: false }, { status: 503 });

  const { error } = await createPublicClient()
    .from('contact_messages')
    .insert({
      name: parsed.data.name,
      email: parsed.data.email,
      type: parsed.data.type,
      subject: parsed.data.subject,
      message: parsed.data.message,
      user_agent: request.headers.get('user-agent') ?? '',
    } as never);

  if (error) return NextResponse.json({ ok: false }, { status: 500 });

  /*
   * 訊息已經進資料庫，通知信只是順帶——寄不出去不該讓訪客看到送出失敗，
   * 所以吞掉錯誤只記 log（後台的「聯絡訊息」仍然看得到這筆）。
   */
  const notified = await sendOwnerNotification({
    subject: `[聯絡表單] ${parsed.data.subject}`,
    replyTo: parsed.data.email,
    lines: [
      ['姓名', parsed.data.name],
      ['Email', parsed.data.email],
      ['類型', typeLabels[parsed.data.type]],
      ['主旨', parsed.data.subject],
      ['內容', parsed.data.message],
    ],
  });
  if (!notified.sent && notified.error !== 'not configured') {
    console.error('[contact] 通知信寄送失敗：', notified.error);
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
