import { z } from 'zod';

import { locales } from '@/lib/i18n/config';

const slugSchema = z
  .string()
  .trim()
  .min(1, 'slug 不可為空')
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug 只能是小寫英數與連字號');

const i18nSchema = z.object({
  locale: z.enum(locales),
  name: z.string().trim().min(1, '名稱不可為空').max(80),
  description: z.preprocess(
    (value) => (value === '' ? null : value),
    z.string().trim().max(300).nullable(),
  ),
});

export const saveCategorySchema = z.object({
  id: z.string().uuid().nullable(),
  slug: slugSchema,
  icon: z.preprocess((v) => (v === '' ? null : v), z.string().trim().max(60).nullable()),
  isVisible: z.boolean(),
  sortOrder: z.number().int().min(0).max(9999),
  contents: z.array(i18nSchema).min(1),
});

export const saveTagSchema = z.object({
  id: z.string().uuid().nullable(),
  slug: slugSchema,
  contents: z
    .array(z.object({ locale: z.enum(locales), name: z.string().trim().min(1).max(60) }))
    .min(1),
});

export const saveSeriesSchema = z.object({
  id: z.string().uuid().nullable(),
  slug: slugSchema,
  isVisible: z.boolean(),
  sortOrder: z.number().int().min(0).max(9999),
  contents: z
    .array(
      z.object({
        locale: z.enum(locales),
        title: z.string().trim().min(1, '標題不可為空').max(120),
        description: z.preprocess(
          (value) => (value === '' ? null : value),
          z.string().trim().max(300).nullable(),
        ),
      }),
    )
    .min(1),
});

export type SaveCategoryInput = z.infer<typeof saveCategorySchema>;
export type SaveTagInput = z.infer<typeof saveTagSchema>;
export type SaveSeriesInput = z.infer<typeof saveSeriesSchema>;
