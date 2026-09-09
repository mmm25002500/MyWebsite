import type {
  ChangelogEntry,
  HomeSection,
  LinkGroup,
  Locale,
  SiteSettings,
  SocialLink,
  SponsorEntry,
  SponsorMethod,
  VideoItem,
} from '@/types/content';

/**
 * 站台設定的 seed。
 *
 * 這裡的內容一律是示範資料，不放任何真實的個人資訊——正式內容存在 Supabase，
 * 由後台維護。seed 的用途只有一個：沒有設定 Supabase 憑證時（初次 clone、CI）
 * 前台仍然能完整渲染，讓人看得出每個區塊長什麼樣子。
 */

type L<T> = Record<Locale, T>;

export const heroTagline: L<string> = {
  'zh-TW': '這是示範資料。設定 Supabase 憑證後，這裡會換成後台維護的實際內容。',
  en: 'This is placeholder data. With Supabase configured, real content is served from the CMS.',
};

export const contactEmail = 'hello@example.com';

export const socialLinks: SocialLink[] = [
  { key: 'github', label: 'GitHub', url: 'https://example.com/github', icon: 'github-logo' },
  { key: 'youtube', label: 'YouTube', url: 'https://example.com/youtube', icon: 'youtube-logo' },
  { key: 'x', label: 'X', url: 'https://example.com/x', icon: 'x-logo' },
];

export const seedSettings: SiteSettings = {
  showCompanyName: true,
  showCertifications: false,
  enableThreeBackground: true,
  commentModeration: false,
  heroTagline: heroTagline['zh-TW'],
  contactEmail,
  socialLinks,
};

export function seedSiteSettings(locale: Locale): SiteSettings {
  return { ...seedSettings, heroTagline: heroTagline[locale] };
}

const homeSectionKeys: HomeSection['key'][] = [
  'hero',
  'stats',
  'featured_projects',
  'latest_posts',
  'skills',
  'organizations',
  'videos',
  'contact',
];

export function seedHomeSections(): HomeSection[] {
  return homeSectionKeys.map((key, index) => ({
    key,
    isVisible: true,
    sortOrder: index,
    config: {},
    title: null,
    subtitle: null,
  }));
}

const linkGroups: {
  key: string;
  name: L<string>;
  buttons: {
    label: L<string>;
    description?: L<string>;
    url: string;
    icon: string;
    highlighted?: boolean;
  }[];
}[] = [
  {
    key: 'social',
    name: { 'zh-TW': '社群', en: 'Social' },
    buttons: [
      {
        label: { 'zh-TW': 'GitHub', en: 'GitHub' },
        url: 'https://example.com/github',
        icon: 'github-logo',
      },
      {
        label: { 'zh-TW': 'YouTube', en: 'YouTube' },
        url: 'https://example.com/youtube',
        icon: 'youtube-logo',
      },
      {
        label: { 'zh-TW': 'X（Twitter）', en: 'X (Twitter)' },
        url: 'https://example.com/x',
        icon: 'x-logo',
      },
    ],
  },
  {
    key: 'projects',
    name: { 'zh-TW': '專案', en: 'Projects' },
    buttons: [
      {
        label: { 'zh-TW': '示範專案', en: 'Demo project' },
        description: { 'zh-TW': '示範用的專案連結', en: 'A placeholder project link' },
        url: 'https://example.com/project',
        icon: 'rocket-launch',
        highlighted: true,
      },
    ],
  },
];

export function seedLinkGroups(locale: Locale): LinkGroup[] {
  return linkGroups.map((group) => ({
    id: `link-group-${group.key}`,
    key: group.key,
    name: group.name[locale],
    buttons: group.buttons.map((button, index) => ({
      id: `link-${group.key}-${index}`,
      label: button.label[locale],
      description: button.description ? button.description[locale] : null,
      url: button.url,
      imageUrl: null,
      icon: button.icon,
      bgColor: null,
      textColor: null,
      isHighlighted: Boolean(button.highlighted),
    })),
  }));
}

const sponsorMethods: {
  key: string;
  type: SponsorMethod['type'];
  label: L<string>;
  note: L<string>;
  addressOrUrl: string;
  network: string | null;
  icon: string;
}[] = [
  {
    key: 'link',
    type: 'link',
    label: { 'zh-TW': '示範贊助連結', en: 'Placeholder sponsor link' },
    note: {
      'zh-TW': '實際的贊助方式與地址由後台設定。',
      en: 'Real sponsor methods and addresses are configured in the CMS.',
    },
    addressOrUrl: 'https://example.com/sponsor',
    network: null,
    icon: 'coffee',
  },
];

export function seedSponsorMethods(locale: Locale): SponsorMethod[] {
  return sponsorMethods.map((method) => ({
    id: `sponsor-method-${method.key}`,
    key: method.key,
    type: method.type,
    label: method.label[locale],
    note: method.note[locale],
    addressOrUrl: method.addressOrUrl,
    qrImageUrl: null,
    network: method.network,
    icon: method.icon,
  }));
}

export function seedSponsors(): SponsorEntry[] {
  return [];
}

export const sponsorPerks: L<string[]> = {
  'zh-TW': ['贊助者名單露出（可選匿名）。', '新文章與新專案的優先通知。'],
  en: [
    'A place on the sponsor list (anonymous if you prefer).',
    'Early notice on new notes and projects.',
  ],
};

export const sponsorIntro: L<string> = {
  'zh-TW': '這是示範文字。實際的贊助說明由後台維護。',
  en: 'Placeholder copy. The real sponsor page is maintained in the CMS.',
};

const changelog: { version: string; releasedAt: string; title: L<string>; items: L<string[]> }[] = [
  {
    version: 'v3.0.0',
    releasedAt: '2026-01-01',
    title: { 'zh-TW': '示範版本', en: 'Placeholder release' },
    items: {
      'zh-TW': ['更新日誌的實際內容由後台維護。'],
      en: ['The real changelog is maintained in the CMS.'],
    },
  },
];

export function seedChangelog(locale: Locale): ChangelogEntry[] {
  return changelog.map((entry) => ({
    id: `changelog-${entry.version}`,
    version: entry.version,
    releasedAt: entry.releasedAt,
    title: entry.title[locale],
    items: entry.items[locale],
  }));
}

export function seedVideos(): VideoItem[] {
  return [];
}
