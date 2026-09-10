'use client';

import { useCallback, useEffect, useState } from 'react';

import { cn } from '@/lib/utils';

export interface FilterGroup {
  key: string;
  label: string;
  allLabel: string;
  options: { value: string; label: string }[];
}

export interface ProjectMeta {
  category: string;
  tags: string[];
  status: string;
  years: number[];
}

type Selection = Record<string, string | null>;

/** CSS 屬性選擇器的字串值，避免引號或反斜線把規則打斷。 */
function cssValue(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

/**
 * 作品集的篩選列。
 *
 * 三個刻意的設計，每一個都是踩到坑之後才這樣寫的：
 *
 * 1. **篩選在瀏覽器端做，這一頁才能被邊緣快取。** 原本條件從 `searchParams` 讀，
 *    那會讓整條路由被迫逐請求渲染，實測 `/projects` 的快取一路 MISS、TTFB 是其他
 *    列表頁的兩到十倍。伺服器端的 `getProjects` 本來就是全部撈回來再用 JS 篩選
 *    （每頁 24 筆，專案總數遠低於此），搬過來完全等價。
 *
 * 2. **卡片留在伺服器元件輸出，這裡只送出一段 CSS 規則把不符合的藏起來。** 試過
 *    兩種別的做法都不行：把渲染好的節點當 prop 傳進 client 元件，Suspense 邊界會
 *    卡在客戶端不解開；直接改 DOM 的 `hidden`，會被 React 後續的重新渲染洗掉——
 *    症狀是點按鈕有效、但帶著參數直接進入無效。`<style>` 是 React 自己管的節點，
 *    不會有這個問題，而 HTML 也一直是完整的（SEO 與首次繪製都不受影響）。
 *
 * 3. **不用 `useSearchParams()`。** 那個 hook 會讓靜態產生時最近的 Suspense 邊界
 *    直接輸出 fallback，篩選列就不會進 HTML。改成自己讀 `location.search`，並以
 *    `history.pushState` 同步網址，上一頁／下一頁照常運作。
 *
 * 年份要比對區間，而 CSS 不會比大小，因此伺服器端把專案涵蓋的每一年都展開寫進
 * `data-years`，這裡用 `~=` 比對其中一個詞。
 */
export function ProjectBrowser({
  groups,
  meta,
  gridId,
  emptyLabel,
}: {
  groups: FilterGroup[];
  meta: ProjectMeta[];
  gridId: string;
  emptyLabel: string;
}) {
  const [selection, setSelection] = useState<Selection>({});

  const readUrl = useCallback(() => {
    const params = new URLSearchParams(window.location.search);
    const next: Selection = {};
    for (const group of groups) next[group.key] = params.get(group.key);
    setSelection(next);
  }, [groups]);

  useEffect(() => {
    readUrl();
    window.addEventListener('popstate', readUrl);
    return () => window.removeEventListener('popstate', readUrl);
  }, [readUrl]);

  const choose = (key: string, value: string | null) => {
    const params = new URLSearchParams(window.location.search);
    if (value) params.set(key, value);
    else params.delete(key);
    const search = params.toString();
    window.history.pushState(null, '', `${window.location.pathname}${search ? `?${search}` : ''}`);
    setSelection((current) => ({ ...current, [key]: value }));
  };

  // 每個條件各出一條「不符合就藏起來」的規則。
  const clauses: string[] = [];
  if (selection.category) clauses.push(`:not([data-category="${cssValue(selection.category)}"])`);
  if (selection.tag) clauses.push(`:not([data-tags~="${cssValue(selection.tag)}"])`);
  if (selection.status) clauses.push(`:not([data-status="${cssValue(selection.status)}"])`);
  if (selection.year) clauses.push(`:not([data-years~="${cssValue(selection.year)}"])`);

  const css = clauses.map((clause) => `#${gridId} > ${clause}`).join(',');

  const visible = meta.filter(
    (item) =>
      (!selection.category || item.category === selection.category) &&
      (!selection.tag || item.tags.includes(selection.tag)) &&
      (!selection.status || item.status === selection.status) &&
      (!selection.year || item.years.includes(Number(selection.year))),
  ).length;

  return (
    <>
      {css ? <style>{`${css}{display:none}`}</style> : null}

      <div className="space-y-3">
        {groups
          .filter((group) => group.options.length > 0)
          .map((group) => {
            const current = selection[group.key] ?? null;
            return (
              <div key={group.key} className="flex flex-wrap items-baseline gap-2">
                <span className="w-16 shrink-0 font-heading text-kicker font-bold uppercase text-ink-55">
                  {group.label}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => choose(group.key, null)}
                    aria-pressed={current === null}
                    className={cn(
                      'cursor-pointer rounded-md px-2.5 py-1 text-[14px] transition-colors',
                      current === null ? 'bg-accent text-bg' : 'text-text hover:bg-ink-8',
                    )}
                  >
                    {group.allLabel}
                  </button>
                  {group.options.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => choose(group.key, option.value)}
                      aria-pressed={current === option.value}
                      className={cn(
                        'cursor-pointer rounded-md px-2.5 py-1 text-[14px] transition-colors',
                        current === option.value ? 'bg-accent text-bg' : 'text-text hover:bg-ink-8',
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
      </div>

      {visible === 0 ? (
        <p className="py-16 text-center text-[15px] text-ink-55">{emptyLabel}</p>
      ) : null}
    </>
  );
}
