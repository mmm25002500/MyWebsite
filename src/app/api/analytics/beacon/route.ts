import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { clientIp } from '@/lib/analytics/visitor';
import { checkRateLimit } from '@/lib/cache/ratelimit';
import { hasSupabase, siteUrl } from '@/lib/env';
import { createPublicClient } from '@/lib/supabase/public';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  sessionId: z.string().min(8).max(64),
  path: z.string().max(512),
  durationSec: z.number().int().min(0).max(86400),
});

/** `navigator.sendBeacon` 回報停留時間（規格 §11.2）。 */
export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  if (origin && new URL(origin).origin !== new URL(siteUrl).origin) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const { success } = await checkRateLimit('analytics', clientIp(request.headers), 60, 60);
  if (!success) return NextResponse.json({ ok: false }, { status: 429 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });

  if (!hasSupabase) return NextResponse.json({ ok: true });

  const { error } = await createPublicClient().rpc('record_duration', {
    p_session_id: parsed.data.sessionId,
    p_path: parsed.data.path,
    p_duration_sec: parsed.data.durationSec,
  } as never);

  if (error) return NextResponse.json({ ok: false }, { status: 500 });
  return NextResponse.json({ ok: true });
}
