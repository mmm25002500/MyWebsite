'use client';

import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { hasSupabase } from '@/lib/env';
import type { Locale } from '@/lib/i18n/config';
import { Link } from '@/lib/i18n/routing';
import { createBrowserSupabase } from '@/lib/supabase/client';
import { cn, formatDate } from '@/lib/utils';

export interface CommentNode {
  id: string;
  content: string;
  createdAt: string;
  editedAt: string | null;
  status: 'published' | 'deleted';
  authorName: string;
  authorAvatarUrl: string | null;
  isPinned: boolean;
  replies: CommentNode[];
}

const MAX_LENGTH = 2000;

/**
 * 留言區（規格 §6.6）。
 * 即時查詢、不進靜態快取，因此整區是 Client Component（規格 §4.2）。
 */
export function CommentSection({
  targetType,
  targetId,
  locale,
  allowComments,
}: {
  targetType: 'post' | 'project' | 'page';
  targetId: string;
  locale: Locale;
  allowComments: boolean;
}) {
  const t = useTranslations();
  const [comments, setComments] = useState<CommentNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/comments?type=${targetType}&id=${targetId}`);
      if (!response.ok) throw new Error(String(response.status));
      const payload = (await response.json()) as { comments: CommentNode[] };
      setComments(payload.comments);
    } catch {
      setError(t('common.error'));
    } finally {
      setLoading(false);
    }
  }, [targetType, targetId, t]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!hasSupabase) return;
    const supabase = createBrowserSupabase();
    void supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const submit = async () => {
    const content = draft.trim();
    if (content.length === 0 || submitting) return;

    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ targetType, targetId, content, parentId: replyTo }),
      });
      if (!response.ok) throw new Error(String(response.status));
      setDraft('');
      setReplyTo(null);
      await load();
    } catch {
      setError(t('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  if (!allowComments) {
    return (
      <p className="mt-10 border-t border-divider pt-6 text-[15px] text-ink-55">
        {t('notes.commentsClosed')}
      </p>
    );
  }

  const renderComment = (comment: CommentNode, depth: number) => (
    <li key={comment.id} className={cn(depth > 0 && 'ml-6 border-l border-divider pl-4')}>
      <article className="py-4">
        <div className="flex items-baseline gap-2.5">
          <span className="font-heading text-[16px] font-bold">{comment.authorName}</span>
          <span className="text-[13px] text-ink-55">{formatDate(comment.createdAt, locale)}</span>
          {comment.editedAt ? (
            <span className="text-[13px] text-ink-55">{t('notes.commentEdited')}</span>
          ) : null}
        </div>
        <p className="mt-1.5 whitespace-pre-wrap text-[16px] leading-relaxed">
          {comment.status === 'deleted' ? (
            <span className="text-ink-55">{t('notes.commentDeleted')}</span>
          ) : (
            comment.content
          )}
        </p>
        {depth === 0 && comment.status !== 'deleted' ? (
          <button
            type="button"
            onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
            className="mt-2 cursor-pointer text-[13px] text-accent-700 hover:text-accent"
          >
            {t('notes.commentReply')}
          </button>
        ) : null}
      </article>
      {comment.replies.length > 0 ? (
        <ul>{comment.replies.map((reply) => renderComment(reply, depth + 1))}</ul>
      ) : null}
    </li>
  );

  return (
    <section className="mt-12 border-t border-divider pt-8">
      <h2 className="font-heading text-[23px] font-bold">
        {t('notes.commentsTitle')}
        {comments.length > 0 ? (
          <span className="ml-2 text-[17px] text-ink-55">{comments.length}</span>
        ) : null}
      </h2>

      {userId ? (
        <div className="mt-5">
          {replyTo ? (
            <p className="mb-2 text-[13px] text-ink-55">
              {t('notes.commentReply')} ·{' '}
              <button
                type="button"
                onClick={() => setReplyTo(null)}
                className="cursor-pointer text-accent-700"
              >
                {t('common.close')}
              </button>
            </p>
          ) : null}
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value.slice(0, MAX_LENGTH))}
            placeholder={t('notes.commentPlaceholder')}
            rows={4}
            className="w-full resize-y rounded-md border border-divider bg-surface px-2.5 py-2 text-[15px] text-text caret-accent outline-none focus-visible:border-accent"
          />
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[13px] text-ink-55">
              {draft.length} / {MAX_LENGTH}
            </span>
            <Button size="sm" onClick={submit} disabled={submitting || draft.trim().length === 0}>
              {t('notes.commentSubmit')}
            </Button>
          </div>
        </div>
      ) : (
        <p className="mt-5 text-[15px] text-ink-62">
          <Link href="/login" className="text-accent-700 hover:text-accent">
            {t('notes.commentLoginRequired')}
          </Link>
        </p>
      )}

      {error ? <p className="mt-3 text-[15px] text-accent-2-700">{error}</p> : null}

      {loading ? (
        <p className="py-8 text-center text-[15px] text-ink-55">{t('common.loading')}</p>
      ) : comments.length === 0 ? (
        <p className="py-8 text-center text-[15px] text-ink-55">{t('common.empty')}</p>
      ) : (
        <ul className="mt-4 divide-y divide-divider">
          {comments.map((comment) => renderComment(comment, 0))}
        </ul>
      )}
    </section>
  );
}
