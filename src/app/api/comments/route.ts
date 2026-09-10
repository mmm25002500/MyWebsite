import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import type { CommentNode } from '@/components/site/comments/comment-section';
import { clientIp } from '@/lib/analytics/visitor';
import { checkRateLimit } from '@/lib/cache/ratelimit';
import { hasSupabase } from '@/lib/env';
import { createPublicClient } from '@/lib/supabase/public';
import { createServerSupabase } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { rows } from '@/lib/data/source';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const listSchema = z.object({
  type: z.enum(['post', 'project', 'page']),
  id: z.string().min(1).max(64),
});

const createSchema = z.object({
  targetType: z.enum(['post', 'project', 'page']),
  targetId: z.string().min(1).max(64),
  content: z.string().trim().min(1).max(2000),
  parentId: z.string().min(1).max(64).nullable().optional(),
});

interface CommentRow {
  id: string;
  parent_id: string | null;
  content: string;
  created_at: string;
  edited_at: string | null;
  status: 'published' | 'deleted';
  is_pinned: boolean;
  user_id: string | null;
  profiles: { display_name: string; avatar_url: string | null } | null;
}

/** 讀取留言。巢狀回覆限兩層（規格 §6.6），因此在此攤平成 parent → replies。 */
export async function GET(request: NextRequest) {
  const parsed = listSchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) return NextResponse.json({ comments: [] }, { status: 400 });

  const { success } = await checkRateLimit('comments-read', clientIp(request.headers), 60, 60);
  if (!success) return NextResponse.json({ comments: [] }, { status: 429 });

  if (!hasSupabase) return NextResponse.json({ comments: [] });

  const { data, error } = await createPublicClient()
    .from('comments')
    // comments 到 profiles 有兩條關聯路徑（user_id 的外鍵，以及經由 comment_likes
    // 的多對多），不指定的話 PostgREST 會回 PGRST201 拒絕查詢。
    .select(
      'id, parent_id, content, created_at, edited_at, status, is_pinned, user_id, profiles!comments_user_id_fkey(display_name, avatar_url)',
    )
    .eq('target_type', parsed.data.type)
    .eq('target_id', parsed.data.id)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ comments: [] }, { status: 500 });

  const all = rows<CommentRow>(data);
  const toNode = (row: CommentRow): CommentNode => ({
    id: row.id,
    content: row.status === 'deleted' ? '' : row.content,
    createdAt: row.created_at,
    editedAt: row.edited_at,
    status: row.status,
    authorName: row.profiles?.display_name ?? '',
    authorAvatarUrl: row.profiles?.avatar_url ?? null,
    isPinned: row.is_pinned,
    replies: [],
  });

  const nodes = new Map(all.map((row) => [row.id, toNode(row)]));
  const roots: CommentNode[] = [];

  for (const row of all) {
    const node = nodes.get(row.id);
    if (!node) continue;
    const parent = row.parent_id ? nodes.get(row.parent_id) : undefined;
    if (parent) parent.replies.push(node);
    else roots.push(node);
  }

  return NextResponse.json({ comments: roots });
}

/** 發表留言。必須登入，速率限制為每人 60 秒 3 則（規格 §13.5）。 */
export async function POST(request: NextRequest) {
  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });

  if (!hasSupabase) return NextResponse.json({ ok: false }, { status: 503 });

  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const perMinute = await checkRateLimit('comment-minute', user.id, 3, 60);
  const perDay = await checkRateLimit('comment-day', user.id, 50, 86400);
  if (!perMinute.success || !perDay.success) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }

  // 內容淨化與 IP 雜湊都在 DB function 內完成，應用層不接觸明文 IP 以外的東西。
  // 目標是否存在、是否開放留言、父留言是否合法，一律由 create_comment 檢查；
  // 它只剩 service_role 呼叫得到，登入者身分由這裡驗過後傳進去。
  const { error } = await createServiceClient().rpc('create_comment', {
    p_target_type: parsed.data.targetType,
    p_target_id: parsed.data.targetId,
    p_parent_id: parsed.data.parentId ?? undefined,
    p_content: parsed.data.content,
    p_ip: clientIp(request.headers),
    p_user_agent: request.headers.get('user-agent') ?? '',
    p_user_id: user.id,
  });

  if (error) {
    // Postgres 的原始訊息不回給前端，只留下對使用者有意義的那一句。
    if (error.code === '42501') {
      return NextResponse.json({ ok: false, error: '此帳號目前無法留言' }, { status: 403 });
    }
    if (error.code === '23514') {
      return NextResponse.json({ ok: false, error: '無法對這篇內容留言' }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: '留言失敗，請稍後再試' }, { status: 400 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
