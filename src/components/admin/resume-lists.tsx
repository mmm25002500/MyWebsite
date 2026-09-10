'use client';

import { useState, type ReactNode } from 'react';

import {
  deleteResumeItem,
  saveCertification,
  saveLanguage,
  saveSkillGroup,
} from '@/actions/resume';
import { Button } from '@/components/ui/button';
import type { AdminSkillGroup } from '@/lib/data/queries/admin';
import { locales, type Locale } from '@/lib/i18n/config';
import { cn } from '@/lib/utils';

type Runner = (fn: () => Promise<{ ok: boolean; error?: string }>, done?: () => void) => void;

const field =
  'w-full rounded-md border border-divider bg-bg px-3 py-2 text-[15px] text-text outline-none focus:border-accent';

/** 新增／編輯共用的外框：收合時是一顆「新增」按鈕，展開才是表單。 */
function Editable({
  open,
  onToggle,
  openLabel,
  children,
}: {
  open: boolean;
  onToggle: () => void;
  openLabel: string;
  children: ReactNode;
}) {
  if (!open) {
    return (
      <Button type="button" variant="secondary" onClick={onToggle}>
        {openLabel}
      </Button>
    );
  }
  return <div className="space-y-3 rounded-lg border border-accent bg-surface p-4">{children}</div>;
}

function LocaleTabs({
  active,
  onChange,
  filled,
}: {
  active: Locale;
  onChange: (locale: Locale) => void;
  filled: (locale: Locale) => boolean;
}) {
  return (
    <div className="flex gap-1.5">
      {locales.map((locale) => (
        <button
          key={locale}
          type="button"
          onClick={() => onChange(locale)}
          className={cn(
            'rounded-md px-3 py-1 text-[14px]',
            active === locale ? 'bg-accent text-bg' : 'text-text hover:bg-ink-8',
          )}
        >
          {locale === 'zh-TW' ? '中文' : 'English'}
          {filled(locale) ? ' ✓' : ''}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 技能分組
// ---------------------------------------------------------------------------

type GroupDraft = {
  id: string | null;
  key: string;
  icon: string;
  sortOrder: number;
  isVisible: boolean;
  contents: Record<Locale, { name: string; description: string }>;
};

function emptyContents<T extends object>(value: T): Record<Locale, T> {
  return Object.fromEntries(locales.map((locale) => [locale, { ...value }])) as Record<Locale, T>;
}

export function SkillGroupForm({
  group,
  nextSortOrder,
  pending,
  onRun,
  onClose,
}: {
  group?: AdminSkillGroup;
  nextSortOrder: number;
  pending: boolean;
  onRun: Runner;
  onClose?: () => void;
}) {
  const [locale, setLocale] = useState<Locale>('zh-TW');
  const [draft, setDraft] = useState<GroupDraft>(() => ({
    id: group?.id ?? null,
    key: group?.key ?? '',
    icon: group?.icon ?? '',
    sortOrder: group?.sortOrder ?? nextSortOrder,
    isVisible: group?.isVisible ?? true,
    contents: {
      ...emptyContents({ name: '', description: '' }),
      ...Object.fromEntries(
        Object.entries(group?.contents ?? {}).map(([key, value]) => [
          key,
          { name: value?.name ?? '', description: value?.description ?? '' },
        ]),
      ),
    } as Record<Locale, { name: string; description: string }>,
  }));

  const current = draft.contents[locale];
  const patch = (values: Partial<{ name: string; description: string }>) =>
    setDraft((d) => ({ ...d, contents: { ...d.contents, [locale]: { ...current, ...values } } }));

  const submit = () =>
    onRun(
      () =>
        saveSkillGroup({
          id: draft.id,
          key: draft.key,
          icon: draft.icon,
          sortOrder: draft.sortOrder,
          isVisible: draft.isVisible,
          contents: locales
            .filter((item) => draft.contents[item].name.trim().length > 0)
            .map((item) => ({
              locale: item,
              name: draft.contents[item].name,
              description: draft.contents[item].description,
            })),
        }),
      onClose,
    );

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-bold">{draft.id ? '編輯分組' : '新增分組'}</h3>
        <LocaleTabs
          active={locale}
          onChange={setLocale}
          filled={(item) => draft.contents[item].name.trim().length > 0}
        />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="admin-label">名稱</label>
          <input
            className={field}
            value={current.name}
            onChange={(e) => patch({ name: e.target.value })}
          />
        </div>
        <div>
          <label className="admin-label">識別鍵（小寫英數）</label>
          <input
            className={field}
            value={draft.key}
            placeholder="frontend"
            onChange={(e) => setDraft({ ...draft, key: e.target.value })}
          />
        </div>
        <div className="md:col-span-2">
          <label className="admin-label">說明（選填）</label>
          <input
            className={field}
            value={current.description}
            onChange={(e) => patch({ description: e.target.value })}
          />
        </div>
        <div>
          <label className="admin-label">排序</label>
          <input
            type="number"
            className={field}
            value={draft.sortOrder}
            onChange={(e) => setDraft({ ...draft, sortOrder: Number(e.target.value) })}
          />
        </div>
        <label className="flex items-end gap-2 pb-2 text-[15px]">
          <input
            type="checkbox"
            checked={draft.isVisible}
            onChange={(e) => setDraft({ ...draft, isVisible: e.target.checked })}
            className="accent-accent"
          />
          在前台顯示
        </label>
      </div>

      <div className="flex gap-2">
        <Button type="button" onClick={submit} disabled={pending}>
          儲存
        </Button>
        {onClose ? (
          <Button type="button" variant="secondary" onClick={onClose}>
            取消
          </Button>
        ) : null}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// 語言
// ---------------------------------------------------------------------------

const proficiencyLabels = {
  native: '母語',
  fluent: '流利',
  intermediate: '中等',
  basic: '基礎',
} as const;

export interface LanguageRow {
  id: string;
  code: string;
  proficiency: string;
  isVisible: boolean;
  sortOrder: number;
  name: string;
  contents: Partial<Record<Locale, { name: string; note: string | null }>>;
}

export function LanguageList({
  rows,
  pending,
  onRun,
}: {
  rows: LanguageRow[];
  pending: boolean;
  onRun: Runner;
}) {
  const [editing, setEditing] = useState<string | 'new' | null>(null);

  return (
    <div className="space-y-3">
      <ul className="space-y-2">
        {rows.map((row) =>
          editing === row.id ? (
            <li key={row.id} className="rounded-lg border border-accent bg-surface p-4">
              <LanguageForm
                row={row}
                nextSortOrder={row.sortOrder}
                pending={pending}
                onRun={onRun}
                onClose={() => setEditing(null)}
              />
            </li>
          ) : (
            <li
              key={row.id}
              className="flex flex-wrap items-baseline gap-3 rounded-lg border border-divider bg-surface p-3.5"
            >
              <span className={cn('font-bold', !row.isVisible && 'text-ink-45')}>{row.name}</span>
              <span className="text-[14px] text-ink-70">{row.code}</span>
              <span className="text-[14px] text-ink-70">
                {proficiencyLabels[row.proficiency as keyof typeof proficiencyLabels] ??
                  row.proficiency}
              </span>
              <button
                type="button"
                onClick={() => setEditing(row.id)}
                className="ml-auto cursor-pointer text-[14px] text-ink-70 hover:text-accent"
              >
                編輯
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => onRun(() => deleteResumeItem('languages_spoken', row.id))}
                className="cursor-pointer text-[14px] text-ink-70 hover:text-accent-2-700"
              >
                刪除
              </button>
            </li>
          ),
        )}
      </ul>

      <Editable open={editing === 'new'} onToggle={() => setEditing('new')} openLabel="新增語言">
        <LanguageForm
          nextSortOrder={rows.length}
          pending={pending}
          onRun={onRun}
          onClose={() => setEditing(null)}
        />
      </Editable>
    </div>
  );
}

function LanguageForm({
  row,
  nextSortOrder,
  pending,
  onRun,
  onClose,
}: {
  row?: LanguageRow;
  nextSortOrder: number;
  pending: boolean;
  onRun: Runner;
  onClose: () => void;
}) {
  const [locale, setLocale] = useState<Locale>('zh-TW');
  const [draft, setDraft] = useState(() => ({
    id: row?.id ?? null,
    code: row?.code ?? '',
    proficiency: (row?.proficiency ?? 'intermediate') as keyof typeof proficiencyLabels,
    sortOrder: row?.sortOrder ?? nextSortOrder,
    isVisible: row?.isVisible ?? true,
    contents: {
      ...emptyContents({ name: '', note: '' }),
      ...Object.fromEntries(
        Object.entries(row?.contents ?? {}).map(([key, value]) => [
          key,
          { name: value?.name ?? '', note: value?.note ?? '' },
        ]),
      ),
    } as Record<Locale, { name: string; note: string }>,
  }));

  const current = draft.contents[locale];

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-bold">{draft.id ? '編輯語言' : '新增語言'}</h3>
        <LocaleTabs
          active={locale}
          onChange={setLocale}
          filled={(item) => draft.contents[item].name.trim().length > 0}
        />
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div>
          <label className="admin-label">名稱</label>
          <input
            className={field}
            value={current.name}
            placeholder="中文"
            onChange={(e) =>
              setDraft({
                ...draft,
                contents: { ...draft.contents, [locale]: { ...current, name: e.target.value } },
              })
            }
          />
        </div>
        <div>
          <label className="admin-label">語言代碼</label>
          <input
            className={field}
            value={draft.code}
            placeholder="zh-TW"
            onChange={(e) => setDraft({ ...draft, code: e.target.value })}
          />
        </div>
        <div>
          <label className="admin-label">程度</label>
          <select
            className={field}
            value={draft.proficiency}
            onChange={(e) =>
              setDraft({ ...draft, proficiency: e.target.value as keyof typeof proficiencyLabels })
            }
          >
            {Object.entries(proficiencyLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="admin-label">備註（選填）</label>
          <input
            className={field}
            value={current.note}
            onChange={(e) =>
              setDraft({
                ...draft,
                contents: { ...draft.contents, [locale]: { ...current, note: e.target.value } },
              })
            }
          />
        </div>
        <label className="flex items-end gap-2 pb-2 text-[15px]">
          <input
            type="checkbox"
            checked={draft.isVisible}
            onChange={(e) => setDraft({ ...draft, isVisible: e.target.checked })}
            className="accent-accent"
          />
          在前台顯示
        </label>
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          disabled={pending}
          onClick={() =>
            onRun(
              () =>
                saveLanguage({
                  id: draft.id,
                  code: draft.code,
                  proficiency: draft.proficiency,
                  sortOrder: draft.sortOrder,
                  isVisible: draft.isVisible,
                  contents: locales
                    .filter((item) => draft.contents[item].name.trim().length > 0)
                    .map((item) => ({
                      locale: item,
                      name: draft.contents[item].name,
                      note: draft.contents[item].note,
                    })),
                }),
              onClose,
            )
          }
        >
          儲存
        </Button>
        <Button type="button" variant="secondary" onClick={onClose}>
          取消
        </Button>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// 證照
// ---------------------------------------------------------------------------

export interface CertificationRow {
  id: string;
  issuedAt: string | null;
  expiresAt: string | null;
  credentialId: string | null;
  credentialUrl: string | null;
  isVisible: boolean;
  sortOrder: number;
  name: string;
  issuer: string;
  contents: Partial<Record<Locale, { name: string; issuer: string; description: string | null }>>;
}

export function CertificationList({
  rows,
  pending,
  onRun,
}: {
  rows: CertificationRow[];
  pending: boolean;
  onRun: Runner;
}) {
  const [editing, setEditing] = useState<string | 'new' | null>(null);

  return (
    <div className="space-y-3">
      <ul className="space-y-2">
        {rows.map((row) =>
          editing === row.id ? (
            <li key={row.id} className="rounded-lg border border-accent bg-surface p-4">
              <CertificationForm
                row={row}
                nextSortOrder={row.sortOrder}
                pending={pending}
                onRun={onRun}
                onClose={() => setEditing(null)}
              />
            </li>
          ) : (
            <li
              key={row.id}
              className="flex flex-wrap items-baseline gap-3 rounded-lg border border-divider bg-surface p-3.5"
            >
              <span className={cn('font-bold', !row.isVisible && 'text-ink-45')}>{row.name}</span>
              <span className="text-[14px] text-ink-70">{row.issuer}</span>
              {row.issuedAt ? (
                <span className="text-[14px] text-ink-55">{row.issuedAt}</span>
              ) : null}
              <button
                type="button"
                onClick={() => setEditing(row.id)}
                className="ml-auto cursor-pointer text-[14px] text-ink-70 hover:text-accent"
              >
                編輯
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => onRun(() => deleteResumeItem('certifications', row.id))}
                className="cursor-pointer text-[14px] text-ink-70 hover:text-accent-2-700"
              >
                刪除
              </button>
            </li>
          ),
        )}
      </ul>

      <Editable open={editing === 'new'} onToggle={() => setEditing('new')} openLabel="新增證照">
        <CertificationForm
          nextSortOrder={rows.length}
          pending={pending}
          onRun={onRun}
          onClose={() => setEditing(null)}
        />
      </Editable>
    </div>
  );
}

function CertificationForm({
  row,
  nextSortOrder,
  pending,
  onRun,
  onClose,
}: {
  row?: CertificationRow;
  nextSortOrder: number;
  pending: boolean;
  onRun: Runner;
  onClose: () => void;
}) {
  const [locale, setLocale] = useState<Locale>('zh-TW');
  const [draft, setDraft] = useState(() => ({
    id: row?.id ?? null,
    issuedAt: row?.issuedAt ?? '',
    expiresAt: row?.expiresAt ?? '',
    credentialId: row?.credentialId ?? '',
    credentialUrl: row?.credentialUrl ?? '',
    sortOrder: row?.sortOrder ?? nextSortOrder,
    isVisible: row?.isVisible ?? true,
    contents: {
      ...emptyContents({ name: '', issuer: '', description: '' }),
      ...Object.fromEntries(
        Object.entries(row?.contents ?? {}).map(([key, value]) => [
          key,
          {
            name: value?.name ?? '',
            issuer: value?.issuer ?? '',
            description: value?.description ?? '',
          },
        ]),
      ),
    } as Record<Locale, { name: string; issuer: string; description: string }>,
  }));

  const current = draft.contents[locale];
  const patch = (values: Partial<{ name: string; issuer: string; description: string }>) =>
    setDraft((d) => ({ ...d, contents: { ...d.contents, [locale]: { ...current, ...values } } }));

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-bold">{draft.id ? '編輯證照' : '新增證照'}</h3>
        <LocaleTabs
          active={locale}
          onChange={setLocale}
          filled={(item) => draft.contents[item].name.trim().length > 0}
        />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="admin-label">名稱</label>
          <input
            className={field}
            value={current.name}
            onChange={(e) => patch({ name: e.target.value })}
          />
        </div>
        <div>
          <label className="admin-label">發證單位</label>
          <input
            className={field}
            value={current.issuer}
            onChange={(e) => patch({ issuer: e.target.value })}
          />
        </div>
        <div className="md:col-span-2">
          <label className="admin-label">說明（選填）</label>
          <input
            className={field}
            value={current.description}
            onChange={(e) => patch({ description: e.target.value })}
          />
        </div>
        <div>
          <label className="admin-label">發證日期</label>
          <input
            type="date"
            className={field}
            value={draft.issuedAt ?? ''}
            onChange={(e) => setDraft({ ...draft, issuedAt: e.target.value })}
          />
        </div>
        <div>
          <label className="admin-label">到期日（選填）</label>
          <input
            type="date"
            className={field}
            value={draft.expiresAt ?? ''}
            onChange={(e) => setDraft({ ...draft, expiresAt: e.target.value })}
          />
        </div>
        <div>
          <label className="admin-label">證書編號（選填）</label>
          <input
            className={field}
            value={draft.credentialId}
            onChange={(e) => setDraft({ ...draft, credentialId: e.target.value })}
          />
        </div>
        <div>
          <label className="admin-label">驗證網址（選填）</label>
          <input
            className={field}
            placeholder="https://"
            value={draft.credentialUrl}
            onChange={(e) => setDraft({ ...draft, credentialUrl: e.target.value })}
          />
        </div>
        <div>
          <label className="admin-label">排序</label>
          <input
            type="number"
            className={field}
            value={draft.sortOrder}
            onChange={(e) => setDraft({ ...draft, sortOrder: Number(e.target.value) })}
          />
        </div>
        <label className="flex items-end gap-2 pb-2 text-[15px]">
          <input
            type="checkbox"
            checked={draft.isVisible}
            onChange={(e) => setDraft({ ...draft, isVisible: e.target.checked })}
            className="accent-accent"
          />
          在前台顯示
        </label>
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          disabled={pending}
          onClick={() =>
            onRun(
              () =>
                saveCertification({
                  id: draft.id,
                  issuedAt: draft.issuedAt,
                  expiresAt: draft.expiresAt,
                  credentialId: draft.credentialId,
                  credentialUrl: draft.credentialUrl,
                  sortOrder: draft.sortOrder,
                  isVisible: draft.isVisible,
                  contents: locales
                    .filter((item) => draft.contents[item].name.trim().length > 0)
                    .map((item) => ({
                      locale: item,
                      name: draft.contents[item].name,
                      issuer: draft.contents[item].issuer,
                      description: draft.contents[item].description,
                    })),
                }),
              onClose,
            )
          }
        >
          儲存
        </Button>
        <Button type="button" variant="secondary" onClick={onClose}>
          取消
        </Button>
      </div>
    </>
  );
}
