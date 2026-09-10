import { z } from 'zod';

import { locales } from '@/lib/i18n/config';
import { httpUrl } from '@/lib/validators/url';

export const projectStatuses = [
  'idea',
  'in_progress',
  'completed',
  'maintained',
  'archived',
] as const;

export const projectLinkTypes = [
  'demo',
  'github',
  'appstore',
  'playstore',
  'docs',
  'video',
  'article',
  'other',
] as const;

const nullable = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((value) => (value === '' ? null : value), schema.nullable());

export const projectContentSchema = z.object({
  locale: z.enum(locales),
  name: z.string().trim().min(1, '名稱不可為空').max(200),
  tagline: nullable(z.string().trim().max(300)),
  summary: nullable(z.string().trim().max(1000)),
  contentMd: z.string().max(500_000),
  role: nullable(z.string().trim().max(200)),
  seoTitle: nullable(z.string().trim().max(200)),
  seoDescription: nullable(z.string().trim().max(400)),
});

export const projectImageSchema = z.object({
  id: z.string().uuid().nullable(),
  url: z.string().trim().min(1).max(500),
  alt: z.string().trim().max(300),
  caption: z.string().trim().max(300),
  isCover: z.boolean(),
});

export const projectLinkSchema = z.object({
  id: z.string().uuid().nullable(),
  type: z.enum(projectLinkTypes),
  // 這個值會直接變成前台的 `href`，只接受 http/https。
  url: z.string().max(500).pipe(httpUrl),
  label: z.string().trim().min(1, '連結需要標籤').max(80),
});

export const saveProjectSchema = z.object({
  id: z.string().uuid().nullable(),
  slug: z
    .string()
    .trim()
    .min(1, 'slug 不可為空')
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug 只能是小寫英數與連字號'),
  status: z.enum(projectStatuses),
  startedAt: z.string().min(1, '開始日期必填'),
  endedAt: nullable(z.string()),
  categoryId: nullable(z.string().uuid()),
  organizationId: nullable(z.string().uuid()),
  coverUrl: nullable(z.string().trim().max(500)),
  // GitHub repo 存的是 `owner/repo`，不是網址；限成這個形狀免得被塞進別的東西。
  githubRepo: nullable(
    z
      .string()
      .trim()
      .max(200)
      .regex(/^[\w.-]+\/[\w.-]+$/, 'GitHub repo 需為 owner/repo 格式'),
  ),
  isFeatured: z.boolean(),
  isVisible: z.boolean(),
  allowComments: z.boolean(),
  sortOrder: z.number().int().min(0).max(9999),
  metrics: z.record(z.string(), z.string()),
  tagIds: z.array(z.string().uuid()).max(30),
  // 規格 §6.4：最多 10 張。DB 也有 trigger 擋，這裡先擋是為了給出可讀的錯誤。
  images: z.array(projectImageSchema).max(10, '每個專案最多 10 張圖片'),
  links: z.array(projectLinkSchema).max(20),
  relatedPostIds: z.array(z.string().uuid()).max(20),
  contents: z.array(projectContentSchema).min(1),
});

export type SaveProjectInput = z.infer<typeof saveProjectSchema>;
export type ProjectImageInput = z.infer<typeof projectImageSchema>;
export type ProjectLinkInput = z.infer<typeof projectLinkSchema>;
