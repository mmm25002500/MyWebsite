import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { clientIp } from '@/lib/analytics/visitor';
import { checkRateLimit } from '@/lib/cache/ratelimit';
import { hasSupabase } from '@/lib/env';
import { createServerSupabase } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const paramsSchema = z.object({ postId: z.string().min(1).max(64) });

/**
 * 按讚必須登入（規格 §3.1）。
 *
 * 匿名路徑已經取消：`toggle_like` 只剩 service_role 呼叫得到，去重也改以
 * 使用者為準，換 IP 不再能重複按。速率限制因此改用 user id 當 key。
 */
async function toggle(request: NextRequest, postId: string, liked: boolean) {
  if (!hasSupabase) return NextResponse.json({ ok: true });

  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: '請先登入' }, { status: 401 });

  const { success } = await checkRateLimit('likes', user.id, 20, 60);
  if (!success) return NextResponse.json({ ok: false }, { status: 429 });

  const { error } = await createServiceClient().rpc('toggle_like', {
    p_post_id: postId,
    p_ip: clientIp(request.headers),
    p_user_agent: request.headers.get('user-agent') ?? '',
    p_user_id: user.id,
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
