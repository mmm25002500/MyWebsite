import type { Category, Locale, Tag } from '@/types/content';

type L<T> = Record<Locale, T>;

const categories: { slug: string; name: L<string>; description: L<string>; icon: string }[] = [
  {
    slug: 'tech',
    name: { 'zh-TW': '技術', en: 'Tech' },
    description: { 'zh-TW': '前端、後端、DevOps、Linux', en: 'Frontend, backend, DevOps, Linux' },
    icon: 'code',
  },
  {
    slug: 'blockchain',
    name: { 'zh-TW': '區塊鏈', en: 'Blockchain' },
    description: {
      'zh-TW': '智能合約、鏈上資料、交易所 API',
      en: 'Smart contracts, on-chain data, exchange APIs',
    },
    icon: 'currency-btc',
  },
  {
    slug: 'security',
    name: { 'zh-TW': '資安', en: 'Security' },
    description: {
      'zh-TW': '資訊安全、滲透測試、2FA',
      en: 'Information security, pentesting, 2FA',
    },
    icon: 'shield-check',
  },
  {
    slug: 'algorithm',
    name: { 'zh-TW': '演算法', en: 'Algorithm' },
    description: { 'zh-TW': 'LeetCode、資料結構', en: 'LeetCode, data structures' },
    icon: 'tree-structure',
  },
  {
    slug: 'case-study',
    name: { 'zh-TW': '專案實錄', en: 'Case Study' },
    description: {
      'zh-TW': '問題→限制→做法→成果',
      en: 'Problem → constraints → approach → outcome',
    },
    icon: 'presentation-chart',
  },
  {
    slug: 'life',
    name: { 'zh-TW': '人生', en: 'Life' },
    description: { 'zh-TW': '創業、心路歷程', en: 'Founding things, and what it felt like' },
    icon: 'compass',
  },
  {
    slug: 'reading',
    name: { 'zh-TW': '讀書筆記', en: 'Reading' },
    description: { 'zh-TW': '書摘與心得', en: 'Book notes and takeaways' },
    icon: 'book-open',
  },
  {
    slug: 'til',
    name: { 'zh-TW': '短筆記', en: 'TIL' },
    description: { 'zh-TW': '今天學到什麼', en: 'Today I learned' },
    icon: 'lightbulb',
  },
];

export function seedCategories(locale: Locale): Category[] {
  return categories.map((category, index) => ({
    id: `cat-${category.slug}`,
    slug: category.slug,
    name: category.name[locale],
    description: category.description[locale],
    icon: category.icon,
    color: null,
    sortOrder: index,
    postCount: 0,
  }));
}

/** 標籤名稱不翻譯（規格 §14.2：技術名詞維持原文）。 */
const tagNames = [
  'React',
  'Next.js',
  'TypeScript',
  'Tailwind',
  'React Native',
  'Flutter',
  'Node.js',
  'Python',
  'C#',
  'Supabase',
  'Firebase',
  'PostgreSQL',
  'Docker',
  'Linux',
  'Solidity',
  'Move',
  'Cardano',
  'TON',
  'Bitcoin',
  'Ethereum',
  '交易所API',
  '資安',
  'TOTP',
  'LeetCode',
  '創業',
  '接案',
  '效能優化',
  'Three.js',
  'GSAP',
];

export function tagSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/\./g, '')
    .replace(/[^a-z0-9一-鿿]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function seedTags(): Tag[] {
  return tagNames.map((name) => ({
    id: `tag-${tagSlug(name)}`,
    slug: tagSlug(name),
    name,
    color: null,
    postCount: 0,
    projectCount: 0,
  }));
}

export function findTags(names: readonly string[]): Tag[] {
  const all = seedTags();
  return names
    .map(
      (name) =>
        all.find((tag) => tag.name === name) ?? {
          id: `tag-${tagSlug(name)}`,
          slug: tagSlug(name),
          name,
          color: null,
          postCount: 0,
          projectCount: 0,
        },
    )
    .filter((tag): tag is Tag => Boolean(tag));
}
