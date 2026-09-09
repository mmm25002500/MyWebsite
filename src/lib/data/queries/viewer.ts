import 'server-only';

import { createServerSupabase } from '@/lib/supabase/server';

export interface ViewerComment {
  id: string;
  content: string;
  createdAt: string;
  status: string;
  targetType: string;
  postSlug: string | null;
  postTitle: string | null;
}

export interface ViewerProfile {
  userId: string;
  email: string | null;
  displayName: string;
  avatarUrl: string | null;
  notifyReply: boolean;
  joinedAt: string;
  commentCount: number;
  likeCount: number;
  comments: ViewerComment[];
}

/**
 * 前台使用者自己的資料與活動。
 *
 * 全部走登入者自己的 session：RLS 已經限制只看得到自己的留言與按讚，
 * 這裡不額外用 service role，避免在應用層重造一套權限判斷。
 */
export async function getViewerProfile(): Promise<ViewerProfile | null> {
  const supabase = await createServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, avatar_url, notify_reply, created_at')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!profile) return null;

  const [{ data: comments }, { count: likeCount }] = await Promise.all([
    supabase
      .from('comments')
      .select('id, content, created_at, status, target_type, target_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('post_likes')
      .select('post_id', { count: 'exact', head: true })
      .eq('user_id', user.id),
  ]);

  const rows = comments ?? [];

  // 留言的 target_id 指向文章，補上標題與 slug 才能連回去。
  const postIds = [...new Set(rows.filter((row) => row.target_type === 'post').map((row) => row.target_id))];

  const titles = new Map<string, { slug: string; title: string }>();
  if (postIds.length > 0) {
    const { data: posts } = await supabase
      .from('posts')
      .select('id, slug, posts_i18n(title, locale)')
      .in('id', postIds);

    for (const post of posts ?? []) {
      const title =
        post.posts_i18n.find((row) => row.locale === 'zh-TW')?.title ??
        post.posts_i18n[0]?.title ??
        post.slug;
      titles.set(post.id, { slug: post.slug, title });
    }
  }

  return {
    userId: user.id,
    email: user.email ?? null,
    displayName: profile.display_name,
    avatarUrl: profile.avatar_url,
    notifyReply: profile.notify_reply,
    joinedAt: profile.created_at,
    commentCount: rows.filter((row) => row.status !== 'deleted').length,
    likeCount: likeCount ?? 0,
    comments: rows.map((row) => ({
      id: row.id,
      content: row.content,
      createdAt: row.created_at,
      status: row.status,
      targetType: row.target_type,
      postSlug: titles.get(row.target_id)?.slug ?? null,
      postTitle: titles.get(row.target_id)?.title ?? null,
    })),
  };
}
