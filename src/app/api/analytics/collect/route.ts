import { NextResponse, type NextRequest } from 'next/server';
import { UAParser } from 'ua-parser-js';
import { z } from 'zod';

import { clientIp, isBot, referrerSource } from '@/lib/analytics/visitor';
import { checkRateLimit } from '@/lib/cache/ratelimit';
import { hasSupabase, siteUrl } from '@/lib/env';
import { createPublicClient } from '@/lib/supabase/public';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  sessionId: z.string().min(8).max(64),
  path: z.string().max(512),
  pageType: z.enum(['home', 'post', 'category', 'tag', 'project', 'page', 'other']).optional(),
  entityId: z.string().uuid().optional(),
  locale: z.string().max(10).optional(),
  referrer: z.string().max(512).nullable().optional(),
  screenW: z.number().int().min(0).max(20000).optional(),
  screenH: z.number().int().min(0).max(20000).optional(),
  utm: z
    .object({
      source: z.string().max(120).optional(),
      medium: z.string().max(120).optional(),
      campaign: z.string().max(120).optional(),
    })
    .optional(),
});

/** 收 pageview（規格 §11.2）。Origin 檢查 + 速率限制。 */
export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  if (origin && new URL(origin).origin !== new URL(siteUrl).origin) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const ip = clientIp(request.headers);
  const { success } = await checkRateLimit('analytics', ip, 60, 60);
  if (!success) return NextResponse.json({ ok: false }, { status: 429 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });

  const userAgent = request.headers.get('user-agent') ?? '';
  const ua = new UAParser(userAgent).getResult();
  const bot = isBot(userAgent);

  const { source, domain } = referrerSource(
    parsed.data.referrer ?? null,
    new URL(siteUrl).hostname,
  );

  if (!hasSupabase) {
    // 沒有後端時靜默丟棄，前台仍可正常運作。
    return NextResponse.json({ ok: true });
  }

  // visitor_hash 由 DB 端的 function 以當日的鹽計算，鹽不外流到應用層。
  const { error } = await createPublicClient().rpc('record_pageview', {
    p_session_id: parsed.data.sessionId,
    p_ip: ip,
    p_user_agent: userAgent,
    p_path: parsed.data.path,
    p_page_type: parsed.data.pageType ?? 'other',
    p_entity_id: parsed.data.entityId ?? null,
    p_locale: parsed.data.locale ?? null,
    p_referrer: parsed.data.referrer ?? null,
    p_referrer_source: source,
    p_referrer_domain: domain,
    p_utm_source: parsed.data.utm?.source ?? null,
    p_utm_medium: parsed.data.utm?.medium ?? null,
    p_utm_campaign: parsed.data.utm?.campaign ?? null,
    p_device_type: bot ? 'bot' : (ua.device.type ?? 'desktop'),
    p_browser: ua.browser.name ?? null,
    p_browser_version: ua.browser.version ?? null,
    p_os: ua.os.name ?? null,
    p_os_version: ua.os.version ?? null,
    p_screen_w: parsed.data.screenW ?? null,
    p_screen_h: parsed.data.screenH ?? null,
    p_country: request.headers.get('x-vercel-ip-country'),
    p_city: request.headers.get('x-vercel-ip-city'),
  } as never);

  if (error) return NextResponse.json({ ok: false }, { status: 500 });
  return NextResponse.json({ ok: true });
}
