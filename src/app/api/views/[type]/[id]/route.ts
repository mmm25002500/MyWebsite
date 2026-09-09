import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { clientIp } from '@/lib/analytics/visitor';
import { checkRateLimit } from '@/lib/cache/ratelimit';
import { hasSupabase } from '@/lib/env';
import { createPublicClient } from '@/lib/supabase/public';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const paramsSchema = z.object({
  type: z.enum(['post', 'project']),
  id: z.string().min(1).max(64),
});

/** 累加瀏覽數。同訪客 24 小時內只計一次，去重在 DB function 內完成。 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> },
) {
  const parsed = paramsSchema.safeParse(await params);
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });

  const { success } = await checkRateLimit('views', clientIp(request.headers), 60, 60);
  if (!success) return NextResponse.json({ ok: false }, { status: 429 });

  if (!hasSupabase) return NextResponse.json({ ok: true });

  const { error } = await createPublicClient().rpc('increment_view', {
    p_type: parsed.data.type,
    p_id: parsed.data.id,
    p_ip: clientIp(request.headers),
    p_user_agent: request.headers.get('user-agent') ?? '',
  } as never);

  if (error) return NextResponse.json({ ok: false }, { status: 500 });
  return NextResponse.json({ ok: true });
}
