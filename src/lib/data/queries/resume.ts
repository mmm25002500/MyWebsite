import { cacheTags, cached } from '@/lib/data/cache';

import {
  beliefs,
  seedCertifications,
  seedEducation,
  seedExperiences,
  seedInterests,
  seedLanguages,
  seedSkillGroups,
  summaryText,
  traits,
} from '@/lib/data/seed/resume';
import { publicClient, rows, usingSeed } from '@/lib/data/source';
import type { Locale } from '@/lib/i18n/config';
import type {
  Certification,
  Education,
  Experience,
  Interest,
  SkillGroup,
  SpokenLanguage,
} from '@/types/content';

export const getExperiences = cached(['getExperiences'], async (locale: Locale): Promise<Experience[]> => {
  if (usingSeed) return seedExperiences(locale);

  const { data, error } = await publicClient()
    .from('experiences')
    .select(
      'id, employment_type, started_at, ended_at, is_current, logo_url, url, show_company_name, sort_order, organizations(slug), experiences_i18n!inner(company_name, title, location, highlights, tech, locale)',
    )
    .eq('is_visible', true)
    .eq('experiences_i18n.locale', locale)
    .order('sort_order');
  if (error) throw new Error(`[data] experiences: ${error.message}`);

  return rows<{
    id: string;
    employment_type: Experience['employmentType'];
    started_at: string;
    ended_at: string | null;
    is_current: boolean;
    logo_url: string | null;
    url: string | null;
    show_company_name: boolean;
    organizations: { slug: string } | null;
    experiences_i18n: {
      company_name: string;
      title: string;
      location: string | null;
      highlights: string[] | null;
      tech: string[] | null;
    }[];
  }>(data).map((row) => {
    const i18n = row.experiences_i18n[0];
    return {
      id: row.id,
      companyName: i18n?.company_name ?? '',
      showCompanyName: row.show_company_name,
      title: i18n?.title ?? '',
      location: i18n?.location ?? null,
      employmentType: row.employment_type,
      startedAt: row.started_at,
      endedAt: row.ended_at,
      isCurrent: row.is_current,
      highlights: i18n?.highlights ?? [],
      tech: i18n?.tech ?? [],
      logoUrl: row.logo_url,
      url: row.url,
      organizationSlug: row.organizations?.slug ?? null,
    };
  });
}, { tags: [cacheTags.resume] });

export const getEducation = cached(['getEducation'], async (locale: Locale): Promise<Education[]> => {
  if (usingSeed) return seedEducation(locale);

  const { data, error } = await publicClient()
    .from('education')
    .select(
      'id, started_at, ended_at, is_current, logo_url, sort_order, education_i18n!inner(school, degree, field, description_md, locale)',
    )
    .eq('is_visible', true)
    .eq('education_i18n.locale', locale)
    .order('sort_order');
  if (error) throw new Error(`[data] education: ${error.message}`);

  return rows<{
    id: string;
    started_at: string;
    ended_at: string | null;
    is_current: boolean;
    logo_url: string | null;
    education_i18n: {
      school: string;
      degree: string | null;
      field: string | null;
      description_md: string | null;
    }[];
  }>(data).map((row) => {
    const i18n = row.education_i18n[0];
    return {
      id: row.id,
      school: i18n?.school ?? '',
      degree: i18n?.degree ?? null,
      field: i18n?.field ?? null,
      description: i18n?.description_md ?? null,
      startedAt: row.started_at,
      endedAt: row.ended_at,
      isCurrent: row.is_current,
      logoUrl: row.logo_url,
    };
  });
}, { tags: [cacheTags.resume] });

export const getSkillGroups = cached(['getSkillGroups'], async (locale: Locale): Promise<SkillGroup[]> => {
  if (usingSeed) return seedSkillGroups(locale);

  const { data, error } = await publicClient()
    .from('skill_groups')
    .select(
      'id, key, icon, sort_order, skill_groups_i18n!inner(name, description, locale), skills(id, name, level, years, is_primary, show_on_home, sort_order, is_visible)',
    )
    .eq('is_visible', true)
    .eq('skill_groups_i18n.locale', locale)
    .order('sort_order');
  if (error) throw new Error(`[data] skill_groups: ${error.message}`);

  return rows<{
    id: string;
    key: string;
    icon: string | null;
    skill_groups_i18n: { name: string; description: string | null }[];
    skills:
      | {
          id: string;
          name: string;
          level: number | null;
          years: number | null;
          is_primary: boolean;
          show_on_home: boolean;
          sort_order: number;
          is_visible: boolean;
        }[]
      | null;
  }>(data).map((row) => ({
    id: row.id,
    key: row.key,
    name: row.skill_groups_i18n[0]?.name ?? row.key,
    description: row.skill_groups_i18n[0]?.description ?? null,
    icon: row.icon,
    skills: (row.skills ?? [])
      .filter((skill) => skill.is_visible)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((skill) => ({
        id: skill.id,
        name: skill.name,
        level: skill.level,
        years: skill.years,
        isPrimary: skill.is_primary,
        showOnHome: skill.show_on_home,
      })),
  }));
}, { tags: [cacheTags.resume] });

/** 首頁只顯示 `show_on_home` 的技能，且略過整組都沒被勾選的分組。 */
export const getHomeSkillGroups = cached(['getHomeSkillGroups'], async (locale: Locale): Promise<SkillGroup[]> => {
  const groups = await getSkillGroups(locale);
  return groups
    .map((group) => ({ ...group, skills: group.skills.filter((skill) => skill.showOnHome) }))
    .filter((group) => group.skills.length > 0);
}, { tags: [cacheTags.resume] });

export const getCertifications = cached(['getCertifications'], async (locale: Locale): Promise<Certification[]> => {
  if (usingSeed) return seedCertifications(locale);

  const { data, error } = await publicClient()
    .from('certifications')
    .select(
      'id, issued_at, credential_url, sort_order, certifications_i18n!inner(name, issuer, description, locale)',
    )
    .eq('is_visible', true)
    .eq('certifications_i18n.locale', locale)
    .order('sort_order');
  if (error) throw new Error(`[data] certifications: ${error.message}`);

  return rows<{
    id: string;
    issued_at: string | null;
    credential_url: string | null;
    certifications_i18n: { name: string; issuer: string; description: string | null }[];
  }>(data).map((row) => ({
    id: row.id,
    name: row.certifications_i18n[0]?.name ?? '',
    issuer: row.certifications_i18n[0]?.issuer ?? '',
    description: row.certifications_i18n[0]?.description ?? null,
    issuedAt: row.issued_at,
    credentialUrl: row.credential_url,
  }));
}, { tags: [cacheTags.resume] });

export const getLanguages = cached(['getLanguages'], async (locale: Locale): Promise<SpokenLanguage[]> => {
  if (usingSeed) return seedLanguages(locale);

  const { data, error } = await publicClient()
    .from('languages_spoken')
    .select('id, code, proficiency, sort_order, languages_spoken_i18n!inner(name, note, locale)')
    .eq('is_visible', true)
    .eq('languages_spoken_i18n.locale', locale)
    .order('sort_order');
  if (error) throw new Error(`[data] languages_spoken: ${error.message}`);

  return rows<{
    id: string;
    code: string;
    proficiency: SpokenLanguage['proficiency'];
    languages_spoken_i18n: { name: string; note: string | null }[];
  }>(data).map((row) => ({
    id: row.id,
    code: row.code,
    name: row.languages_spoken_i18n[0]?.name ?? row.code,
    proficiency: row.proficiency,
    note: row.languages_spoken_i18n[0]?.note ?? null,
  }));
}, { tags: [cacheTags.resume] });

export const getInterests = cached(['getInterests'], async (locale: Locale): Promise<Interest[]> => {
  if (usingSeed) return seedInterests(locale);

  const { data, error } = await publicClient()
    .from('interests')
    .select('id, icon, sort_order, interests_i18n!inner(title, description, locale)')
    .eq('is_visible', true)
    .eq('interests_i18n.locale', locale)
    .order('sort_order');
  if (error) throw new Error(`[data] interests: ${error.message}`);

  return rows<{
    id: string;
    icon: string | null;
    interests_i18n: { title: string; description: string | null }[];
  }>(data).map((row) => ({
    id: row.id,
    title: row.interests_i18n[0]?.title ?? '',
    description: row.interests_i18n[0]?.description ?? null,
    icon: row.icon,
  }));
}, { tags: [cacheTags.resume] });

/** 簡介、座右銘與特質標籤目前僅有 seed 版本，後台上線後改由 `pages` 提供。 */
export function getProfileCopy(locale: Locale) {
  return {
    summary: summaryText[locale],
    beliefs: beliefs[locale],
    traits: traits[locale],
  };
}
