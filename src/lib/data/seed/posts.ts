import type { Locale } from '@/types/content';

/** 筆記 seed。示範資料，實際內容存在 Supabase（見 `seed/site.ts` 的說明）。 */

export interface PostSeed {
  slug: string;
  categories: string[];
  primaryCategory: string;
  tags: string[];
  publishedAt: string;
  updatedAt: string | null;
  isPinned: boolean;
  isFeatured: boolean;
  seriesSlug: string | null;
  seriesOrder: number | null;
  viewCount: number;
  likeCount: number;
  i18n: Partial<
    Record<Locale, { title: string; subtitle: string | null; excerpt: string; markdown: string }>
  >;
}

export const seedSeries: {
  slug: string;
  title: Record<Locale, string>;
  description: Record<Locale, string>;
}[] = [
  {
    slug: 'demo-series',
    title: { 'zh-TW': '示範系列', en: 'Demo series' },
    description: {
      'zh-TW': '用來確認系列文版面的示範資料。',
      en: 'Placeholder data for checking the series layout.',
    },
  },
];

const demoMarkdown = {
  'zh-TW': `這是示範文章，用來確認閱讀頁的版面。實際的文章存在 Supabase，由後台維護。

## 段落標題

一段內文，包含 \`行內程式碼\` 與[連結](https://example.com)。

- 條列一
- 條列二

\`\`\`ts
export function hello(name: string) {
  return \`Hello, \${name}\`;
}
\`\`\`
`,
  en: `This is a placeholder note for checking the reading layout. Real posts live in Supabase and are maintained in the CMS.

## A heading

A paragraph with \`inline code\` and a [link](https://example.com).

- Item one
- Item two

\`\`\`ts
export function hello(name: string) {
  return \`Hello, \${name}\`;
}
\`\`\`
`,
};

export const seedPosts: PostSeed[] = [
  {
    slug: 'demo-note',
    categories: ['tech'],
    primaryCategory: 'tech',
    tags: ['TypeScript', 'Next.js'],
    publishedAt: '2024-01-01',
    updatedAt: null,
    isPinned: false,
    isFeatured: true,
    seriesSlug: 'demo-series',
    seriesOrder: 1,
    viewCount: 0,
    likeCount: 0,
    i18n: {
      'zh-TW': {
        title: '示範筆記',
        subtitle: '沒有設定 Supabase 憑證時看到的內容',
        excerpt: '這是示範文章，用來確認閱讀頁的版面。',
        markdown: demoMarkdown['zh-TW'],
      },
      en: {
        title: 'Demo note',
        subtitle: 'What you see without Supabase configured',
        excerpt: 'A placeholder note for checking the reading layout.',
        markdown: demoMarkdown.en,
      },
    },
  },
];
