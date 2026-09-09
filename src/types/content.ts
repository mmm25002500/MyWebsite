import type { Locale } from '@/lib/i18n/config';

export type { Locale };

export interface TocItem {
  id: string;
  text: string;
  depth: number;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  sortOrder: number;
  postCount: number;
}

export interface Tag {
  id: string;
  slug: string;
  name: string;
  color: string | null;
  postCount: number;
  projectCount: number;
}

export interface Series {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  coverUrl: string | null;
  postCount: number;
}

export type PostStatus = 'draft' | 'published' | 'unlisted' | 'archived';

export interface PostSummary {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  excerpt: string | null;
  coverUrl: string | null;
  publishedAt: string | null;
  updatedAt: string | null;
  readingTimeMin: number;
  viewCount: number;
  commentCount: number;
  likeCount: number;
  isPinned: boolean;
  categories: Category[];
  primaryCategorySlug: string | null;
  tags: Tag[];
  availableLocales: Locale[];
}

export interface Post extends PostSummary {
  contentHtml: string;
  toc: TocItem[];
  seriesId: string | null;
  seriesOrder: number | null;
  allowComments: boolean;
  canonicalUrl: string | null;
  ogImageUrl: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  wordCount: number;
}

export type ProjectStatus = 'idea' | 'in_progress' | 'completed' | 'maintained' | 'archived';

export interface ProjectImage {
  id: string;
  url: string;
  thumbnailUrl: string | null;
  width: number | null;
  height: number | null;
  alt: string | null;
  caption: string | null;
  isCover: boolean;
}

export type ProjectLinkType =
  'demo' | 'github' | 'appstore' | 'playstore' | 'docs' | 'video' | 'article' | 'other';

export interface ProjectLink {
  id: string;
  type: ProjectLinkType;
  url: string;
  label: string;
  icon: string | null;
}

export interface ProjectSummary {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  summary: string | null;
  coverUrl: string | null;
  status: ProjectStatus;
  startedAt: string;
  endedAt: string | null;
  isFeatured: boolean;
  categorySlug: string | null;
  categoryName: string | null;
  organizationSlug: string | null;
  organizationName: string | null;
  tags: Tag[];
  stars: number | null;
  forks: number | null;
  primaryLanguage: string | null;
  githubRepo: string | null;
  viewCount: number;
}

export interface Project extends ProjectSummary {
  contentHtml: string;
  toc: TocItem[];
  role: string | null;
  metrics: Record<string, string>;
  images: ProjectImage[];
  links: ProjectLink[];
  relatedPosts: PostSummary[];
  seoTitle: string | null;
  seoDescription: string | null;
  allowComments: boolean;
}

export type OrganizationStatus = 'active' | 'ended' | 'reviving';

export interface Organization {
  id: string;
  slug: string;
  name: string;
  role: string;
  descriptionHtml: string | null;
  logoUrl: string | null;
  websiteUrl: string | null;
  githubOrg: string | null;
  startedAt: string | null;
  endedAt: string | null;
  status: OrganizationStatus;
}

export type EmploymentType = 'full_time' | 'founder' | 'freelance' | 'part_time' | 'intern';

export interface Experience {
  id: string;
  companyName: string;
  showCompanyName: boolean;
  title: string;
  location: string | null;
  employmentType: EmploymentType;
  startedAt: string;
  endedAt: string | null;
  isCurrent: boolean;
  highlights: string[];
  tech: string[];
  logoUrl: string | null;
  url: string | null;
  organizationSlug: string | null;
}

export interface Education {
  id: string;
  school: string;
  degree: string | null;
  field: string | null;
  description: string | null;
  startedAt: string;
  endedAt: string | null;
  isCurrent: boolean;
  logoUrl: string | null;
}

export interface Skill {
  id: string;
  name: string;
  level: number | null;
  years: number | null;
  isPrimary: boolean;
  showOnHome: boolean;
}

export interface SkillGroup {
  id: string;
  key: string;
  name: string;
  description: string | null;
  icon: string | null;
  skills: Skill[];
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  description: string | null;
  issuedAt: string | null;
  credentialUrl: string | null;
}

export type LanguageProficiency = 'native' | 'fluent' | 'intermediate' | 'basic';

export interface SpokenLanguage {
  id: string;
  code: string;
  name: string;
  proficiency: LanguageProficiency;
  note: string | null;
}

export interface Interest {
  id: string;
  title: string;
  description: string | null;
  icon: string | null;
}

export type TimelineBranch = 'up' | 'down';
export type TimelineType = 'startup' | 'education' | 'career' | 'project' | 'milestone' | 'life';

export interface TimelineEvent {
  id: string;
  eventDate: string;
  endDate: string | null;
  branch: TimelineBranch;
  type: TimelineType;
  title: string;
  subtitle: string | null;
  description: string | null;
  icon: string | null;
  color: string | null;
  imageUrl: string | null;
  linkUrl: string | null;
  isMilestone: boolean;
}

export interface VideoItem {
  youtubeId: string;
  title: string;
  description: string;
  publishedAt: string;
  viewCount: number;
  durationSeconds: number;
  thumbnailUrl: string;
  category: string | null;
  isFeatured: boolean;
}

export interface LinkButton {
  id: string;
  label: string;
  description: string | null;
  url: string;
  imageUrl: string | null;
  icon: string | null;
  bgColor: string | null;
  textColor: string | null;
  isHighlighted: boolean;
}

export interface LinkGroup {
  id: string;
  key: string;
  name: string;
  buttons: LinkButton[];
}

export interface SponsorMethod {
  id: string;
  key: string;
  type: 'crypto' | 'link';
  label: string;
  note: string | null;
  addressOrUrl: string;
  qrImageUrl: string | null;
  network: string | null;
  icon: string | null;
}

export interface SponsorEntry {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  url: string | null;
  tier: 'bronze' | 'silver' | 'gold' | 'custom';
  amountNote: string | null;
  message: string | null;
  sponsoredAt: string | null;
  isAnonymous: boolean;
}

export interface ChangelogEntry {
  id: string;
  version: string;
  releasedAt: string;
  title: string;
  items: string[];
}

export interface SocialLink {
  key: string;
  label: string;
  url: string;
  icon: string;
}

export interface StaticPage {
  slug: string;
  title: string;
  contentHtml: string;
  toc: TocItem[];
  seoTitle: string | null;
  seoDescription: string | null;
  updatedAt: string | null;
}

export interface SiteStats {
  repoCount: number;
  starCount: number;
  postCount: number;
  projectCount: number;
  subscriberCount: number;
}

export interface HomeSection {
  key:
    | 'hero'
    | 'stats'
    | 'featured_projects'
    | 'latest_posts'
    | 'skills'
    | 'organizations'
    | 'videos'
    | 'contact';
  isVisible: boolean;
  sortOrder: number;
  config: Record<string, unknown>;
  title: string | null;
  subtitle: string | null;
}

export interface SiteSettings {
  showCompanyName: boolean;
  showCertifications: boolean;
  enableThreeBackground: boolean;
  commentModeration: boolean;
  heroTagline: string;
  contactEmail: string;
  socialLinks: SocialLink[];
}

export interface SearchResult {
  type: 'post' | 'project' | 'page';
  id: string;
  slug: string;
  title: string;
  snippet: string;
  score: number;
  date: string | null;
  categories: string[];
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
