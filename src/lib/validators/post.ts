import { z } from 'zod';

import { locales } from '@/lib/i18n/config';
import { httpUrl, linkTarget } from '@/lib/validators/url';

export const postStatuses = ['draft', 'published', 'unlisted', 'archived'] as const;

/** slug 允許中文：舊站的文章沿用原本的網址，其中有非 ASCII 的路徑。 */
const slugSchema = z
  .string()
  .trim()
  .min(1, 'slug 不可為空')
  .max(120)
  .regex(/^[^\s/?#[\]@!$&'()*+,;=]+$/, 'slug 不可含空白或網址保留字元');

const emptyToNull = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((value) => (value === '' ? null : value), schema.nullable());

export const postContentSchema = z.object({
  locale: z.enum(locales),
  title: z.string().trim().min(1, '標題不可為空').max(200),
  subtitle: emptyToNull(z.string().trim().max(300)),
  excerpt: emptyToNull(z.string().trim().max(500)),
  contentMd: z.string().max(500_000),
  seoTitle: emptyToNull(z.string().trim().max(200)),
  seoDescription: emptyToNull(z.string().trim().max(400)),
});

export const savePostSchema = z.object({
  id: z.string().uuid().nullable(),
  slug: slugSchema,
  status: z.enum(postStatuses),
  publishedAt: emptyToNull(z.string()),
  coverUrl: emptyToNull(z.string().max(500).pipe(linkTarget)),
  // canonical 依定義必須是絕對網址，站內路徑對搜尋引擎沒有意義。
  canonicalUrl: emptyToNull(z.string().max(500).pipe(httpUrl)),
  isPinned: z.boolean(),
  isFeatured: z.boolean(),
  allowComments: z.boolean(),
  seriesId: emptyToNull(z.string().uuid()),
  seriesOrder: z.number().int().min(0).max(9999).nullable(),
  categoryIds: z.array(z.string().uuid()).min(1, '至少要選一個分類'),
  primaryCategoryId: z.string().uuid(),
  tagIds: z.array(z.string().uuid()).max(30),
  contents: z.array(postContentSchema).min(1),
});

export type SavePostInput = z.infer<typeof savePostSchema>;
export type PostContentInput = z.infer<typeof postContentSchema>;

/**
 * 主分類必須在所選分類之內（規格 §6.3：每篇恰有一個 is_primary）。
 * 分開檢查而非寫進 schema，錯誤訊息才能明確指向這個欄位。
 */
export function validatePrimaryCategory(input: SavePostInput): string | null {
  if (!input.categoryIds.includes(input.primaryCategoryId)) {
    return '主分類必須是已選分類的其中一個';
  }
  return null;
}
