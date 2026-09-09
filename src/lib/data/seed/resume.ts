import type {
  Certification,
  Education,
  Experience,
  Interest,
  Locale,
  SkillGroup,
  SpokenLanguage,
} from '@/types/content';

/** 履歷 seed。示範資料，實際內容存在 Supabase（見 `seed/site.ts` 的說明）。 */

type L<T> = Record<Locale, T>;

export const summaryText: L<string> = {
  'zh-TW': '這是示範用的自我介紹。實際的履歷內容由後台維護，存在資料庫裡。',
  en: 'Placeholder summary. The real résumé is maintained in the CMS and lives in the database.',
};

export const beliefs: L<string[]> = {
  'zh-TW': ['示範信念一。', '示範信念二。'],
  en: ['Placeholder belief one.', 'Placeholder belief two.'],
};

export const traits: L<string[]> = {
  'zh-TW': ['示範特質一', '示範特質二', '示範特質三'],
  en: ['Placeholder trait one', 'Placeholder trait two', 'Placeholder trait three'],
};

export function seedExperiences(locale: Locale): Experience[] {
  const zh = locale === 'zh-TW';
  return [
    {
      id: 'exp-demo',
      companyName: zh ? '示範公司' : 'Demo Company',
      showCompanyName: true,
      title: zh ? '軟體工程師' : 'Software Engineer',
      location: zh ? '遠端' : 'Remote',
      employmentType: 'full_time',
      startedAt: '2024-01-01',
      endedAt: null,
      isCurrent: true,
      highlights: zh
        ? ['示範重點一。', '示範重點二。']
        : ['Placeholder highlight one.', 'Placeholder highlight two.'],
      tech: ['TypeScript', 'React', 'PostgreSQL'],
      logoUrl: null,
      url: null,
      organizationSlug: 'demo-team',
    },
  ];
}

export function seedEducation(locale: Locale): Education[] {
  const zh = locale === 'zh-TW';
  return [
    {
      id: 'edu-demo',
      school: zh ? '示範學校' : 'Demo University',
      degree: zh ? '學士' : "Bachelor's",
      field: zh ? '資訊工程' : 'Computer Science',
      description: zh ? '示範用的學歷資料。' : 'Placeholder education entry.',
      startedAt: '2020-09-01',
      endedAt: '2024-06-30',
      isCurrent: false,
      logoUrl: null,
    },
  ];
}

export function seedSkillGroups(locale: Locale): SkillGroup[] {
  const zh = locale === 'zh-TW';
  const groups: { key: string; name: [string, string]; skills: string[] }[] = [
    { key: 'frontend', name: ['前端', 'Frontend'], skills: ['TypeScript', 'React', 'Next.js'] },
    { key: 'backend', name: ['後端', 'Backend'], skills: ['Node.js', 'PostgreSQL'] },
  ];

  return groups.map((group, groupIndex) => ({
    id: `skill-group-${group.key}`,
    key: group.key,
    name: zh ? group.name[0] : group.name[1],
    description: null,
    icon: null,
    skills: group.skills.map((name, index) => ({
      id: `skill-${group.key}-${index}`,
      name,
      level: 4,
      years: 3,
      isPrimary: index === 0,
      showOnHome: groupIndex === 0,
    })),
  }));
}

export function seedCertifications(locale: Locale): Certification[] {
  const zh = locale === 'zh-TW';
  return [
    {
      id: 'cert-demo',
      name: zh ? '示範證照' : 'Placeholder certification',
      issuer: zh ? '示範發證單位' : 'Demo Issuer',
      description: null,
      issuedAt: '2024-01-01',
      credentialUrl: null,
    },
  ];
}

export function seedLanguages(locale: Locale): SpokenLanguage[] {
  const zh = locale === 'zh-TW';
  return [
    {
      id: 'lang-zh',
      code: 'zh-TW',
      name: zh ? '中文' : 'Chinese',
      proficiency: 'native',
      note: null,
    },
    { id: 'lang-en', code: 'en', name: zh ? '英文' : 'English', proficiency: 'fluent', note: null },
  ];
}

export function seedInterests(locale: Locale): Interest[] {
  const zh = locale === 'zh-TW';
  return [
    {
      id: 'interest-demo',
      title: zh ? '示範興趣' : 'Placeholder interest',
      description: zh ? '實際內容由後台維護。' : 'Real content is maintained in the CMS.',
      icon: null,
    },
  ];
}
