import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { clientIp } from '@/lib/analytics/visitor';
import { checkRateLimit } from '@/lib/cache/ratelimit';
import { hasSupabase } from '@/lib/env';
import { createServerSupabase } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const paramsSchema = z.object({ postId: z.string().min(1).max(64) });

async function toggle(request: NextRequest, postId: string, liked: boolean) {
  const { success } = await checkRateLimit('likes', clientIp(request.headers), 20, 60);
  if (!success) return NextResponse.json({ ok: false }, { status: 429 });

  if (!hasSupabase) return NextResponse.json({ ok: true });

  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.rpc('toggle_like', {
    p_post_id: postId,
    p_ip: clientIp(request.headers),
    p_user_agent: request.headers.get('user-agent') ?? '',
    p_user_id: user?.id ?? null,
    p_liked: liked,
  } as never);

  if (error) return NextResponse.json({ ok: false }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> },
) {
  const parsed = paramsSchema.safeParse(await params);
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });
  return toggle(request, parsed.data.postId, true);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> },
) {
  const parsed = paramsSchema.safeParse(await params);
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });
  return toggle(request, parsed.data.postId, false);
}
