'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import {
  deleteCategory,
  deleteSeries,
  deleteTag,
  mergeTags,
  pruneUnusedTags,
  saveCategory,
  saveSeries,
  saveTag,
} from '@/actions/taxonomy';
import { TaxonomyManager, type TaxonomyDraft } from '@/components/admin/taxonomy-manager';
import { Button } from '@/components/ui/button';
import type { AdminSeriesRow, AdminTaxonomyRow } from '@/lib/data/queries/admin';
import { toast, toastResult } from '@/lib/toast';

const toContents = (draft: TaxonomyDraft) =>
  draft.contents
    .filter((row) => row.name.trim())
    .map((row) => ({
      locale: row.locale,
      name: row.name,
      description: row.description || null,
    }));

export function CategoriesManager({ rows }: { rows: AdminTaxonomyRow[] }) {
  return (
    <TaxonomyManager
      rows={rows}
      variant="category"
      countLabel="文章數"
      onSave={(draft) =>
        saveCategory({
          id: draft.id,
          slug: draft.slug,
          icon: draft.icon || null,
          isVisible: draft.isVisible,
          sortOrder: draft.sortOrder,
          contents: toContents(draft),
        })
      }
      onDelete={deleteCategory}
    />
  );
}

export function TagsManager({ rows }: { rows: AdminTaxonomyRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [merge, setMerge] = useState<{ source: string; target: string }>({
    source: '',
    target: '',
  });

  const runMerge = () => {
    if (!merge.source || !merge.target) return;
    startTransition(async () => {
      const result = await mergeTags(merge.source, merge.target);
      toastResult(result, '已儲存');
      if (result.ok) {
        setMerge({ source: '', target: '' });
        router.refresh();
      }
    });
  };

  const runPrune = () => {
    startTransition(async () => {
      const result = await pruneUnusedTags();
      if (result.ok) toast.success(`清除了 ${result.removed ?? 0} 個未使用標籤`);
      else toast.error(result.error ?? '清除失敗');
      if (result.ok) router.refresh();
    });
  };

  const select =
    'min-h-9 rounded-md border border-divider bg-bg px-2 py-1 text-[14px] text-text outline-none';

  return (
    <TaxonomyManager
      rows={rows}
      variant="tag"
      countLabel="文章 / 作品"
      onSave={(draft) =>
        saveTag({
          id: draft.id,
          slug: draft.slug,
          contents: draft.contents
            .filter((row) => row.name.trim())
            .map((row) => ({ locale: row.locale, name: row.name })),
        })
      }
      onDelete={deleteTag}
      extraActions={
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[14px] text-ink-70">合併</span>
          <select
            aria-label="來源標籤"
            value={merge.source}
            onChange={(event) => setMerge((v) => ({ ...v, source: event.target.value }))}
            className={select}
          >
            <option value="">來源</option>
            {rows.map((row) => (
              <option key={row.id} value={row.id}>
                {row.names['zh-TW'] ?? row.slug}
              </option>
            ))}
          </select>
          <span className="text-[14px] text-ink-70">併入</span>
          <select
            aria-label="目標標籤"
            value={merge.target}
            onChange={(event) => setMerge((v) => ({ ...v, target: event.target.value }))}
            className={select}
          >
            <option value="">目標</option>
            {rows.map((row) => (
              <option key={row.id} value={row.id}>
                {row.names['zh-TW'] ?? row.slug}
              </option>
            ))}
          </select>
          <Button size="sm" variant="secondary" onClick={runMerge} disabled={pending}>
            合併
          </Button>
          <Button size="sm" variant="secondary" onClick={runPrune} disabled={pending}>
            清除未使用
          </Button>
        </div>
      }
    />
  );
}

export function SeriesManager({ rows }: { rows: AdminSeriesRow[] }) {
  return (
    <div className="space-y-6">
      <TaxonomyManager
        rows={rows}
        variant="series"
        countLabel="文章數"
        onSave={(draft) =>
          saveSeries({
            id: draft.id,
            slug: draft.slug,
            isVisible: draft.isVisible,
            sortOrder: draft.sortOrder,
            contents: draft.contents
              .filter((row) => row.name.trim())
              .map((row) => ({
                locale: row.locale,
                title: row.name,
                description: row.description || null,
              })),
          })
        }
        onDelete={deleteSeries}
      />

      {rows
        .filter((row) => row.posts.length > 0)
        .map((row) => (
          <section key={row.id} className="rounded-lg border border-divider bg-surface p-4">
            <h2 className="text-[16px] font-bold">{row.names['zh-TW'] ?? row.slug} 的文章順序</h2>
            <ol className="mt-3 space-y-1.5 text-[15px]">
              {row.posts.map((post) => (
                <li key={post.id} className="flex items-baseline gap-3">
                  <span className="w-8 shrink-0 tabular-nums text-ink-70">{post.order ?? '—'}</span>
                  <span>{post.title}</span>
                </li>
              ))}
            </ol>
            <p className="mt-2.5 text-[13px] text-ink-70">順序在文章的「設定」分頁調整。</p>
          </section>
        ))}
    </div>
  );
}
