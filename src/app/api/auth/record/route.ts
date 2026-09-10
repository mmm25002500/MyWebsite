import { NextResponse, type NextRequest } from 'next/server';
import { UAParser } from 'ua-parser-js';
import { z } from 'zod';

import { clientIp, isSameOrigin } from '@/lib/analytics/request';
import { visitorHash } from '@/lib/analytics/visitor';
import { checkRateLimit } from '@/lib/cache/ratelimit';
import { hasSupabase } from '@/lib/env';
import { createServerSupabase } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const bodySchema = z.object({ action: z.enum(['login', 'logout', 'password_reset']) });

/**
 * 記錄登入／登出（規格 §5.3）。
 *
 * Supabase 的 GoTrue 不對外開放登入紀錄，因此由前端在登入成功後打這一支，
 * 由伺服器端補上真正的 IP 與 User-Agent——那兩個值不能相信客戶端自己報。
 *
 * IP 一樣不明文儲存，存的是與流量統計同一套的每日輪替雜湊。
 */
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return NextResponse.json({ ok: false }, { status: 403 });
  if (!hasSupabase) return NextResponse.json({ ok: true });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });

  // 身分一律從 cookie 取，不接受客戶端指定 user id。
  const {
    data: { user },
  } = await (await createServerSupabase()).auth.getUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const { success } = await checkRateLimit('auth-record', user.id, 20, 3600);
  if (!success) return NextResponse.json({ ok: false }, { status: 429 });

  const ip = clientIp(request.headers);
  const userAgent = request.headers.get('user-agent') ?? '';
  const ua = new UAParser(userAgent).getResult();

  const service = createServiceClient();

  // 鹽由 DB 保管，這裡取當日的那一份來算雜湊。
  const { data: salt } = await service.rpc('current_analytics_salt');

  const descriptor = [
    [ua.browser.name, ua.browser.version?.split('.')[0]].filter(Boolean).join(' '),
    [ua.os.name, ua.os.version].filter(Boolean).join(' '),
    ua.device.type ?? 'desktop',
    [request.headers.get('x-vercel-ip-country'), request.headers.get('x-vercel-ip-city')]
      .filter(Boolean)
      .join(' '),
  ]
    .filter((part) => part.length > 0)
    .join(' · ');

  const { error } = await service.from('user_sessions_meta').insert({
    user_id: user.id,
    action: parsed.data.action,
    ip_hash: typeof salt === 'string' ? visitorHash(ip, userAgent, salt) : null,
    user_agent: descriptor,
  });

  if (error) {
    console.error('[auth] 登入紀錄寫入失敗：', error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  if (parsed.data.action === 'login') {
    await service
      .from('profiles')
      .update({ last_seen_at: new Date().toISOString() })
      .eq('user_id', user.id);
  }

  return NextResponse.json({ ok: true });
}
