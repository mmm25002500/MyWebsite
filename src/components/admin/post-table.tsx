'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { bulkUpdateStatus } from '@/actions/posts';
import { Button } from '@/components/ui/button';
import type { AdminPostRow } from '@/lib/data/queries/admin';
import { cn, formatDate } from '@/lib/utils';

const statusLabels: Record<string, string> = {
  draft: '草稿',
  published: '已發佈',
  unlisted: '不列出',
  archived: '已封存',
};

const statusStyles: Record<string, string> = {
  draft: 'bg-neutral-200 text-neutral-800',
  published: 'bg-accent-100 text-accent-800',
  unlisted: 'bg-neutral-100 text-neutral-700',
  archived: 'bg-neutral-100 text-neutral-600',
};

/** 文章列表。多選後可批次改狀態（規格 §8.0）。 */
export function PostTable({ rows }: { rows: AdminPostRow[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const allSelected = rows.length > 0 && selected.size === rows.length;

  const toggle = (id: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const applyStatus = (status: 'draft' | 'published' | 'archived') => {
    setError(null);
    startTransition(async () => {
      const result = await bulkUpdateStatus([...selected], status);
      if (!result.ok) {
        setError(result.error ?? '操作失敗');
        return;
      }
      setSelected(new Set());
      router.refresh();
    });
  };

  return (
    <div>
      {selected.size > 0 ? (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-divider bg-surface px-4 py-2.5">
          <span className="text-[15px] font-bold">已選 {selected.size} 篇</span>
          <div className="ml-auto flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              disabled={pending}
              onClick={() => applyStatus('published')}
            >
              發佈
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={pending}
              onClick={() => applyStatus('draft')}
            >
              轉為草稿
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={pending}
              onClick={() => applyStatus('archived')}
            >
              封存
            </Button>
          </div>
        </div>
      ) : null}

      {error ? <p className="mb-3 text-[15px] text-accent-2-700">{error}</p> : null}

      <div className="overflow-x-auto rounded-lg border border-divider">
        <table className="w-full min-w-[840px] border-collapse text-[15px]">
          <thead>
            <tr className="border-b border-divider bg-surface text-left">
              <th className="w-10 px-3 py-2.5">
                <input
                  type="checkbox"
                  aria-label="全選"
                  checked={allSelected}
                  onChange={() =>
                    setSelected(allSelected ? new Set() : new Set(rows.map((row) => row.id)))
                  }
                  className="size-4 accent-[var(--color-accent)]"
                />
              </th>
              <th className="px-3 py-2.5 font-bold">標題</th>
              <th className="px-3 py-2.5 font-bold">狀態</th>
              <th className="px-3 py-2.5 font-bold">分類</th>
              <th className="px-3 py-2.5 font-bold">語言</th>
              <th className="px-3 py-2.5 text-right font-bold">瀏覽</th>
              <th className="px-3 py-2.5 text-right font-bold">留言</th>
              <th className="px-3 py-2.5 font-bold">更新</th>
              <th className="px-3 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-3 py-12 text-center text-ink-70">
                  沒有符合條件的文章
                </td>
              </tr>
            ) : null}

            {rows.map((row) => (
              <tr key={row.id} className="border-b border-ink-8 last:border-0 hover:bg-ink-4">
                <td className="px-3 py-2.5">
                  <input
                    type="checkbox"
                    aria-label={`選取 ${row.title}`}
                    checked={selected.has(row.id)}
                    onChange={() => toggle(row.id)}
                    className="size-4 accent-[var(--color-accent)]"
                  />
                </td>
                <td className="px-3 py-2.5">
                  <Link
                    href={`/admin/posts/${row.id}`}
                    className="font-bold text-text hover:text-accent"
                  >
                    {row.title}
                  </Link>
                  <div className="mt-0.5 flex flex-wrap gap-1.5 text-[13px] text-ink-70">
                    <span>/{row.slug}</span>
                    {row.isPinned ? <span className="text-accent-700">置頂</span> : null}
                    {row.isFeatured ? <span className="text-accent-700">精選</span> : null}
                  </div>
                </td>
                <td className="px-3 py-2.5">
                  <span
                    className={cn(
                      'inline-block rounded-sm px-2 py-0.5 text-[13px]',
                      statusStyles[row.status] ?? statusStyles.draft,
                    )}
                  >
                    {statusLabels[row.status] ?? row.status}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-ink-70">{row.categories.join('、') || '—'}</td>
                <td className="px-3 py-2.5">
                  <span className={row.locales.includes('zh-TW') ? 'text-text' : 'text-ink-45'}>
                    中
                  </span>
                  <span className="mx-1 text-ink-45">/</span>
                  <span className={row.locales.includes('en') ? 'text-text' : 'text-ink-45'}>
                    EN
                  </span>
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums text-ink-70">{row.viewCount}</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-ink-70">
                  {row.commentCount}
                </td>
                <td className="px-3 py-2.5 whitespace-nowrap text-ink-70">
                  {formatDate(row.updatedAt, 'zh-TW', { month: '2-digit', day: '2-digit' })}
                </td>
                <td className="px-3 py-2.5 whitespace-nowrap text-right">
                  <a
                    href={`/notes/p/${row.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[14px] text-ink-70 hover:text-accent"
                  >
                    前台檢視
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
