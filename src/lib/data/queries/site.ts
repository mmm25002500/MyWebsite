import { cache } from 'react';

import {
  seedChangelog,
  seedHomeSections,
  seedLinkGroups,
  seedSiteSettings,
  seedSponsorMethods,
  seedSponsors,
  seedVideos,
} from '@/lib/data/seed/site';
import { seedOrganizations } from '@/lib/data/seed/organizations';
import { publicClient, rows, usingSeed } from '@/lib/data/source';
import type { Locale } from '@/lib/i18n/config';
import type {
  ChangelogEntry,
  HomeSection,
  LinkGroup,
  Organization,
  SiteSettings,
  SiteStats,
  SponsorEntry,
  SponsorMethod,
  VideoItem,
} from '@/types/content';

export const getSiteSettings = cache(async (locale: Locale): Promise<SiteSettings> => {
  if (usingSeed) return seedSiteSettings(locale);

  const { data, error } = await publicClient().from('site_settings').select('key, value');
  if (error) throw new Error(`[data] site_settings: ${error.message}`);

  const map = new Map(
    rows<{ key: string; value: unknown }>(data).map((row) => [row.key, row.value]),
  );
  const localized = (key: string, fallback: string): string => {
    const value = map.get(key) as Record<string, string> | undefined;
    return value?.[locale] ?? fallback;
  };
  const flag = (key: string, fallback: boolean): boolean => {
    const value = map.get(key);
    return typeof value === 'boolean' ? value : fallback;
  };

  const defaults = seedSiteSettings(locale);
  return {
    showCompanyName: flag('show_company_name', defaults.showCompanyName),
    showCertifications: flag('show_certifications', defaults.showCertifications),
    enableThreeBackground: flag('enable_three_background', defaults.enableThreeBackground),
    commentModeration: flag('comment_moderation', defaults.commentModeration),
    heroTagline: localized('hero', defaults.heroTagline),
    contactEmail: (map.get('contact_email') as string | undefined) ?? defaults.contactEmail,
    socialLinks:
      (map.get('social_links') as SiteSettings['socialLinks'] | undefined) ?? defaults.socialLinks,
  };
});

export const getHomeSections = cache(async (): Promise<HomeSection[]> => {
  if (usingSeed) return seedHomeSections();

  const { data, error } = await publicClient()
    .from('page_sections')
    .select('section_key, is_visible, sort_order, config')
    .eq('page_slug', 'home')
    .order('sort_order');
  if (error) throw new Error(`[data] page_sections: ${error.message}`);

  const sections = rows<{
    section_key: HomeSection['key'];
    is_visible: boolean;
    sort_order: number;
    config: Record<string, unknown> | null;
  }>(data).map((row) => ({
    key: row.section_key,
    isVisible: row.is_visible,
    sortOrder: row.sort_order,
    config: row.config ?? {},
    title: null,
    subtitle: null,
  }));

  return sections.length > 0 ? sections : seedHomeSections();
});

export const getOrganizations = cache(async (locale: Locale): Promise<Organization[]> => {
  if (usingSeed) return seedOrganizations(locale);

  const { data, error } = await publicClient()
    .from('organizations')
    .select(
      'id, slug, logo_url, website_url, github_org, started_at, ended_at, status, sort_order, organizations_i18n!inner(name, role, description_html, locale)',
    )
    .eq('is_visible', true)
    .eq('organizations_i18n.locale', locale)
    .order('sort_order');
  if (error) throw new Error(`[data] organizations: ${error.message}`);

  return rows<{
    id: string;
    slug: string;
    logo_url: string | null;
    website_url: string | null;
    github_org: string | null;
    started_at: string | null;
    ended_at: string | null;
    status: Organization['status'];
    organizations_i18n: { name: string; role: string; description_html: string | null }[];
  }>(data).map((row) => {
    const i18n = row.organizations_i18n[0];
    return {
      id: row.id,
      slug: row.slug,
      name: i18n?.name ?? row.slug,
      role: i18n?.role ?? '',
      descriptionHtml: i18n?.description_html ?? null,
      logoUrl: row.logo_url,
      websiteUrl: row.website_url,
      githubOrg: row.github_org,
      startedAt: row.started_at,
      endedAt: row.ended_at,
      status: row.status,
    };
  });
});

export const getOrganizationBySlug = cache(
  async (locale: Locale, slug: string): Promise<Organization | null> => {
    const all = await getOrganizations(locale);
    return all.find((org) => org.slug === slug) ?? null;
  },
);

export const getLinkGroups = cache(async (locale: Locale): Promise<LinkGroup[]> => {
  if (usingSeed) return seedLinkGroups(locale);

  const { data, error } = await publicClient()
    .from('link_groups')
    .select(
      'id, key, sort_order, link_groups_i18n!inner(name, locale), link_buttons(id, url, image_url, icon, bg_color, text_color, is_highlighted, sort_order, is_visible, link_buttons_i18n!inner(label, description, locale))',
    )
    .eq('is_visible', true)
    .eq('link_groups_i18n.locale', locale)
    .order('sort_order');
  if (error) throw new Error(`[data] link_groups: ${error.message}`);

  interface ButtonRow {
    id: string;
    url: string;
    image_url: string | null;
    icon: string | null;
    bg_color: string | null;
    text_color: string | null;
    is_highlighted: boolean;
    sort_order: number;
    is_visible: boolean;
    link_buttons_i18n: { label: string; description: string | null }[];
  }

  return rows<{
    id: string;
    key: string;
    link_groups_i18n: { name: string }[];
    link_buttons: ButtonRow[] | null;
  }>(data).map((row) => ({
    id: row.id,
    key: row.key,
    name: row.link_groups_i18n[0]?.name ?? row.key,
    buttons: (row.link_buttons ?? [])
      .filter((button) => button.is_visible)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((button) => ({
        id: button.id,
        label: button.link_buttons_i18n[0]?.label ?? '',
        description: button.link_buttons_i18n[0]?.description ?? null,
        url: button.url,
        imageUrl: button.image_url,
        icon: button.icon,
        bgColor: button.bg_color,
        textColor: button.text_color,
        isHighlighted: button.is_highlighted,
      })),
  }));
});

export const getSponsorMethods = cache(async (locale: Locale): Promise<SponsorMethod[]> => {
  if (usingSeed) return seedSponsorMethods(locale);

  const { data, error } = await publicClient()
    .from('sponsor_methods')
    .select(
      'id, key, type, address_or_url, qr_image_url, network, icon, sort_order, sponsor_methods_i18n!inner(label, note, locale)',
    )
    .eq('is_visible', true)
    .eq('sponsor_methods_i18n.locale', locale)
    .order('sort_order');
  if (error) throw new Error(`[data] sponsor_methods: ${error.message}`);

  return rows<{
    id: string;
    key: string;
    type: SponsorMethod['type'];
    address_or_url: string;
    qr_image_url: string | null;
    network: string | null;
    icon: string | null;
    sponsor_methods_i18n: { label: string; note: string | null }[];
  }>(data).map((row) => ({
    id: row.id,
    key: row.key,
    type: row.type,
    label: row.sponsor_methods_i18n[0]?.label ?? row.key,
    note: row.sponsor_methods_i18n[0]?.note ?? null,
    addressOrUrl: row.address_or_url,
    qrImageUrl: row.qr_image_url,
    network: row.network,
    icon: row.icon,
  }));
});

export const getSponsors = cache(async (locale: Locale): Promise<SponsorEntry[]> => {
  if (usingSeed) return seedSponsors();

  const { data, error } = await publicClient()
    .from('sponsors')
    .select(
      'id, display_name, avatar_url, url, tier, amount_note, sponsored_at, is_anonymous, sort_order, sponsors_i18n(message, locale)',
    )
    .eq('is_visible', true)
    .order('sort_order');
  if (error) throw new Error(`[data] sponsors: ${error.message}`);

  return rows<{
    id: string;
    display_name: string;
    avatar_url: string | null;
    url: string | null;
    tier: SponsorEntry['tier'];
    amount_note: string | null;
    sponsored_at: string | null;
    is_anonymous: boolean;
    sponsors_i18n: { message: string | null; locale: string }[] | null;
  }>(data).map((row) => ({
    id: row.id,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    url: row.url,
    tier: row.tier,
    amountNote: row.amount_note,
    message: (row.sponsors_i18n ?? []).find((item) => item.locale === locale)?.message ?? null,
    sponsoredAt: row.sponsored_at,
    isAnonymous: row.is_anonymous,
  }));
});

export const getChangelog = cache(async (locale: Locale): Promise<ChangelogEntry[]> => {
  if (usingSeed) return seedChangelog(locale);

  const { data, error } = await publicClient()
    .from('changelog_entries')
    .select(
      'id, version, released_at, sort_order, changelog_entries_i18n!inner(title, items, locale)',
    )
    .eq('is_visible', true)
    .eq('changelog_entries_i18n.locale', locale)
    .order('released_at', { ascending: false });
  if (error) throw new Error(`[data] changelog_entries: ${error.message}`);

  return rows<{
    id: string;
    version: string;
    released_at: string;
    changelog_entries_i18n: { title: string; items: string[] }[];
  }>(data).map((row) => ({
    id: row.id,
    version: row.version,
    releasedAt: row.released_at,
    title: row.changelog_entries_i18n[0]?.title ?? '',
    items: row.changelog_entries_i18n[0]?.items ?? [],
  }));
});

/**
 * 影片來自 YouTube Data API 的伺服器端代理（規格 §5.5），後台覆寫存在 `video_meta`。
 * 尚未設定 `YOUTUBE_API_KEY` 時回傳空陣列，頁面顯示空狀態而非報錯。
 */
export const getVideos = cache(async (): Promise<VideoItem[]> => {
  if (usingSeed) return seedVideos();

  const { data, error } = await publicClient()
    .from('video_meta')
    .select('youtube_id, category, is_featured, is_hidden, sort_order')
    .eq('is_hidden', false)
    .order('sort_order');
  if (error) throw new Error(`[data] video_meta: ${error.message}`);

  // 影片本體（標題、縮圖、觀看數）由 /api/youtube 代理提供；此處僅回傳覆寫設定，
  // 實際合併在 `/videos` 頁完成。
  return rows<{ youtube_id: string; category: string | null; is_featured: boolean }>(data).map(
    (row) => ({
      youtubeId: row.youtube_id,
      title: '',
      description: '',
      publishedAt: '',
      viewCount: 0,
      durationSeconds: 0,
      thumbnailUrl: '',
      category: row.category,
      isFeatured: row.is_featured,
    }),
  );
});

/** 首頁數據列。GitHub 與 YouTube 的數字來自快取代理，文章與專案數來自 DB。 */
export const getSiteStats = cache(async (locale: Locale): Promise<SiteStats> => {
  const [{ getPostCount }, { getProjectCount }] = await Promise.all([
    import('./posts'),
    import('./projects'),
  ]);

  const [postCount, projectCount] = await Promise.all([
    getPostCount(locale),
    getProjectCount(locale),
  ]);

  return { repoCount: 0, starCount: 0, postCount, projectCount, subscriberCount: 0 };
});
