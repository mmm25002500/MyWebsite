'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import type { AdminTaxonomyRow } from '@/lib/data/queries/admin';
import { locales, type Locale } from '@/lib/i18n/config';
import { cn, slugify } from '@/lib/utils';

export interface TaxonomyDraft {
  id: string | null;
  slug: string;
  icon: string;
  isVisible: boolean;
  sortOrder: number;
  contents: { locale: Locale; name: string; description: string }[];
}

interface Props {
  rows: AdminTaxonomyRow[];
  /** 是否顯示圖示、顯示開關與排序——標籤沒有這些欄位。 */
  variant: 'category' | 'tag' | 'series';
  countLabel: string;
  onSave: (draft: TaxonomyDraft) => Promise<{ ok: boolean; error?: string }>;
  onDelete: (id: string) => Promise<{ ok: boolean; error?: string }>;
  extraActions?: React.ReactNode;
}

const field =
  'w-full min-h-9 rounded-md border border-divider bg-bg px-2.5 py-1.5 text-[15px] text-text outline-none transition-colors focus-visible:border-accent';

function emptyDraft(sortOrder: number): TaxonomyDraft {
  return {
    id: null,
    slug: '',
    icon: '',
    isVisible: true,
    sortOrder,
    contents: locales.map((locale) => ({ locale, name: '', description: '' })),
  };
}

/**
 * 分類／標籤／系列共用的管理介面（規格 §8.3）。
 *
 * 三者的欄位差異只有圖示、顯示開關與排序，因此用同一個元件加 variant，
 * 而不是複製三份幾乎一樣的表格。
 */
export function TaxonomyManager({
  rows,
  variant,
  countLabel,
  onSave,
  onDelete,
  extraActions,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [draft, setDraft] = useState<TaxonomyDraft | null>(null);
  const [error, setError] = useState<string | null>(null);

  const showMeta = variant !== 'tag';

  const startEdit = (row: AdminTaxonomyRow) => {
    setError(null);
    setDraft({
      id: row.id,
      slug: row.slug,
      icon: row.icon ?? '',
      isVisible: row.isVisible,
      sortOrder: row.sortOrder,
      contents: locales.map((locale) => ({
        locale,
        name: row.names[locale] ?? '',
        description: row.descriptions[locale] ?? '',
      })),
    });
  };

  const save = () => {
    if (!draft) return;
    setError(null);
    startTransition(async () => {
      const result = await onSave(draft);
      if (!result.ok) {
        setError(result.error ?? '儲存失敗');
        return;
      }
      setDraft(null);
      router.refresh();
    });
  };

  const remove = (id: string) => {
    setError(null);
    startTransition(async () => {
      const result = await onDelete(id);
      if (!result.ok) {
        setError(result.error ?? '刪除失敗');
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={() => setDraft(emptyDraft(rows.length))}>
          新增
        </Button>
        {extraActions}
        {error ? <span className="text-[14px] text-accent-2-700">{error}</span> : null}
      </div>

      {draft ? (
        <div className="space-y-4 rounded-lg border border-accent bg-surface p-4">
          <div className="grid gap-4 md:grid-cols-2">
            {draft.contents.map((content, index) => (
              <div key={content.locale} className="space-y-3">
                <p className="text-[14px] font-bold text-ink-70">
                  {content.locale === 'zh-TW' ? '中文' : 'English'}
                </p>
                <input
                  value={content.name}
                  placeholder="名稱"
                  onChange={(event) => {
                    const value = event.target.value;
                    setDraft((current) =>
                      current
                        ? {
                            ...current,
                            slug:
                              !current.id && content.locale === 'zh-TW' && !current.slug
                                ? slugify(value)
                                : current.slug,
                            contents: current.contents.map((row, i) =>
                              i === index ? { ...row, name: value } : row,
                            ),
                          }
                        : current,
                    );
                  }}
                  className={field}
                />
                {variant !== 'tag' ? (
                  <textarea
                    value={content.description}
                    placeholder="說明"
                    rows={2}
                    onChange={(event) => {
                      const value = event.target.value;
                      setDraft((current) =>
                        current
                          ? {
                              ...current,
                              contents: current.contents.map((row, i) =>
                                i === index ? { ...row, description: value } : row,
                              ),
                            }
                          : current,
                      );
                    }}
                    className={`${field} resize-y`}
                  />
                ) : null}
              </div>
            ))}
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <div>
              <label className="mb-1.5 block text-[14px] font-bold text-ink-70" htmlFor="tax-slug">
                slug
              </label>
              <input
                id="tax-slug"
                value={draft.slug}
                onChange={(event) =>
                  setDraft((current) =>
                    current ? { ...current, slug: event.target.value } : current,
                  )
                }
                className={field}
              />
            </div>

            {showMeta ? (
              <>
                {variant === 'category' ? (
                  <div>
                    <label
                      className="mb-1.5 block text-[14px] font-bold text-ink-70"
                      htmlFor="tax-icon"
                    >
                      圖示
                    </label>
                    <input
                      id="tax-icon"
                      value={draft.icon}
                      onChange={(event) =>
                        setDraft((current) =>
                          current ? { ...current, icon: event.target.value } : current,
                        )
                      }
                      className={field}
                    />
                  </div>
                ) : null}

                <div>
                  <label
                    className="mb-1.5 block text-[14px] font-bold text-ink-70"
                    htmlFor="tax-order"
                  >
                    排序
                  </label>
                  <input
                    id="tax-order"
                    type="number"
                    value={draft.sortOrder}
                    onChange={(event) =>
                      setDraft((current) =>
                        current ? { ...current, sortOrder: Number(event.target.value) } : current,
                      )
                    }
                    className={field}
                  />
                </div>

                <label className="flex items-end gap-2.5 pb-2 text-[15px]">
                  <input
                    type="checkbox"
                    checked={draft.isVisible}
                    onChange={(event) =>
                      setDraft((current) =>
                        current ? { ...current, isVisible: event.target.checked } : current,
                      )
                    }
                    className="size-4 accent-[var(--color-accent)]"
                  />
                  在前台顯示
                </label>
              </>
            ) : null}
          </div>

          <div className="flex gap-2">
            <Button size="sm" onClick={save} disabled={pending}>
              儲存
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setDraft(null)}>
              取消
            </Button>
          </div>
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-lg border border-divider">
        <table className="w-full min-w-[640px] border-collapse text-[15px]">
          <thead>
            <tr className="border-b border-divider bg-surface text-left">
              <th className="px-3 py-2.5 font-bold">名稱</th>
              <th className="px-3 py-2.5 font-bold">slug</th>
              {showMeta ? <th className="px-3 py-2.5 font-bold">顯示</th> : null}
              <th className="px-3 py-2.5 text-right font-bold">{countLabel}</th>
              <th className="px-3 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-10 text-center text-ink-70">
                  尚無資料
                </td>
              </tr>
            ) : null}

            {rows.map((row) => (
              <tr key={row.id} className="border-b border-ink-8 last:border-0 hover:bg-ink-4">
                <td className="px-3 py-2.5">
                  <span className="font-bold">{row.names['zh-TW'] ?? row.slug}</span>
                  {row.names.en ? (
                    <span className="ml-2 text-[14px] text-ink-70">{row.names.en}</span>
                  ) : (
                    <span className="ml-2 text-[14px] text-ink-45">缺英文</span>
                  )}
                </td>
                <td className="px-3 py-2.5 text-ink-70">{row.slug}</td>
                {showMeta ? (
                  <td className="px-3 py-2.5">
                    <span className={cn(row.isVisible ? 'text-text' : 'text-ink-45')}>
                      {row.isVisible ? '是' : '否'}
                    </span>
                  </td>
                ) : null}
                <td className="px-3 py-2.5 text-right tabular-nums text-ink-70">
                  {variant === 'tag' ? `${row.postCount} / ${row.projectCount}` : row.postCount}
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 text-right">
                  <button
                    type="button"
                    onClick={() => startEdit(row)}
                    className="cursor-pointer text-[14px] text-ink-70 hover:text-accent"
                  >
                    編輯
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(row.id)}
                    disabled={pending}
                    className="ml-3 cursor-pointer text-[14px] text-ink-70 hover:text-accent-2-700"
                  >
                    刪除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
