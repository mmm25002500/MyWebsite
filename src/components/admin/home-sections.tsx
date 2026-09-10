'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { saveHomeSections } from '@/actions/pages';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toastResult } from '@/lib/toast';

export interface HomeSectionRow {
  id: string;
  sectionKey: string;
  isVisible: boolean;
  sortOrder: number;
}

const labels: Record<string, string> = {
  hero: 'Hero',
  stats: '數據列',
  featured_projects: '精選專案',
  latest_posts: '最新筆記',
  skills: '核心技能',
  organizations: '我的團隊',
  videos: '精選影片',
  contact: '聯絡',
};

/** 首頁區塊的顯示與順序（規格 §8.5）。 */
export function HomeSections({ sections }: { sections: HomeSectionRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [rows, setRows] = useState(() => [...sections].sort((a, b) => a.sortOrder - b.sortOrder));

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= rows.length) return;
    const next = [...rows];
    const [moved] = next.splice(index, 1);
    if (moved) next.splice(target, 0, moved);
    setRows(next);
  };

  const toggle = (id: string) =>
    setRows((current) =>
      current.map((row) => (row.id === id ? { ...row, isVisible: !row.isVisible } : row)),
    );

  const submit = () => {
    startTransition(async () => {
      const result = await saveHomeSections(
        rows.map((row, index) => ({ id: row.id, isVisible: row.isVisible, sortOrder: index })),
      );
      toastResult(result, '首頁區塊已更新');
      if (result.ok) router.refresh();
    });
  };

  return (
    <div className="space-y-3">
      <ul className="space-y-2">
        {rows.map((row, index) => (
          <li
            key={row.id}
            className="flex items-center gap-3 rounded-lg border border-divider bg-surface p-3.5"
          >
            <span className="w-8 shrink-0 tabular-nums text-ink-70">{index + 1}</span>
            <span className={cn('font-bold', !row.isVisible && 'text-ink-45')}>
              {labels[row.sectionKey] ?? row.sectionKey}
            </span>

            <div className="ml-auto flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => move(index, -1)}
                disabled={index === 0}
                aria-label="往上移"
                className="rounded-md px-2 py-1 text-ink-70 hover:bg-ink-8 disabled:opacity-30"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => move(index, 1)}
                disabled={index === rows.length - 1}
                aria-label="往下移"
                className="rounded-md px-2 py-1 text-ink-70 hover:bg-ink-8 disabled:opacity-30"
              >
                ↓
              </button>
              <label className="ml-2 flex items-center gap-1.5 text-[14px] text-ink-70">
                <input
                  type="checkbox"
                  checked={row.isVisible}
                  onChange={() => toggle(row.id)}
                  className="accent-accent"
                />
                顯示
              </label>
            </div>
          </li>
        ))}
      </ul>

      <div className="flex items-center gap-3">
        <Button type="button" onClick={submit} disabled={pending}>
          {pending ? '儲存中…' : '儲存區塊設定'}
        </Button>
      </div>
    </div>
  );
}
