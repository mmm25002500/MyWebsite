'use server';

import { revalidateTag } from 'next/cache';
import { z } from 'zod';

import { writeAuditLog } from '@/lib/audit';
import { requireRole } from '@/lib/auth/session';
import { cacheTags } from '@/lib/data/cache';
import { locales } from '@/lib/i18n/config';
import { createServerSupabase } from '@/lib/supabase/server';
import type { Json } from '@/types/database';
import { httpUrl } from '@/lib/validators/url';

export interface ActionResult {
  ok: boolean;
  error?: string;
  id?: string;
}

const nullable = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((value) => (value === '' ? null : value), schema.nullable());

function invalidate() {
  revalidateTag(cacheTags.resume);
  revalidateTag(cacheTags.site);
}

// ---------------------------------------------------------------------------
// 工作經歷
// ---------------------------------------------------------------------------

const experienceSchema = z.object({
  id: z.string().uuid().nullable(),
  organizationId: nullable(z.string().uuid()),
  employmentType: z.enum(['full_time', 'founder', 'freelance', 'part_time', 'intern']),
  startedAt: z.string().min(1, '開始日期必填'),
  endedAt: nullable(z.string()),
  isCurrent: z.boolean(),
  showCompanyName: z.boolean(),
  isVisible: z.boolean(),
  sortOrder: z.number().int().min(0).max(9999),
  url: nullable(z.string().max(300).pipe(httpUrl)),
  contents: z
    .array(
      z.object({
        locale: z.enum(locales),
        companyName: z.string().trim().min(1, '公司名稱不可為空').max(120),
        title: z.string().trim().min(1, '職稱不可為空').max(120),
        location: nullable(z.string().trim().max(120)),
        highlights: z.array(z.string().trim().max(1000)),
        tech: z.array(z.string().trim().max(60)),
      }),
    )
    .min(1),
});

export type SaveExperienceInput = z.infer<typeof experienceSchema>;

export async function saveExperience(input: SaveExperienceInput): Promise<ActionResult> {
  await requireRole('editor');

  const parsed = experienceSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? '欄位驗證失敗' };
  }

  const data = parsed.data;
  const supabase = await createServerSupabase();

  const row = {
    organization_id: data.organizationId,
    employment_type: data.employmentType,
    started_at: data.startedAt,
    ended_at: data.endedAt,
    is_current: data.isCurrent,
    show_company_name: data.showCompanyName,
    is_visible: data.isVisible,
    sort_order: data.sortOrder,
    url: data.url,
  };

  const { data: saved, error } = data.id
    ? await supabase.from('experiences').update(row).eq('id', data.id).select('id').single()
    : await supabase.from('experiences').insert(row).select('id').single();

  if (error || !saved) {
    console.error('[actions] saveExperience 失敗：', error);
    return { ok: false, error: '儲存失敗' };
  }

  for (const content of data.contents) {
    const { error: i18nError } = await supabase.from('experiences_i18n').upsert(
      {
        experience_id: saved.id,
        locale: content.locale,
        company_name: content.companyName,
        title: content.title,
        location: content.location,
        highlights: content.highlights.filter(Boolean) as unknown as Json,
        tech: content.tech.filter(Boolean),
      },
      { onConflict: 'experience_id,locale' },
    );
    if (i18nError) {
      console.error('[actions] saveExperience i18n 失敗：', i18nError);
      return { ok: false, error: '儲存失敗' };
    }
  }

  await writeAuditLog({
    action: data.id ? 'experience.update' : 'experience.create',
    entityType: 'resume',
    entityId: saved.id,
    entityLabel: data.contents[0]?.title ?? '',
  });

  invalidate();
  return { ok: true, id: saved.id };
}

// ---------------------------------------------------------------------------
// 學歷
// ---------------------------------------------------------------------------

const educationSchema = z.object({
  id: z.string().uuid().nullable(),
  startedAt: z.string().min(1, '開始日期必填'),
  endedAt: nullable(z.string()),
  isCurrent: z.boolean(),
  isVisible: z.boolean(),
  sortOrder: z.number().int().min(0).max(9999),
  contents: z
    .array(
      z.object({
        locale: z.enum(locales),
        school: z.string().trim().min(1, '學校不可為空').max(120),
        degree: nullable(z.string().trim().max(80)),
        field: nullable(z.string().trim().max(120)),
      }),
    )
    .min(1),
});

export type SaveEducationInput = z.infer<typeof educationSchema>;

export async function saveEducation(input: SaveEducationInput): Promise<ActionResult> {
  await requireRole('editor');

  const parsed = educationSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? '欄位驗證失敗' };
  }

  const data = parsed.data;
  const supabase = await createServerSupabase();

  const row = {
    started_at: data.startedAt,
    ended_at: data.endedAt,
    is_current: data.isCurrent,
    is_visible: data.isVisible,
    sort_order: data.sortOrder,
  };

  const { data: saved, error } = data.id
    ? await supabase.from('education').update(row).eq('id', data.id).select('id').single()
    : await supabase.from('education').insert(row).select('id').single();

  if (error || !saved) {
    console.error('[actions] saveEducation 失敗：', error);
    return { ok: false, error: '儲存失敗' };
  }

  for (const content of data.contents) {
    const { error: i18nError } = await supabase.from('education_i18n').upsert(
      {
        education_id: saved.id,
        locale: content.locale,
        school: content.school,
        degree: content.degree,
        field: content.field,
      },
      { onConflict: 'education_id,locale' },
    );
    if (i18nError) {
      console.error('[actions] saveEducation i18n 失敗：', i18nError);
      return { ok: false, error: '儲存失敗' };
    }
  }

  await writeAuditLog({
    action: data.id ? 'education.update' : 'education.create',
    entityType: 'resume',
    entityId: saved.id,
    entityLabel: data.contents[0]?.school ?? '',
  });

  invalidate();
  return { ok: true, id: saved.id };
}

// ---------------------------------------------------------------------------
// 技能
// ---------------------------------------------------------------------------

const skillSchema = z.object({
  id: z.string().uuid().nullable(),
  groupId: z.string().uuid(),
  name: z.string().trim().min(1, '技能名稱不可為空').max(80),
  level: z.number().int().min(1).max(5).nullable(),
  isPrimary: z.boolean(),
  showOnHome: z.boolean(),
  isVisible: z.boolean(),
  sortOrder: z.number().int().min(0).max(9999),
});

export type SaveSkillInput = z.infer<typeof skillSchema>;

export async function saveSkill(input: SaveSkillInput): Promise<ActionResult> {
  await requireRole('editor');

  const parsed = skillSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? '欄位驗證失敗' };
  }

  const data = parsed.data;
  const supabase = await createServerSupabase();

  const row = {
    group_id: data.groupId,
    name: data.name,
    level: data.level,
    is_primary: data.isPrimary,
    show_on_home: data.showOnHome,
    is_visible: data.isVisible,
    sort_order: data.sortOrder,
  };

  const { data: saved, error } = data.id
    ? await supabase.from('skills').update(row).eq('id', data.id).select('id').single()
    : await supabase.from('skills').insert(row).select('id').single();

  if (error || !saved) {
    console.error('[actions] saveSkill 失敗：', error);
    return { ok: false, error: '儲存失敗' };
  }

  await writeAuditLog({
    action: data.id ? 'skill.update' : 'skill.create',
    entityType: 'resume',
    entityId: saved.id,
    entityLabel: data.name,
  });

  invalidate();
  return { ok: true, id: saved.id };
}

// ---------------------------------------------------------------------------
// 通用刪除
//
// 履歷的子表結構相同（都是 id + i18n 子表，且 on delete cascade），
// 因此共用一支動作，以白名單限制可刪的表。
// ---------------------------------------------------------------------------

const deletableTables = [
  'experiences',
  'education',
  'skills',
  'skill_groups',
  'certifications',
  'languages_spoken',
  'interests',
] as const;

export async function deleteResumeItem(
  table: (typeof deletableTables)[number],
  id: string,
): Promise<ActionResult> {
  await requireRole('admin');

  if (!deletableTables.includes(table)) {
    return { ok: false, error: '不允許刪除這個項目' };
  }
  // 表名雖有白名單，id 仍是自由字串，另外過一次 uuid。
  if (!z.string().uuid().safeParse(id).success) {
    return { ok: false, error: '項目編號不正確' };
  }

  const supabase = await createServerSupabase();
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) {
    console.error('[actions] deleteResumeItem 失敗：', error);
    return { ok: false, error: '刪除失敗' };
  }

  await writeAuditLog({
    action: `${table}.delete`,
    entityType: 'resume',
    entityId: id,
    severity: 'warning',
  });

  invalidate();
  return { ok: true };
}

// ---------------------------------------------------------------------------
// 顯示設定（規格 §8.5）
// ---------------------------------------------------------------------------

const displaySettingsSchema = z.object({
  showCompanyName: z.boolean(),
  showCertifications: z.boolean(),
});

export async function saveResumeDisplaySettings(
  input: z.infer<typeof displaySettingsSchema>,
): Promise<ActionResult> {
  await requireRole('owner');

  const parsed = displaySettingsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: '欄位驗證失敗' };

  const supabase = await createServerSupabase();

  for (const [key, value] of [
    ['show_company_name', parsed.data.showCompanyName],
    ['show_certifications', parsed.data.showCertifications],
  ] as const) {
    const { error } = await supabase
      .from('site_settings')
      .upsert({ key, value: value as Json }, { onConflict: 'key' });
    if (error) {
      console.error('[actions] saveResumeDisplaySettings 失敗：', error);
      return { ok: false, error: '儲存失敗' };
    }
  }

  await writeAuditLog({
    action: 'settings.resume_display',
    entityType: 'settings',
    diff: parsed.data as unknown as Json,
    severity: 'critical',
  });

  invalidate();
  return { ok: true };
}
