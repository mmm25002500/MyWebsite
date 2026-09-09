'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition, type ReactNode } from 'react';

import { deleteResource, saveResource, type ResourceTable } from '@/actions/resources';
import { Button } from '@/components/ui/button';
import { locales } from '@/lib/i18n/config';

export interface ResourceField {
  key: string;
  label: string;
  type?: 'text' | 'date' | 'number' | 'checkbox' | 'select' | 'textarea';
  options?: { value: string; label: string }[];
  /** i18n 欄位放在 `*_i18n` 子表，其餘放主表。 */
  i18n?: boolean;
  placeholder?: string;
}

export interface ResourceRow {
  id: string;
  values: Record<string, unknown>;
  i18n: Record<string, Record<string, unknown>>;
  summary: ReactNode;
}

/**
 * §8.8 各模組共用的資源列表。
 *
 * 這些模組（組織、時間軸、連結樹、贊助、更新日誌、影片、轉址）的操作
 * 一模一樣：列出、新增、編輯、刪除，差別只在欄位定義。以宣告式的欄位
 * 描述驅動同一個元件，比複製七份表格容易維持一致。
 */
export function ResourceList({
  table,
  rows,
  fields,
  labelField,
  canDelete = true,
}: {
  table: ResourceTable;
  rows: ResourceRow[];
  fields: ResourceField[];
  labelField?: string;
  canDelete?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [draft, setDraft] = useState<{
    id: string | null;
    values: Record<string, unknown>;
    i18n: Record<string, Record<string, unknown>>;
  } | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const mainFields = fields.filter((f) => !f.i18n);
  const i18nFields = fields.filter((f) => f.i18n);

  const field =
    'w-full min-h-9 rounded-md border border-divider bg-bg px-2.5 py-1.5 text-[15px] text-text outline-none transition-colors focus-visible:border-accent';

  const startNew = () =>
    setDraft({
      id: null,
      values: {},
      i18n: Object.fromEntries(locales.map((locale) => [locale, {}])),
    });

  const save = () => {
    if (!draft) return;
    setMessage(null);
    startTransition(async () => {
      const result = await saveResource({
        table,
        id: draft.id,
        values: draft.values,
        i18n: locales.map((locale) => ({ locale, ...draft.i18n[locale] })),
        label: labelField
          ? String(draft.i18n['zh-TW']?.[labelField] ?? draft.values[labelField] ?? '')
          : undefined,
      });

      if (!result.ok) {
        setMessage(result.error ?? '儲存失敗');
        return;
      }
      setDraft(null);
      router.refresh();
    });
  };

  const remove = (id: string) => {
    setMessage(null);
    startTransition(async () => {
      const result = await deleteResource(table, id);
      if (!result.ok) {
        setMessage(result.error ?? '刪除失敗');
        return;
      }
      router.refresh();
    });
  };

  const renderInput = (
    definition: ResourceField,
    value: unknown,
    onChange: (next: unknown) => void,
  ) => {
    if (definition.type === 'checkbox') {
      return (
        <label className="flex items-center gap-2.5 text-[15px]">
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(event) => onChange(event.target.checked)}
            className="size-4 accent-[var(--color-accent)]"
          />
          {definition.label}
        </label>
      );
    }

    if (definition.type === 'select') {
      return (
        <select value={String(value ?? '')} onChange={(event) => onChange(event.target.value)} className={field}>
          <option value="">—</option>
          {definition.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
    }

    if (definition.type === 'textarea') {
      return (
        <textarea
          rows={3}
          value={String(value ?? '')}
          placeholder={definition.placeholder}
          onChange={(event) => onChange(event.target.value)}
          className={`${field} resize-y`}
        />
      );
    }

    return (
      <input
        type={definition.type ?? 'text'}
        value={String(value ?? '')}
        placeholder={definition.placeholder}
        onChange={(event) =>
          onChange(definition.type === 'number' ? Number(event.target.value) : event.target.value)
        }
        className={field}
      />
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button size="sm" onClick={startNew}>
          新增
        </Button>
        {message ? <span className="text-[14px] text-accent-2-700">{message}</span> : null}
      </div>

      {draft ? (
        <div className="space-y-4 rounded-lg border border-accent bg-surface p-4">
          {i18nFields.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {locales.map((locale) => (
                <div key={locale} className="space-y-2">
                  <p className="text-[14px] font-bold text-ink-70">
                    {locale === 'zh-TW' ? '中文' : 'English'}
                  </p>
                  {i18nFields.map((definition) => (
                    <div key={definition.key}>
                      {definition.type !== 'checkbox' ? (
                        <label className="mb-1 block text-[13px] text-ink-70">
                          {definition.label}
                        </label>
                      ) : null}
                      {renderInput(definition, draft.i18n[locale]?.[definition.key], (next) =>
                        setDraft((current) =>
                          current
                            ? {
                                ...current,
                                i18n: {
                                  ...current.i18n,
                                  [locale]: { ...current.i18n[locale], [definition.key]: next },
                                },
                              }
                            : current,
                        ),
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ) : null}

          <div className="grid gap-3 md:grid-cols-3">
            {mainFields.map((definition) => (
              <div key={definition.key}>
                {definition.type !== 'checkbox' ? (
                  <label className="mb-1 block text-[13px] text-ink-70">{definition.label}</label>
                ) : null}
                {renderInput(definition, draft.values[definition.key], (next) =>
                  setDraft((current) =>
                    current
                      ? { ...current, values: { ...current.values, [definition.key]: next } }
                      : current,
                  ),
                )}
              </div>
            ))}
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

      {rows.length === 0 ? (
        <p className="rounded-lg border border-divider py-12 text-center text-[15px] text-ink-70">
          尚無資料
        </p>
      ) : null}

      <ul className="space-y-2">
        {rows.map((row) => (
          <li
            key={row.id}
            className="flex flex-wrap items-baseline gap-3 rounded-lg border border-divider bg-surface p-3.5"
          >
            <div className="min-w-0 flex-1">{row.summary}</div>
            <button
              type="button"
              onClick={() => setDraft({ id: row.id, values: row.values, i18n: row.i18n })}
              className="cursor-pointer text-[14px] text-ink-70 hover:text-accent"
            >
              編輯
            </button>
            {canDelete ? (
              <button
                type="button"
                disabled={pending}
                onClick={() => remove(row.id)}
                className="cursor-pointer text-[14px] text-ink-70 hover:text-accent-2-700"
              >
                刪除
              </button>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
