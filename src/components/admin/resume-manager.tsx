'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import {
  deleteResumeItem,
  saveEducation,
  saveExperience,
  saveResumeDisplaySettings,
  saveSkill,
  type SaveEducationInput,
  type SaveExperienceInput,
} from '@/actions/resume';
import { Button } from '@/components/ui/button';
import type { AdminEducation, AdminExperience, AdminSkillGroup } from '@/lib/data/queries/admin';
import { locales } from '@/lib/i18n/config';
import { cn, formatPeriod } from '@/lib/utils';

const field =
  'w-full min-h-9 rounded-md border border-divider bg-bg px-2.5 py-1.5 text-[15px] text-text outline-none transition-colors focus-visible:border-accent';
const label = 'mb-1.5 block text-[14px] font-bold text-ink-70';

const employmentLabels: Record<string, string> = {
  full_time: '全職',
  founder: '創辦人',
  freelance: '接案',
  part_time: '兼職',
  intern: '實習',
};

type Tab = 'experience' | 'education' | 'skills' | 'languages' | 'certifications' | 'display';

interface Props {
  data: Awaited<ReturnType<typeof import('@/lib/data/queries/admin').getAdminResume>>;
  canEditSettings: boolean;
}

/** 履歷管理（規格 §8.5）。以分頁籤切換各區塊，每區塊獨立新增／編輯／刪除。 */
export function ResumeManager({ data, canEditSettings }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('experience');
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const [experienceDraft, setExperienceDraft] = useState<SaveExperienceInput | null>(null);
  const [educationDraft, setEducationDraft] = useState<SaveEducationInput | null>(null);
  const [settings, setSettings] = useState(data.settings);

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, done?: () => void) => {
    setMessage(null);
    startTransition(async () => {
      const result = await fn();
      if (!result.ok) {
        setMessage(result.error ?? '操作失敗');
        return;
      }
      done?.();
      router.refresh();
    });
  };

  const emptyExperience = (): SaveExperienceInput => ({
    id: null,
    organizationId: null,
    employmentType: 'full_time',
    startedAt: '',
    endedAt: null,
    isCurrent: false,
    showCompanyName: true,
    isVisible: true,
    sortOrder: data.experiences.length,
    url: null,
    contents: locales.map((locale) => ({
      locale,
      companyName: '',
      title: '',
      location: null,
      highlights: [],
      tech: [],
    })),
  });

  const toExperienceDraft = (row: AdminExperience): SaveExperienceInput => ({
    id: row.id,
    organizationId: row.organizationId,
    employmentType: row.employmentType as SaveExperienceInput['employmentType'],
    startedAt: row.startedAt,
    endedAt: row.endedAt,
    isCurrent: row.isCurrent,
    showCompanyName: row.showCompanyName,
    isVisible: row.isVisible,
    sortOrder: row.sortOrder,
    url: row.url,
    contents: locales.map((locale) => ({
      locale,
      companyName: row.contents[locale]?.companyName ?? '',
      title: row.contents[locale]?.title ?? '',
      location: row.contents[locale]?.location ?? null,
      highlights: row.contents[locale]?.highlights ?? [],
      tech: row.contents[locale]?.tech ?? [],
    })),
  });

  const emptyEducation = (): SaveEducationInput => ({
    id: null,
    startedAt: '',
    endedAt: null,
    isCurrent: false,
    isVisible: true,
    sortOrder: data.education.length,
    contents: locales.map((locale) => ({ locale, school: '', degree: null, field: null })),
  });

  const toEducationDraft = (row: AdminEducation): SaveEducationInput => ({
    id: row.id,
    startedAt: row.startedAt,
    endedAt: row.endedAt,
    isCurrent: row.isCurrent,
    isVisible: row.isVisible,
    sortOrder: row.sortOrder,
    contents: locales.map((locale) => ({
      locale,
      school: row.contents[locale]?.school ?? '',
      degree: row.contents[locale]?.degree ?? null,
      field: row.contents[locale]?.field ?? null,
    })),
  });

  const tabs: [Tab, string][] = [
    ['experience', `工作經歷 ${data.experiences.length}`],
    ['education', `學歷 ${data.education.length}`],
    ['skills', '技能'],
    ['languages', `語言 ${data.languages.length}`],
    ['certifications', `證照 ${data.certifications.length}`],
    ['display', '顯示設定'],
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-[28px] font-bold">履歷</h1>
        {message ? <span className="text-[14px] text-accent-2-700">{message}</span> : null}
        <a
          href="/resume"
          target="_blank"
          rel="noreferrer"
          className="ml-auto rounded-md border border-divider px-3 py-1.5 text-[14px] text-text hover:bg-ink-8"
        >
          前台檢視
        </a>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-divider">
        {tabs.map(([key, text]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={cn(
              '-mb-px cursor-pointer border-b-2 px-3 py-2 text-[15px] transition-colors',
              tab === key
                ? 'border-accent font-bold text-text'
                : 'border-transparent text-ink-70 hover:text-text',
            )}
          >
            {text}
          </button>
        ))}
      </div>

      {tab === 'experience' ? (
        <div className="space-y-4">
          <Button size="sm" onClick={() => setExperienceDraft(emptyExperience())}>
            新增經歷
          </Button>

          {experienceDraft ? (
            <div className="space-y-4 rounded-lg border border-accent bg-surface p-4">
              <div className="grid gap-4 md:grid-cols-2">
                {experienceDraft.contents.map((content, index) => (
                  <div key={content.locale} className="space-y-2">
                    <p className="text-[14px] font-bold text-ink-70">
                      {content.locale === 'zh-TW' ? '中文' : 'English'}
                    </p>
                    <input
                      value={content.companyName}
                      placeholder="公司名稱"
                      onChange={(e) =>
                        setExperienceDraft((d) =>
                          d
                            ? {
                                ...d,
                                contents: d.contents.map((row, i) =>
                                  i === index ? { ...row, companyName: e.target.value } : row,
                                ),
                              }
                            : d,
                        )
                      }
                      className={field}
                    />
                    <input
                      value={content.title}
                      placeholder="職稱"
                      onChange={(e) =>
                        setExperienceDraft((d) =>
                          d
                            ? {
                                ...d,
                                contents: d.contents.map((row, i) =>
                                  i === index ? { ...row, title: e.target.value } : row,
                                ),
                              }
                            : d,
                        )
                      }
                      className={field}
                    />
                    <textarea
                      value={content.highlights.join('\n')}
                      placeholder="工作內容，一行一項"
                      rows={5}
                      onChange={(e) =>
                        setExperienceDraft((d) =>
                          d
                            ? {
                                ...d,
                                contents: d.contents.map((row, i) =>
                                  i === index
                                    ? { ...row, highlights: e.target.value.split('\n') }
                                    : row,
                                ),
                              }
                            : d,
                        )
                      }
                      className={`${field} resize-y`}
                    />
                    <input
                      value={content.tech.join(', ')}
                      placeholder="技術，以逗號分隔"
                      onChange={(e) =>
                        setExperienceDraft((d) =>
                          d
                            ? {
                                ...d,
                                contents: d.contents.map((row, i) =>
                                  i === index
                                    ? { ...row, tech: e.target.value.split(',').map((t) => t.trim()) }
                                    : row,
                                ),
                              }
                            : d,
                        )
                      }
                      className={field}
                    />
                  </div>
                ))}
              </div>

              <div className="grid gap-3 md:grid-cols-4">
                <div>
                  <label className={label} htmlFor="e-start">開始</label>
                  <input id="e-start" type="date" value={experienceDraft.startedAt} onChange={(e) => setExperienceDraft((d) => (d ? { ...d, startedAt: e.target.value } : d))} className={field} />
                </div>
                <div>
                  <label className={label} htmlFor="e-end">結束</label>
                  <input id="e-end" type="date" value={experienceDraft.endedAt ?? ''} onChange={(e) => setExperienceDraft((d) => (d ? { ...d, endedAt: e.target.value || null } : d))} className={field} />
                </div>
                <div>
                  <label className={label} htmlFor="e-type">類型</label>
                  <select id="e-type" value={experienceDraft.employmentType} onChange={(e) => setExperienceDraft((d) => (d ? { ...d, employmentType: e.target.value as SaveExperienceInput['employmentType'] } : d))} className={field}>
                    {Object.entries(employmentLabels).map(([value, text]) => (
                      <option key={value} value={value}>{text}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={label} htmlFor="e-org">關聯團隊</label>
                  <select id="e-org" value={experienceDraft.organizationId ?? ''} onChange={(e) => setExperienceDraft((d) => (d ? { ...d, organizationId: e.target.value || null } : d))} className={field}>
                    <option value="">無</option>
                    {data.organizations.map((org) => (
                      <option key={org.id} value={org.id}>{org.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                {(
                  [
                    ['isCurrent', '目前在職'],
                    ['showCompanyName', '顯示公司名稱'],
                    ['isVisible', '在前台顯示'],
                  ] as const
                ).map(([key, text]) => (
                  <label key={key} className="flex items-center gap-2.5 text-[15px]">
                    <input type="checkbox" checked={experienceDraft[key]} onChange={(e) => setExperienceDraft((d) => (d ? { ...d, [key]: e.target.checked } : d))} className="size-4 accent-[var(--color-accent)]" />
                    {text}
                  </label>
                ))}
              </div>

              <div className="flex gap-2">
                <Button size="sm" disabled={pending} onClick={() => run(() => saveExperience(experienceDraft), () => setExperienceDraft(null))}>
                  儲存
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setExperienceDraft(null)}>取消</Button>
              </div>
            </div>
          ) : null}

          <ul className="space-y-2">
            {data.experiences.map((row) => (
              <li key={row.id} className="flex flex-wrap items-baseline gap-3 rounded-lg border border-divider bg-surface p-3.5">
                <span className="w-32 shrink-0 text-[14px] text-ink-70">
                  {formatPeriod(row.startedAt, row.endedAt, '至今')}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-bold">{row.contents['zh-TW']?.title}</p>
                  <p className="text-[14px] text-ink-70">
                    {row.contents['zh-TW']?.companyName} · {employmentLabels[row.employmentType]}
                    {!row.isVisible ? ' · 未顯示' : ''}
                    {!row.showCompanyName ? ' · 隱藏公司名' : ''}
                  </p>
                </div>
                <button type="button" onClick={() => setExperienceDraft(toExperienceDraft(row))} className="cursor-pointer text-[14px] text-ink-70 hover:text-accent">編輯</button>
                <button type="button" disabled={pending} onClick={() => run(() => deleteResumeItem('experiences', row.id))} className="cursor-pointer text-[14px] text-ink-70 hover:text-accent-2-700">刪除</button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {tab === 'education' ? (
        <div className="space-y-4">
          <Button size="sm" onClick={() => setEducationDraft(emptyEducation())}>新增學歷</Button>

          {educationDraft ? (
            <div className="space-y-4 rounded-lg border border-accent bg-surface p-4">
              <div className="grid gap-4 md:grid-cols-2">
                {educationDraft.contents.map((content, index) => (
                  <div key={content.locale} className="space-y-2">
                    <p className="text-[14px] font-bold text-ink-70">{content.locale === 'zh-TW' ? '中文' : 'English'}</p>
                    <input value={content.school} placeholder="學校" onChange={(e) => setEducationDraft((d) => (d ? { ...d, contents: d.contents.map((row, i) => (i === index ? { ...row, school: e.target.value } : row)) } : d))} className={field} />
                    <input value={content.field ?? ''} placeholder="科系" onChange={(e) => setEducationDraft((d) => (d ? { ...d, contents: d.contents.map((row, i) => (i === index ? { ...row, field: e.target.value || null } : row)) } : d))} className={field} />
                    <input value={content.degree ?? ''} placeholder="學位" onChange={(e) => setEducationDraft((d) => (d ? { ...d, contents: d.contents.map((row, i) => (i === index ? { ...row, degree: e.target.value || null } : row)) } : d))} className={field} />
                  </div>
                ))}
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <div>
                  <label className={label} htmlFor="edu-start">開始</label>
                  <input id="edu-start" type="date" value={educationDraft.startedAt} onChange={(e) => setEducationDraft((d) => (d ? { ...d, startedAt: e.target.value } : d))} className={field} />
                </div>
                <div>
                  <label className={label} htmlFor="edu-end">結束</label>
                  <input id="edu-end" type="date" value={educationDraft.endedAt ?? ''} onChange={(e) => setEducationDraft((d) => (d ? { ...d, endedAt: e.target.value || null } : d))} className={field} />
                </div>
                <label className="flex items-end gap-2.5 pb-2 text-[15px]">
                  <input type="checkbox" checked={educationDraft.isVisible} onChange={(e) => setEducationDraft((d) => (d ? { ...d, isVisible: e.target.checked } : d))} className="size-4 accent-[var(--color-accent)]" />
                  在前台顯示
                </label>
              </div>
              <div className="flex gap-2">
                <Button size="sm" disabled={pending} onClick={() => run(() => saveEducation(educationDraft), () => setEducationDraft(null))}>儲存</Button>
                <Button size="sm" variant="secondary" onClick={() => setEducationDraft(null)}>取消</Button>
              </div>
            </div>
          ) : null}

          <ul className="space-y-2">
            {data.education.map((row) => (
              <li key={row.id} className="flex flex-wrap items-baseline gap-3 rounded-lg border border-divider bg-surface p-3.5">
                <span className="w-32 shrink-0 text-[14px] text-ink-70">{formatPeriod(row.startedAt, row.endedAt, '至今')}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-bold">{row.contents['zh-TW']?.school}</p>
                  <p className="text-[14px] text-ink-70">
                    {[row.contents['zh-TW']?.field, row.contents['zh-TW']?.degree].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <button type="button" onClick={() => setEducationDraft(toEducationDraft(row))} className="cursor-pointer text-[14px] text-ink-70 hover:text-accent">編輯</button>
                <button type="button" disabled={pending} onClick={() => run(() => deleteResumeItem('education', row.id))} className="cursor-pointer text-[14px] text-ink-70 hover:text-accent-2-700">刪除</button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {tab === 'skills' ? (
        <div className="space-y-5">
          {data.skillGroups.map((group) => (
            <SkillGroupEditor key={group.id} group={group} pending={pending} onRun={run} />
          ))}
        </div>
      ) : null}

      {tab === 'languages' ? (
        <ul className="space-y-2">
          {data.languages.map((row) => (
            <li key={row.id} className="flex items-baseline gap-3 rounded-lg border border-divider bg-surface p-3.5">
              <span className="font-bold">{row.name}</span>
              <span className="text-[14px] text-ink-70">{row.proficiency}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {tab === 'certifications' ? (
        <div className="space-y-3">
          <p className="text-[14px] text-ink-70">
            {settings.showCertifications ? '證照區目前顯示於前台。' : '證照區目前隱藏，可在「顯示設定」開啟。'}
          </p>
          <ul className="space-y-2">
            {data.certifications.map((row) => (
              <li key={row.id} className="flex items-baseline gap-3 rounded-lg border border-divider bg-surface p-3.5">
                <span className="font-bold">{row.name}</span>
                <span className="text-[14px] text-ink-70">{row.issuer}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {tab === 'display' ? (
        <div className="max-w-lg space-y-4 rounded-lg border border-divider bg-surface p-4">
          {!canEditSettings ? (
            <p className="text-[14px] text-accent-2-700">只有站長可以修改顯示設定。</p>
          ) : null}
          <label className="flex items-center gap-2.5 text-[15px]">
            <input type="checkbox" disabled={!canEditSettings} checked={settings.showCompanyName} onChange={(e) => setSettings((s) => ({ ...s, showCompanyName: e.target.checked }))} className="size-4 accent-[var(--color-accent)]" />
            顯示現職公司名稱
          </label>
          <label className="flex items-center gap-2.5 text-[15px]">
            <input type="checkbox" disabled={!canEditSettings} checked={settings.showCertifications} onChange={(e) => setSettings((s) => ({ ...s, showCertifications: e.target.checked }))} className="size-4 accent-[var(--color-accent)]" />
            顯示證照區
          </label>
          <Button size="sm" disabled={pending || !canEditSettings} onClick={() => run(() => saveResumeDisplaySettings(settings))}>
            儲存設定
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function SkillGroupEditor({
  group,
  pending,
  onRun,
}: {
  group: AdminSkillGroup;
  pending: boolean;
  onRun: (fn: () => Promise<{ ok: boolean; error?: string }>, done?: () => void) => void;
}) {
  const [newSkill, setNewSkill] = useState('');

  return (
    <section className="rounded-lg border border-divider bg-surface p-4">
      <h2 className="text-[16px] font-bold">{group.name}</h2>

      <div className="mt-3 space-y-1.5">
        {group.skills.map((skill) => (
          <div key={skill.id} className="flex flex-wrap items-center gap-3 text-[15px]">
            <span className="min-w-40 flex-1">{skill.name}</span>
            <label className="flex items-center gap-1.5 text-[14px] text-ink-70">
              <input
                type="checkbox"
                checked={skill.showOnHome}
                onChange={(e) =>
                  onRun(() =>
                    saveSkill({
                      id: skill.id,
                      groupId: group.id,
                      name: skill.name,
                      level: skill.level,
                      isPrimary: skill.isPrimary,
                      showOnHome: e.target.checked,
                      isVisible: skill.isVisible,
                      sortOrder: skill.sortOrder,
                    }),
                  )
                }
                className="size-4 accent-[var(--color-accent)]"
              />
              首頁顯示
            </label>
            <label className="flex items-center gap-1.5 text-[14px] text-ink-70">
              <input
                type="checkbox"
                checked={skill.isPrimary}
                onChange={(e) =>
                  onRun(() =>
                    saveSkill({
                      id: skill.id,
                      groupId: group.id,
                      name: skill.name,
                      level: skill.level,
                      isPrimary: e.target.checked,
                      showOnHome: skill.showOnHome,
                      isVisible: skill.isVisible,
                      sortOrder: skill.sortOrder,
                    }),
                  )
                }
                className="size-4 accent-[var(--color-accent)]"
              />
              主要技能
            </label>
            <button
              type="button"
              disabled={pending}
              onClick={() => onRun(() => deleteResumeItem('skills', skill.id))}
              className="cursor-pointer text-[14px] text-ink-70 hover:text-accent-2-700"
            >
              刪除
            </button>
          </div>
        ))}
      </div>

      <div className="mt-3 flex gap-2">
        <input
          value={newSkill}
          placeholder="新增技能"
          onChange={(event) => setNewSkill(event.target.value)}
          className={field}
        />
        <Button
          size="sm"
          variant="secondary"
          disabled={pending || !newSkill.trim()}
          onClick={() =>
            onRun(
              () =>
                saveSkill({
                  id: null,
                  groupId: group.id,
                  name: newSkill.trim(),
                  level: null,
                  isPrimary: false,
                  showOnHome: false,
                  isVisible: true,
                  sortOrder: group.skills.length,
                }),
              () => setNewSkill(''),
            )
          }
        >
          新增
        </Button>
      </div>
    </section>
  );
}
