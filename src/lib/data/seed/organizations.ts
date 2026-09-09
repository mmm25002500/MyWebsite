import type { Locale, Organization } from '@/types/content';

/** 團隊 seed。示範資料，實際內容存在 Supabase（見 `seed/site.ts` 的說明）。 */

type L<T> = Record<Locale, T>;

const organizations: {
  slug: string;
  name: L<string>;
  role: L<string>;
  description: L<string>;
  status: Organization['status'];
  startedAt: string;
  endedAt: string | null;
}[] = [
  {
    slug: 'demo-team',
    name: { 'zh-TW': '示範團隊', en: 'Demo Team' },
    role: { 'zh-TW': '成員', en: 'Member' },
    description: {
      'zh-TW': '這是示範資料。實際的團隊資料由後台維護。',
      en: 'Placeholder data. Real teams are maintained in the CMS.',
    },
    status: 'active',
    startedAt: '2024-01-01',
    endedAt: null,
  },
];

export function seedOrganizations(locale: Locale): Organization[] {
  return organizations.map((organization) => ({
    id: `org-${organization.slug}`,
    slug: organization.slug,
    name: organization.name[locale],
    role: organization.role[locale],
    descriptionHtml: `<p>${organization.description[locale]}</p>`,
    logoUrl: null,
    websiteUrl: null,
    githubOrg: null,
    startedAt: organization.startedAt,
    endedAt: organization.endedAt,
    status: organization.status,
  }));
}
