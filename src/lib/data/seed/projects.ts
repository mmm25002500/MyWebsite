import { findTags } from '@/lib/data/seed/taxonomy';
import type { Locale, Project, ProjectLinkType, ProjectStatus } from '@/types/content';

/** 作品集 seed。示範資料，實際內容存在 Supabase（見 `seed/site.ts` 的說明）。 */

type L<T> = Record<Locale, T>;

const projects: {
  slug: string;
  name: L<string>;
  tagline: L<string>;
  summary: L<string>;
  content: L<string>;
  status: ProjectStatus;
  startedAt: string;
  endedAt: string | null;
  isFeatured: boolean;
  categorySlug: string | null;
  category: L<string | null>;
  organizationSlug: string | null;
  organizationName: L<string> | null;
  role: L<string> | null;
  tech: string[];
  githubRepo: string | null;
  links: { type: ProjectLinkType; url: string; label: L<string> }[];
}[] = [
  {
    slug: 'demo-project',
    name: { 'zh-TW': '示範專案', en: 'Demo Project' },
    tagline: {
      'zh-TW': '用來確認作品集版面的示範資料。',
      en: 'Placeholder data for checking the project layout.',
    },
    summary: {
      'zh-TW': '實際的作品集內容由後台維護，存在資料庫裡。',
      en: 'Real project content is maintained in the CMS and lives in the database.',
    },
    content: {
      'zh-TW': '## 說明\n\n這是示範內容。\n\n- 條列一\n- 條列二\n',
      en: '## About\n\nThis is placeholder content.\n\n- Item one\n- Item two\n',
    },
    status: 'in_progress',
    startedAt: '2024-01-01',
    endedAt: null,
    isFeatured: true,
    categorySlug: 'tech',
    category: { 'zh-TW': '技術', en: 'Tech' },
    organizationSlug: 'demo-team',
    organizationName: { 'zh-TW': '示範團隊', en: 'Demo Team' },
    role: { 'zh-TW': '開發', en: 'Developer' },
    tech: ['TypeScript', 'Next.js'],
    githubRepo: null,
    links: [
      {
        type: 'demo',
        url: 'https://example.com/demo',
        label: { 'zh-TW': '線上展示', en: 'Live demo' },
      },
    ],
  },
];

export function seedProjects(locale: Locale): Project[] {
  return projects.map((project) => ({
    id: `project-${project.slug}`,
    slug: project.slug,
    name: project.name[locale],
    tagline: project.tagline[locale],
    summary: project.summary[locale],
    contentHtml: '',
    toc: [],
    coverUrl: null,
    status: project.status,
    startedAt: project.startedAt,
    endedAt: project.endedAt,
    isFeatured: project.isFeatured,
    categorySlug: project.categorySlug,
    categoryName: project.category[locale],
    organizationSlug: project.organizationSlug,
    organizationName: project.organizationName ? project.organizationName[locale] : null,
    tags: findTags(project.tech),
    stars: null,
    forks: null,
    primaryLanguage: null,
    githubRepo: project.githubRepo,
    viewCount: 0,
    role: project.role ? project.role[locale] : null,
    metrics: {},
    images: [],
    links: project.links.map((link, linkIndex) => ({
      id: `project-${project.slug}-link-${linkIndex}`,
      type: link.type,
      url: link.url,
      label: link.label[locale],
      icon: null,
    })),
    relatedPosts: [],
    seoTitle: null,
    seoDescription: null,
    allowComments: false,
  }));
}

/** 專案 Markdown 原文，供渲染管線在 seed 模式下即時轉成 HTML。 */
export function seedProjectMarkdown(slug: string, locale: Locale): string | null {
  const project = projects.find((item) => item.slug === slug);
  return project ? project.content[locale] : null;
}
