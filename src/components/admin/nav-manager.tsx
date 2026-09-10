'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { saveNavItems } from '@/actions/pages';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface NavRow {
  key: string;
  label: string;
  href: string;
  isVisible: boolean;
}

/** 導覽列的顯示與順序（規格 §8.5）。項目本身固定，這裡只決定顯示哪些、什麼順序。 */
export function NavManager({ items }: { items: NavRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [rows, setRows] = useState(items);
  const [message, setMessage] = useState<string | null>(null);

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= rows.length) return;
    const next = [...rows];
    const [moved] = next.splice(index, 1);
    if (moved) next.splice(target, 0, moved);
    setRows(next);
  };

  const toggle = (key: string) =>
    setRows((current) =>
      current.map((row) => (row.key === key ? { ...row, isVisible: !row.isVisible } : row)),
    );

  const submit = () => {
    setMessage(null);
    startTransition(async () => {
      const result = await saveNavItems(
        rows.map((row) => ({ key: row.key, isVisible: row.isVisible })),
      );
      setMessage(result.ok ? '已儲存' : (result.error ?? '儲存失敗'));
      if (result.ok) router.refresh();
    });
  };

  return (
    <div className="space-y-3">
      <p className="text-[14px] text-ink-70">
        取消勾選只會從導覽列拿掉，頁面本身仍然可以直接以網址開啟。
      </p>

      <ul className="space-y-2">
        {rows.map((row, index) => (
          <li
            key={row.key}
            className="flex items-center gap-3 rounded-lg border border-divider bg-surface p-3.5"
          >
            <span className="w-8 shrink-0 tabular-nums text-ink-70">{index + 1}</span>
            <span className={cn('font-bold', !row.isVisible && 'text-ink-45')}>{row.label}</span>
            <span className="text-[14px] text-ink-55">{row.href}</span>

            <div className="ml-auto flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => move(index, -1)}
                disabled={index === 0}
                aria-label="往前移"
                className="rounded-md px-2 py-1 text-ink-70 hover:bg-ink-8 disabled:opacity-30"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => move(index, 1)}
                disabled={index === rows.length - 1}
                aria-label="往後移"
                className="rounded-md px-2 py-1 text-ink-70 hover:bg-ink-8 disabled:opacity-30"
              >
                ↓
              </button>
              <label className="ml-2 flex items-center gap-1.5 text-[14px] text-ink-70">
                <input
                  type="checkbox"
                  checked={row.isVisible}
                  onChange={() => toggle(row.key)}
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
          {pending ? '儲存中…' : '儲存導覽列'}
        </Button>
        {message ? <p className="text-[15px] text-accent-700">{message}</p> : null}
      </div>
    </div>
  );
}
