'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { pinComment, setCommentStatus, updateCommentContent } from '@/actions/moderation';
import { banUser } from '@/actions/moderation';
import { Button } from '@/components/ui/button';
import type { AdminComment } from '@/lib/data/queries/admin';
import { cn, formatDate } from '@/lib/utils';
import { toast } from '@/lib/toast';

const statusLabels: Record<string, string> = {
  published: '已發佈',
  pending: '待審',
  hidden: '已隱藏',
  spam: '垃圾',
  deleted: '已刪除',
};

/** 留言審核（規格 §8.6）。 */
export function CommentModeration({
  comments,
  activeStatus,
  canBan,
}: {
  comments: AdminComment[];
  activeStatus?: string;
  canBan: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<{ id: string; content: string } | null>(null);

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, done?: () => void) => {
    startTransition(async () => {
      const result = await fn();
      if (!result.ok) {
        toast.error(result.error ?? '操作失敗');
        return;
      }
      toast.success('已更新');
      done?.();
      setSelected(new Set());
      router.refresh();
    });
  };

  const filters: [string | undefined, string][] = [
    [undefined, '全部'],
    ['published', '已發佈'],
    ['pending', '待審'],
    ['hidden', '已隱藏'],
    ['spam', '垃圾'],
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {filters.map(([value, text]) => (
          <Link
            key={text}
            href={value ? `/admin/comments?status=${value}` : '/admin/comments'}
            className={cn(
              'rounded-md px-2.5 py-1 text-[14px] transition-colors',
              (activeStatus ?? undefined) === value
                ? 'bg-accent font-bold text-bg'
                : 'text-text hover:bg-ink-8',
            )}
          >
            {text}
          </Link>
        ))}
      </div>

      {selected.size > 0 ? (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-divider bg-surface px-4 py-2.5">
          <span className="text-[15px] font-bold">已選 {selected.size} 則</span>
          <div className="ml-auto flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              disabled={pending}
              onClick={() => run(() => setCommentStatus([...selected], 'published'))}
            >
              核准
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={pending}
              onClick={() => run(() => setCommentStatus([...selected], 'hidden'))}
            >
              隱藏
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={pending}
              onClick={() => run(() => setCommentStatus([...selected], 'spam'))}
            >
              標記垃圾
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={pending}
              onClick={() => run(() => setCommentStatus([...selected], 'deleted'))}
            >
              刪除
            </Button>
          </div>
        </div>
      ) : null}

      {comments.length === 0 ? (
        <p className="rounded-lg border border-divider py-16 text-center text-[15px] text-ink-70">
          沒有符合條件的留言
        </p>
      ) : null}

      <ul className="space-y-2">
        {comments.map((comment) => (
          <li key={comment.id} className="rounded-lg border border-divider bg-surface p-4">
            <div className="flex flex-wrap items-baseline gap-2.5">
              <input
                type="checkbox"
                aria-label="選取"
                checked={selected.has(comment.id)}
                onChange={() =>
                  setSelected((current) => {
                    const next = new Set(current);
                    if (next.has(comment.id)) next.delete(comment.id);
                    else next.add(comment.id);
                    return next;
                  })
                }
                className="size-4 accent-[var(--color-accent)]"
              />
              <span className="font-bold">{comment.authorName}</span>
              {comment.authorBanned ? (
                <span className="text-[13px] text-accent-2-700">已封鎖</span>
              ) : null}
              <span className="text-[14px] text-ink-70">
                {formatDate(comment.createdAt, 'zh-TW')}
              </span>
              <span className="rounded-sm bg-neutral-100 px-2 py-0.5 text-[13px] text-neutral-800">
                {statusLabels[comment.status] ?? comment.status}
              </span>
              {comment.reportCount > 0 ? (
                <span className="text-[13px] text-accent-2-700">{comment.reportCount} 則檢舉</span>
              ) : null}
              {comment.postSlug ? (
                <a
                  href={`/notes/p/${comment.postSlug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="ml-auto text-[14px] text-ink-70 hover:text-accent"
                >
                  {comment.postTitle}
                </a>
              ) : null}
            </div>

            {editing?.id === comment.id ? (
              <div className="mt-3 space-y-2">
                <textarea
                  value={editing.content}
                  rows={3}
                  onChange={(event) => setEditing({ id: comment.id, content: event.target.value })}
                  className="w-full rounded-md border border-divider bg-bg px-2.5 py-2 text-[15px] text-text outline-none focus-visible:border-accent"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    disabled={pending}
                    onClick={() =>
                      run(
                        () => updateCommentContent(comment.id, editing.content),
                        () => setEditing(null),
                      )
                    }
                  >
                    儲存
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => setEditing(null)}>
                    取消
                  </Button>
                </div>
              </div>
            ) : (
              <p className="mt-2.5 whitespace-pre-wrap text-[16px] leading-relaxed">
                {comment.content}
              </p>
            )}

            <div className="mt-3 flex flex-wrap gap-3 text-[14px]">
              <button
                type="button"
                onClick={() => setEditing({ id: comment.id, content: comment.content })}
                className="cursor-pointer text-ink-70 hover:text-accent"
              >
                編輯
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => run(() => pinComment(comment.id, !comment.isPinned))}
                className="cursor-pointer text-ink-70 hover:text-accent"
              >
                {comment.isPinned ? '取消置頂' : '置頂'}
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => run(() => setCommentStatus([comment.id], 'hidden'))}
                className="cursor-pointer text-ink-70 hover:text-accent"
              >
                隱藏
              </button>
              {canBan && comment.authorId && !comment.authorBanned ? (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    run(() =>
                      banUser({ userId: comment.authorId!, reason: '留言違規', expiresAt: null }),
                    )
                  }
                  className="cursor-pointer text-ink-70 hover:text-accent-2-700"
                >
                  封鎖這位使用者
                </button>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
