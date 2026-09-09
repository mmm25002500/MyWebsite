import { unstable_cache } from 'next/cache';

import { usingSeed } from './source';

/**
 * 跨請求的查詢快取（規格 §12.1）。
 *
 * `react.cache()` 只在單一請求內去重，因此每次 ISR 重新產生頁面都會重打
 * Supabase。這一層把結果存進 Next.js 的 Data Cache，後台儲存時以 tag 精準失效。
 *
 * seed 模式直接跳過：資料本來就在記憶體裡，包一層快取只會增加複雜度。
 */
export function cached<Args extends unknown[], Result>(
  keyParts: string[],
  fn: (...args: Args) => Promise<Result>,
  options: { tags: string[]; revalidate?: number },
): (...args: Args) => Promise<Result> {
  if (usingSeed) return fn;

  return unstable_cache(fn, keyParts, {
    tags: options.tags,
    revalidate: options.revalidate ?? 3600,
  });
}

/** 快取 tag。後台儲存後呼叫 `/api/revalidate` 時使用同一組名稱。 */
export const cacheTags = {
  posts: 'posts',
  post: (slug: string) => `post:${slug}`,
  projects: 'projects',
  project: (slug: string) => `project:${slug}`,
  taxonomy: 'taxonomy',
  resume: 'resume',
  site: 'site',
  timeline: 'timeline',
  pages: 'pages',
} as const;
