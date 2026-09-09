'use client';

import Link from 'next/link';
import { useState } from 'react';

export interface BarRow {
  label: string;
  count: number;
  href?: string | null;
}

/**
 * 分佈長條（熱門頁面、來源、裝置…）。
 *
 * 滑鼠移上去顯示完整標籤、次數與佔比：標籤在窄欄位會被截斷，
 * 佔比又是看分佈時真正想知道的數字，兩者都不該只能用眼睛估。
 */
export function BarList({
  rows,
  limit = 10,
  empty = '尚無資料',
}: {
  rows: BarRow[];
  limit?: number;
  empty?: string;
}) {
  const [active, setActive] = useState<string | null>(null);

  if (rows.length === 0) {
    return <p className="py-6 text-center text-[15px] text-ink-70">{empty}</p>;
  }

  const max = Math.max(1, ...rows.map((row) => row.count));
  const total = rows.reduce((sum, row) => sum + row.count, 0);

  return (
    <ul className="mt-3 space-y-2 text-[15px]">
      {rows.slice(0, limit).map((row) => {
        const share = total === 0 ? 0 : (row.count / total) * 100;

        return (
          <li
            key={row.label}
            className="relative -mx-2 rounded-md px-2 py-1 transition-colors hover:bg-ink-4"
            onMouseEnter={() => setActive(row.label)}
            onMouseLeave={() => setActive(null)}
          >
            <div className="flex items-baseline justify-between gap-3">
              {row.href ? (
                <Link href={row.href} target="_blank" className="truncate hover:text-accent">
                  {row.label}
                </Link>
              ) : (
                <span className="truncate">{row.label}</span>
              )}
              <span className="shrink-0 tabular-nums text-ink-70">{row.count}</span>
            </div>
            <div className="mt-1 h-1 rounded-full bg-ink-8">
              <div
                className="h-1 rounded-full bg-accent transition-[width]"
                style={{ width: `${(row.count / max) * 100}%` }}
              />
            </div>

            {active === row.label ? (
              <div className="pointer-events-none absolute -top-1 left-2 z-10 max-w-[min(320px,90%)] -translate-y-full rounded-md border border-divider bg-surface px-3 py-2 text-[14px] shadow-lg">
                <p className="break-all font-bold">{row.label}</p>
                <p className="mt-1 text-ink-70">
                  <span className="font-bold tabular-nums text-text">{row.count}</span> 次 ·{' '}
                  <span className="tabular-nums">{share.toFixed(1)}%</span>
                </p>
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
