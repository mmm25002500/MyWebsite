/**
 * 從 `src/lib/data/seed` 產生 `supabase/seed.sql`。
 *
 * seed 資料只有一份真實來源（TypeScript），SQL 由它產生，
 * 因此前台的 seed fallback 與資料庫的初始內容不會漂移。
 *
 *   pnpm seed:generate
 */
import { createHash } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';

import { renderMarkdown } from '../src/lib/content/markdown.js';
import { seedOrganizations } from '../src/lib/data/seed/organizations.js';
import { seedPosts, seedSeries } from '../src/lib/data/seed/posts.js';
import {
  seedCertifications,
  seedEducation,
  seedExperiences,
  seedInterests,
  seedLanguages,
  seedSkillGroups,
} from '../src/lib/data/seed/resume.js';
import {
  heroTagline,
  contactEmail,
  seedChangelog,
  seedLinkGroups,
  seedSponsorMethods,
  socialLinks,
} from '../src/lib/data/seed/site.js';
import { seedProjectMarkdown, seedProjects } from '../src/lib/data/seed/projects.js';
import { seedPageMarkdown, seedPageTitles } from '../src/lib/data/queries/misc.js';
import { seedTimeline } from '../src/lib/data/seed/timeline.js';
import { seedCategories, seedTags, tagSlug } from '../src/lib/data/seed/taxonomy.js';
import { locales, type Locale } from '../src/lib/i18n/config.js';

/**
 * seed 的 id 在 TypeScript 那側是可讀字串（`exp-yungyi`），資料庫則要 uuid。
 * 這裡以 UUIDv5 從固定命名空間推導，同一個字串永遠得到同一個 uuid，
 * 因此 seed 可重複套用而不會產生重複資料。
 */
const NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'; // RFC 4122 DNS namespace

function uuid5(name: string): string {
  const namespaceBytes = Buffer.from(NAMESPACE.replace(/-/g, ''), 'hex');
  const hash = createHash('sha1')
    .update(Buffer.concat([namespaceBytes, Buffer.from(name, 'utf8')]))
    .digest();

  const bytes = Buffer.from(hash.subarray(0, 16));
  bytes[6] = (bytes[6]! & 0x0f) | 0x50; // version 5
  bytes[8] = (bytes[8]! & 0x3f) | 0x80; // RFC 4122 variant

  const hex = bytes.toString('hex');
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join('-');
}

/** 把 seed 的可讀 id 轉成 SQL 字面值的 uuid。 */
const id = (value: string): string => `'${uuid5(value)}'::uuid`;

const q = (value: string | null | undefined): string =>
  value === null || value === undefined ? 'null' : `'${value.replace(/'/g, "''")}'`;

const j = (value: unknown): string => `${q(JSON.stringify(value))}::jsonb`;

const arr = (values: readonly string[]): string =>
  values.length === 0 ? "'{}'::text[]" : `array[${values.map(q).join(', ')}]::text[]`;

const lines: string[] = [];
const out = (sql: string) => lines.push(sql);

out(`-- 由 scripts/generate-seed.mts 產生，請勿手動編輯。
-- 修改內容請改 src/lib/data/seed/*.ts 後重新執行 \`pnpm seed:generate\`。
--
-- 這份 seed 可重複套用：所有 insert 都帶 on conflict do update。

begin;
`);

// --- 站台設定 -------------------------------------------------------------
out('-- 站台設定');
const settings: [string, unknown, string][] = [
  ['site_title', { 'zh-TW': '示範站台', en: 'Demo Site' }, '站名'],
  ['hero', heroTagline, 'Hero 一句話文案'],
  ['contact_email', contactEmail, '公開的聯絡信箱'],
  ['social_links', socialLinks, '社群連結'],
  ['show_company_name', true, '履歷是否顯示公司名稱（預設開啟）'],
  ['show_certifications', false, '是否顯示證照區（預設關閉）'],
  ['enable_three_background', true, '是否啟用首頁背景動畫'],
  ['comment_moderation', false, '留言是否全站預審（預設關閉）'],
];

for (const [key, value, description] of settings) {
  out(
    `insert into public.site_settings (key, value, description) values (${q(key)}, ${j(value)}, ${q(description)})\n  on conflict (key) do update set value = excluded.value, description = excluded.description;`,
  );
}

// --- 首頁區塊 -------------------------------------------------------------
out('\n-- 首頁區塊順序與開關');
const sectionKeys = [
  'hero',
  'stats',
  'featured_projects',
  'latest_posts',
  'skills',
  'organizations',
  'videos',
  'contact',
];
sectionKeys.forEach((key, index) => {
  out(
    `insert into public.page_sections (page_slug, section_key, sort_order, is_visible) values ('home', ${q(key)}, ${index}, true)\n  on conflict (page_slug, section_key) do update set sort_order = excluded.sort_order;`,
  );
});

// --- 分類 -----------------------------------------------------------------
out('\n-- 文章分類');
const zhCategories = seedCategories('zh-TW');
const enCategories = seedCategories('en');

zhCategories.forEach((category, index) => {
  out(
    `insert into public.categories (slug, icon, sort_order) values (${q(category.slug)}, ${q(category.icon)}, ${index})\n  on conflict (slug) do update set icon = excluded.icon, sort_order = excluded.sort_order;`,
  );
  for (const locale of locales) {
    const source = locale === 'zh-TW' ? zhCategories : enCategories;
    const localized = source[index]!;
    out(
      `insert into public.categories_i18n (category_id, locale, name, description)\n  select id, ${q(locale)}, ${q(localized.name)}, ${q(localized.description)} from public.categories where slug = ${q(category.slug)}\n  on conflict (category_id, locale) do update set name = excluded.name, description = excluded.description;`,
    );
  }
});

// --- 標籤 -----------------------------------------------------------------
out('\n-- 標籤（名稱不翻譯，兩個語系相同）');
for (const tag of seedTags()) {
  out(
    `insert into public.tags (slug) values (${q(tag.slug)}) on conflict (slug) do nothing;`,
  );
  for (const locale of locales) {
    out(
      `insert into public.tags_i18n (tag_id, locale, name)\n  select id, ${q(locale)}, ${q(tag.name)} from public.tags where slug = ${q(tag.slug)}\n  on conflict (tag_id, locale) do update set name = excluded.name;`,
    );
  }
}

// --- 系列 -----------------------------------------------------------------
out('\n-- 系列文');
seedSeries.forEach((series, index) => {
  out(
    `insert into public.series (slug, sort_order) values (${q(series.slug)}, ${index}) on conflict (slug) do nothing;`,
  );
  for (const locale of locales) {
    out(
      `insert into public.series_i18n (series_id, locale, title, description)\n  select id, ${q(locale)}, ${q(series.title[locale])}, ${q(series.description[locale])} from public.series where slug = ${q(series.slug)}\n  on conflict (series_id, locale) do update set title = excluded.title, description = excluded.description;`,
    );
  }
});

// --- 組織 -----------------------------------------------------------------
out('\n-- 組織');
const zhOrgs = seedOrganizations('zh-TW');
const enOrgs = seedOrganizations('en');

zhOrgs.forEach((org, index) => {
  out(
    `insert into public.organizations (slug, website_url, github_org, started_at, ended_at, status, sort_order)\n  values (${q(org.slug)}, ${q(org.websiteUrl)}, ${q(org.githubOrg)}, ${q(org.startedAt)}, ${q(org.endedAt)}, ${q(org.status)}, ${index})\n  on conflict (slug) do update set website_url = excluded.website_url, github_org = excluded.github_org,\n    started_at = excluded.started_at, ended_at = excluded.ended_at, status = excluded.status;`,
  );
  for (const locale of locales) {
    const source = locale === 'zh-TW' ? zhOrgs : enOrgs;
    const localized = source[index]!;
    out(
      `insert into public.organizations_i18n (org_id, locale, name, role, description_html)\n  select id, ${q(locale)}, ${q(localized.name)}, ${q(localized.role)}, ${q(localized.descriptionHtml)} from public.organizations where slug = ${q(org.slug)}\n  on conflict (org_id, locale) do update set name = excluded.name, role = excluded.role, description_html = excluded.description_html;`,
    );
  }
});

// --- 履歷 -----------------------------------------------------------------
out('\n-- 工作經歷');
const zhExperiences = seedExperiences('zh-TW');
const enExperiences = seedExperiences('en');

zhExperiences.forEach((experience, index) => {
  const orgClause = experience.organizationSlug
    ? `(select id from public.organizations where slug = ${q(experience.organizationSlug)})`
    : 'null';
  out(
    `insert into public.experiences (id, organization_id, employment_type, started_at, ended_at, is_current, show_company_name, sort_order)\n  values (${id(experience.id)}, ${orgClause}, ${q(experience.employmentType)}, ${q(experience.startedAt)}, ${q(experience.endedAt)}, ${experience.isCurrent}, ${experience.showCompanyName}, ${index})\n  on conflict (id) do update set organization_id = excluded.organization_id, ended_at = excluded.ended_at,\n    is_current = excluded.is_current, sort_order = excluded.sort_order;`,
  );
  for (const locale of locales) {
    const source = locale === 'zh-TW' ? zhExperiences : enExperiences;
    const localized = source[index]!;
    out(
      `insert into public.experiences_i18n (experience_id, locale, company_name, title, location, highlights, tech)\n  values (${id(experience.id)}, ${q(locale)}, ${q(localized.companyName)}, ${q(localized.title)}, ${q(localized.location)}, ${j(localized.highlights)}, ${arr(localized.tech)})\n  on conflict (experience_id, locale) do update set company_name = excluded.company_name,\n    title = excluded.title, highlights = excluded.highlights, tech = excluded.tech;`,
    );
  }
});

out('\n-- 學歷');
const zhEducation = seedEducation('zh-TW');
const enEducation = seedEducation('en');

zhEducation.forEach((education, index) => {
  out(
    `insert into public.education (id, started_at, ended_at, is_current, sort_order)\n  values (${id(education.id)}, ${q(education.startedAt)}, ${q(education.endedAt)}, ${education.isCurrent}, ${index})\n  on conflict (id) do update set ended_at = excluded.ended_at, sort_order = excluded.sort_order;`,
  );
  for (const locale of locales) {
    const source = locale === 'zh-TW' ? zhEducation : enEducation;
    const localized = source[index]!;
    out(
      `insert into public.education_i18n (education_id, locale, school, degree, field)\n  values (${id(education.id)}, ${q(locale)}, ${q(localized.school)}, ${q(localized.degree)}, ${q(localized.field)})\n  on conflict (education_id, locale) do update set school = excluded.school, degree = excluded.degree, field = excluded.field;`,
    );
  }
});

out('\n-- 技能');
const zhSkillGroups = seedSkillGroups('zh-TW');
const enSkillGroups = seedSkillGroups('en');

zhSkillGroups.forEach((group, groupIndex) => {
  out(
    `insert into public.skill_groups (id, key, sort_order) values (${id(group.id)}, ${q(group.key)}, ${groupIndex})\n  on conflict (id) do update set sort_order = excluded.sort_order;`,
  );
  for (const locale of locales) {
    const source = locale === 'zh-TW' ? zhSkillGroups : enSkillGroups;
    out(
      `insert into public.skill_groups_i18n (group_id, locale, name)\n  values (${id(group.id)}, ${q(locale)}, ${q(source[groupIndex]!.name)})\n  on conflict (group_id, locale) do update set name = excluded.name;`,
    );
  }
  group.skills.forEach((skill, skillIndex) => {
    out(
      `insert into public.skills (id, group_id, name, level, is_primary, show_on_home, sort_order)\n  values (${id(skill.id)}, ${id(group.id)}, ${q(skill.name)}, ${skill.level ?? 'null'}, ${skill.isPrimary}, ${skill.showOnHome}, ${skillIndex})\n  on conflict (id) do update set name = excluded.name, is_primary = excluded.is_primary,\n    show_on_home = excluded.show_on_home, sort_order = excluded.sort_order;`,
    );
  });
});

out('\n-- 證照（整區預設隱藏，由 site_settings.show_certifications 控制）');
const zhCertifications = seedCertifications('zh-TW');
const enCertifications = seedCertifications('en');

zhCertifications.forEach((certification, index) => {
  out(
    `insert into public.certifications (id, sort_order) values (${id(certification.id)}, ${index})\n  on conflict (id) do update set sort_order = excluded.sort_order;`,
  );
  for (const locale of locales) {
    const source = locale === 'zh-TW' ? zhCertifications : enCertifications;
    const localized = source[index]!;
    out(
      `insert into public.certifications_i18n (certification_id, locale, name, issuer)\n  values (${id(certification.id)}, ${q(locale)}, ${q(localized.name)}, ${q(localized.issuer)})\n  on conflict (certification_id, locale) do update set name = excluded.name, issuer = excluded.issuer;`,
    );
  }
});

out('\n-- 語言');
const zhLanguages = seedLanguages('zh-TW');
const enLanguages = seedLanguages('en');

zhLanguages.forEach((language, index) => {
  out(
    `insert into public.languages_spoken (id, code, proficiency, sort_order)\n  values (${id(language.id)}, ${q(language.code)}, ${q(language.proficiency)}, ${index})\n  on conflict (id) do update set proficiency = excluded.proficiency, sort_order = excluded.sort_order;`,
  );
  for (const locale of locales) {
    const source = locale === 'zh-TW' ? zhLanguages : enLanguages;
    out(
      `insert into public.languages_spoken_i18n (language_id, locale, name)\n  values (${id(language.id)}, ${q(locale)}, ${q(source[index]!.name)})\n  on conflict (language_id, locale) do update set name = excluded.name;`,
    );
  }
});

out('\n-- 興趣與生活');
const zhInterests = seedInterests('zh-TW');
const enInterests = seedInterests('en');

zhInterests.forEach((interest, index) => {
  out(
    `insert into public.interests (id, icon, sort_order) values (${id(interest.id)}, ${q(interest.icon)}, ${index})\n  on conflict (id) do update set icon = excluded.icon, sort_order = excluded.sort_order;`,
  );
  for (const locale of locales) {
    const source = locale === 'zh-TW' ? zhInterests : enInterests;
    const localized = source[index]!;
    out(
      `insert into public.interests_i18n (interest_id, locale, title, description)\n  values (${id(interest.id)}, ${q(locale)}, ${q(localized.title)}, ${q(localized.description)})\n  on conflict (interest_id, locale) do update set title = excluded.title, description = excluded.description;`,
    );
  }
});

// --- 時間軸 ---------------------------------------------------------------
out('\n-- 時間軸');
const zhTimeline = seedTimeline('zh-TW');
const enTimeline = seedTimeline('en');

zhTimeline.forEach((event, index) => {
  out(
    `insert into public.timeline_events (id, event_date, branch, type, icon, link_url, is_milestone, sort_order)\n  values (${id(event.id)}, ${q(event.eventDate)}, ${q(event.branch)}, ${q(event.type)}, ${q(event.icon)}, ${q(event.linkUrl)}, ${event.isMilestone}, ${index})\n  on conflict (id) do update set event_date = excluded.event_date, branch = excluded.branch,\n    type = excluded.type, is_milestone = excluded.is_milestone, sort_order = excluded.sort_order;`,
  );
  for (const locale of locales) {
    const source = locale === 'zh-TW' ? zhTimeline : enTimeline;
    const localized = source[index]!;
    out(
      `insert into public.timeline_events_i18n (event_id, locale, title, subtitle, description)\n  values (${id(event.id)}, ${q(locale)}, ${q(localized.title)}, ${q(localized.subtitle)}, ${q(localized.description)})\n  on conflict (event_id, locale) do update set title = excluded.title, subtitle = excluded.subtitle, description = excluded.description;`,
    );
  }
});

// --- 連結樹 ---------------------------------------------------------------
out('\n-- 連結樹');
const zhLinkGroups = seedLinkGroups('zh-TW');
const enLinkGroups = seedLinkGroups('en');

zhLinkGroups.forEach((group, groupIndex) => {
  out(
    `insert into public.link_groups (id, key, sort_order) values (${id(group.id)}, ${q(group.key)}, ${groupIndex})\n  on conflict (id) do update set sort_order = excluded.sort_order;`,
  );
  for (const locale of locales) {
    const source = locale === 'zh-TW' ? zhLinkGroups : enLinkGroups;
    out(
      `insert into public.link_groups_i18n (group_id, locale, name)\n  values (${id(group.id)}, ${q(locale)}, ${q(source[groupIndex]!.name)})\n  on conflict (group_id, locale) do update set name = excluded.name;`,
    );
  }
  group.buttons.forEach((button, buttonIndex) => {
    out(
      `insert into public.link_buttons (id, group_id, url, icon, is_highlighted, sort_order)\n  values (${id(button.id)}, ${id(group.id)}, ${q(button.url)}, ${q(button.icon)}, ${button.isHighlighted}, ${buttonIndex})\n  on conflict (id) do update set url = excluded.url, icon = excluded.icon,\n    is_highlighted = excluded.is_highlighted, sort_order = excluded.sort_order;`,
    );
    for (const locale of locales) {
      const source = locale === 'zh-TW' ? zhLinkGroups : enLinkGroups;
      const localized = source[groupIndex]!.buttons[buttonIndex]!;
      out(
        `insert into public.link_buttons_i18n (button_id, locale, label, description)\n  values (${id(button.id)}, ${q(locale)}, ${q(localized.label)}, ${q(localized.description)})\n  on conflict (button_id, locale) do update set label = excluded.label, description = excluded.description;`,
      );
    }
  });
});

// --- 贊助 -----------------------------------------------------------------
out('\n-- 贊助方式（地址留空，由後台填入）');
const zhSponsorMethods = seedSponsorMethods('zh-TW');
const enSponsorMethods = seedSponsorMethods('en');

zhSponsorMethods.forEach((method, index) => {
  out(
    `insert into public.sponsor_methods (id, key, type, address_or_url, network, icon, sort_order)\n  values (${id(method.id)}, ${q(method.key)}, ${q(method.type)}, ${q(method.addressOrUrl)}, ${q(method.network)}, ${q(method.icon)}, ${index})\n  on conflict (id) do update set network = excluded.network, icon = excluded.icon, sort_order = excluded.sort_order;`,
  );
  for (const locale of locales) {
    const source = locale === 'zh-TW' ? zhSponsorMethods : enSponsorMethods;
    const localized = source[index]!;
    out(
      `insert into public.sponsor_methods_i18n (method_id, locale, label, note)\n  values (${id(method.id)}, ${q(locale)}, ${q(localized.label)}, ${q(localized.note)})\n  on conflict (method_id, locale) do update set label = excluded.label, note = excluded.note;`,
    );
  }
});

// --- 更新日誌 -------------------------------------------------------------
out('\n-- 更新日誌');
const zhChangelog = seedChangelog('zh-TW');
const enChangelog = seedChangelog('en');

zhChangelog.forEach((entry, index) => {
  out(
    `insert into public.changelog_entries (id, version, released_at, sort_order)\n  values (${id(entry.id)}, ${q(entry.version)}, ${q(entry.releasedAt)}, ${index})\n  on conflict (id) do update set released_at = excluded.released_at, sort_order = excluded.sort_order;`,
  );
  for (const locale of locales) {
    const source = locale === 'zh-TW' ? zhChangelog : enChangelog;
    const localized = source[index]!;
    out(
      `insert into public.changelog_entries_i18n (entry_id, locale, title, items)\n  values (${id(entry.id)}, ${q(locale)}, ${q(localized.title)}, ${j(localized.items)})\n  on conflict (entry_id, locale) do update set title = excluded.title, items = excluded.items;`,
    );
  }
});

// --- 文章 -----------------------------------------------------------------
out('\n-- 文章');
for (const post of seedPosts) {
  const seriesClause = post.seriesSlug
    ? `(select id from public.series where slug = ${q(post.seriesSlug)})`
    : 'null';

  out(
    `insert into public.posts (slug, series_id, series_order, status, published_at, is_pinned, is_featured)\n  values (${q(post.slug)}, ${seriesClause}, ${post.seriesOrder ?? 'null'}, 'published', ${q(post.publishedAt)}, ${post.isPinned}, ${post.isFeatured})\n  on conflict (slug) do update set series_id = excluded.series_id, series_order = excluded.series_order,\n    status = excluded.status, published_at = excluded.published_at,\n    is_pinned = excluded.is_pinned, is_featured = excluded.is_featured;`,
  );

  for (const locale of locales as readonly Locale[]) {
    const content = post.i18n[locale];
    if (!content) continue;

    // 與前台同一條管線：html / text / toc 都在寫入前算好（規格 §9.1）。
    const rendered = await renderMarkdown(content.markdown);

    out(
      `insert into public.posts_i18n (post_id, locale, title, subtitle, excerpt, content_md, content_html, content_text, toc, reading_time_min, word_count)\n  select id, ${q(locale)}, ${q(content.title)}, ${q(content.subtitle)}, ${q(content.excerpt)}, ${q(content.markdown)}, ${q(rendered.html)}, ${q(rendered.text)}, ${j(rendered.toc)}, ${rendered.readingTimeMin}, ${rendered.wordCount}\n    from public.posts where slug = ${q(post.slug)}\n  on conflict (post_id, locale) do update set title = excluded.title, subtitle = excluded.subtitle,\n    excerpt = excluded.excerpt, content_md = excluded.content_md, content_html = excluded.content_html,\n    content_text = excluded.content_text, toc = excluded.toc,\n    reading_time_min = excluded.reading_time_min, word_count = excluded.word_count;`,
    );
  }

  post.categories.forEach((categorySlug) => {
    out(
      `insert into public.post_categories (post_id, category_id, is_primary)\n  select p.id, c.id, ${categorySlug === post.primaryCategory}\n    from public.posts p, public.categories c\n   where p.slug = ${q(post.slug)} and c.slug = ${q(categorySlug)}\n  on conflict (post_id, category_id) do update set is_primary = excluded.is_primary;`,
    );
  });

  for (const tag of post.tags) {
    out(
      `insert into public.post_tags (post_id, tag_id)\n  select p.id, t.id from public.posts p, public.tags t\n   where p.slug = ${q(post.slug)} and t.slug = ${q(tagSlug(tag))}\n  on conflict do nothing;`,
    );
  }
}

// --- 作品集分類與專案 ------------------------------------------------------
out('\n-- 作品集');
const zhProjects = seedProjects('zh-TW');
const enProjects = seedProjects('en');

// 分類由專案本身推導，不另外維護一份清單。
const projectCategories = new Map<string, { zh: string; en: string }>();
zhProjects.forEach((project, index) => {
  if (!project.categorySlug || !project.categoryName) return;
  projectCategories.set(project.categorySlug, {
    zh: project.categoryName,
    en: enProjects[index]!.categoryName ?? project.categoryName,
  });
});

[...projectCategories.entries()].forEach(([slug, names], index) => {
  out(
    `insert into public.project_categories (slug, sort_order) values (${q(slug)}, ${index})\n  on conflict (slug) do update set sort_order = excluded.sort_order;`,
  );
  for (const locale of locales) {
    out(
      `insert into public.project_categories_i18n (category_id, locale, name)\n  select id, ${q(locale)}, ${q(locale === 'zh-TW' ? names.zh : names.en)} from public.project_categories where slug = ${q(slug)}\n  on conflict (category_id, locale) do update set name = excluded.name;`,
    );
  }
});

for (const [index, project] of zhProjects.entries()) {
  const categoryClause = project.categorySlug
    ? `(select id from public.project_categories where slug = ${q(project.categorySlug)})`
    : 'null';
  const orgClause = project.organizationSlug
    ? `(select id from public.organizations where slug = ${q(project.organizationSlug)})`
    : 'null';

  out(
    `insert into public.projects (slug, category_id, organization_id, status, started_at, ended_at, github_repo, is_featured, sort_order)\n  values (${q(project.slug)}, ${categoryClause}, ${orgClause}, ${q(project.status)}, ${q(project.startedAt)}, ${q(project.endedAt)}, ${q(project.githubRepo)}, ${project.isFeatured}, ${index})\n  on conflict (slug) do update set category_id = excluded.category_id, organization_id = excluded.organization_id,\n    status = excluded.status, started_at = excluded.started_at, ended_at = excluded.ended_at,\n    github_repo = excluded.github_repo, is_featured = excluded.is_featured, sort_order = excluded.sort_order;`,
  );

  for (const locale of locales as readonly Locale[]) {
    const source = locale === 'zh-TW' ? zhProjects : enProjects;
    const localized = source[index]!;
    const markdown = seedProjectMarkdown(project.slug, locale);
    const rendered = markdown ? await renderMarkdown(markdown) : null;

    out(
      `insert into public.projects_i18n (project_id, locale, name, tagline, summary, content_md, content_html, content_text, toc, role)\n  select id, ${q(locale)}, ${q(localized.name)}, ${q(localized.tagline)}, ${q(localized.summary)}, ${q(markdown)}, ${q(rendered?.html ?? null)}, ${q(rendered?.text ?? null)}, ${j(rendered?.toc ?? [])}, ${q(localized.role)}\n    from public.projects where slug = ${q(project.slug)}\n  on conflict (project_id, locale) do update set name = excluded.name, tagline = excluded.tagline,\n    summary = excluded.summary, content_md = excluded.content_md, content_html = excluded.content_html,\n    content_text = excluded.content_text, toc = excluded.toc, role = excluded.role;`,
    );
  }

  for (const tag of project.tags) {
    out(
      `insert into public.project_tags (project_id, tag_id)\n  select p.id, t.id from public.projects p, public.tags t\n   where p.slug = ${q(project.slug)} and t.slug = ${q(tag.slug)}\n  on conflict do nothing;`,
    );
  }

  project.links.forEach((link, linkIndex) => {
    out(
      `insert into public.project_links (id, project_id, type, url, sort_order)\n  select ${id(link.id)}, id, ${q(link.type)}, ${q(link.url)}, ${linkIndex} from public.projects where slug = ${q(project.slug)}\n  on conflict (id) do update set url = excluded.url, sort_order = excluded.sort_order;`,
    );
    for (const locale of locales) {
      const source = locale === 'zh-TW' ? zhProjects : enProjects;
      const localized = source[index]!.links[linkIndex]!;
      out(
        `insert into public.project_links_i18n (link_id, locale, label)\n  values (${id(link.id)}, ${q(locale)}, ${q(localized.label)})\n  on conflict (link_id, locale) do update set label = excluded.label;`,
      );
    }
  });
}

// --- 單頁（隱私權政策、使用條款）------------------------------------------
out('\n-- 單頁');
for (const [slug, byLocale] of Object.entries(seedPageMarkdown)) {
  out(
    `insert into public.pages (slug, status) values (${q(slug)}, 'published')\n  on conflict (slug) do update set status = excluded.status;`,
  );

  for (const locale of locales as readonly Locale[]) {
    const markdown = byLocale[locale];
    if (!markdown) continue;
    const rendered = await renderMarkdown(markdown);
    const title = seedPageTitles[slug]?.[locale] ?? slug;

    out(
      `insert into public.pages_i18n (page_id, locale, title, content_md, content_html, content_text, toc)\n  select id, ${q(locale)}, ${q(title)}, ${q(markdown)}, ${q(rendered.html)}, ${q(rendered.text)}, ${j(rendered.toc)}\n    from public.pages where slug = ${q(slug)}\n  on conflict (page_id, locale) do update set title = excluded.title, content_md = excluded.content_md,\n    content_html = excluded.content_html, content_text = excluded.content_text, toc = excluded.toc;`,
    );
  }
}

out('\ncommit;');

const target = path.join(process.cwd(), 'supabase', 'seed.sql');
await writeFile(target, lines.join('\n') + '\n', 'utf8');
console.log(`wrote ${target} (${lines.length} statements)`);
