import 'server-only';

import type { UserIdentity } from '@supabase/supabase-js';

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

export interface ViewerFactor {
  id: string;
  friendlyName?: string;
  status: string;
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
  /** 已綁定的登入方式（`email` 代表有密碼）。供帳號設定頁的元件直接使用。 */
  identities: UserIdentity[];
  /** 已綁定的兩步驟驗證裝置。 */
  factors: ViewerFactor[];
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

  /*
   * 三個查詢一起發，不要接力。
   *
   * 函式跑在東京、資料庫也在東京，但每一趟往返仍有固定成本；原本是先等 profile
   * 回來才發後面兩個，等於白白多一趟。三者互不依賴，profile 不存在時再放棄即可。
   */
  const [{ data: profile }, { data: comments }, { count: likeCount }, { data: mfa }] =
    await Promise.all([
      supabase
        .from('profiles')
        .select('display_name, avatar_url, notify_reply, created_at')
        .eq('user_id', user.id)
        .maybeSingle(),
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
      /*
       * 兩步驟驗證的裝置清單也在這裡一起拿。
       *
       * 帳號設定頁上的四個元件原本各自在瀏覽器端再問一次 Supabase（使用者、身分
       * 清單、MFA 裝置），那是四到五趟往返，畫面會一塊一塊冒出來。伺服器這邊本來
       * 就握著 session，一次拿齊再以 props 傳下去。
       */
      supabase.auth.mfa.listFactors(),
    ]);

  if (!profile) return null;

  const rows = comments ?? [];

  // 留言的 target_id 指向文章，補上標題與 slug 才能連回去。
  const postIds = [
    ...new Set(rows.filter((row) => row.target_type === 'post').map((row) => row.target_id)),
  ];

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
    // `identities` 已經跟著 getUser 一起回來了，不必再問一次。
    identities: user.identities ?? [],
    factors: (mfa?.totp ?? []).map((factor) => ({
      id: factor.id,
      friendlyName: factor.friendly_name ?? undefined,
      status: factor.status,
    })),
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
