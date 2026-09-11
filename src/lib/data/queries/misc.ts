import { cache } from 'react';

import { cacheTags, cached } from '@/lib/data/cache';

import { renderMarkdown } from '@/lib/content/markdown';
import { seedTimeline } from '@/lib/data/seed/timeline';
import { publicClient, rows, usingSeed } from '@/lib/data/source';
import type { Locale } from '@/lib/i18n/config';
import type { SearchResult, StaticPage, TimelineEvent } from '@/types/content';

export const getTimeline = cached(
  ['getTimeline'],
  async (locale: Locale): Promise<TimelineEvent[]> => {
    if (usingSeed) return seedTimeline(locale);

    const { data, error } = await publicClient()
      .from('timeline_events')
      .select(
        'id, event_date, end_date, branch, type, icon, color, image_url, link_url, is_milestone, sort_order, timeline_events_i18n!inner(title, subtitle, description, locale)',
      )
      .eq('is_visible', true)
      .eq('timeline_events_i18n.locale', locale)
      .order('event_date');
    if (error) throw new Error(`[data] timeline_events: ${error.message}`);

    return rows<{
      id: string;
      event_date: string;
      end_date: string | null;
      branch: TimelineEvent['branch'];
      type: TimelineEvent['type'];
      icon: string | null;
      color: string | null;
      image_url: string | null;
      link_url: string | null;
      is_milestone: boolean;
      timeline_events_i18n: {
        title: string;
        subtitle: string | null;
        description: string | null;
      }[];
    }>(data).map((row) => {
      const i18n = row.timeline_events_i18n[0];
      return {
        id: row.id,
        eventDate: row.event_date,
        endDate: row.end_date,
        branch: row.branch,
        type: row.type,
        title: i18n?.title ?? '',
        subtitle: i18n?.subtitle ?? null,
        description: i18n?.description ?? null,
        icon: row.icon,
        color: row.color,
        imageUrl: row.image_url,
        linkUrl: row.link_url,
        isMilestone: row.is_milestone,
      };
    });
  },
  { tags: [cacheTags.timeline] },
);

/** about / privacy / terms / sponsor 說明等單頁內容。 */
export const getStaticPage = cache(
  async (locale: Locale, slug: string): Promise<StaticPage | null> => {
    if (usingSeed) {
      const markdown = seedPageMarkdown[slug]?.[locale];
      if (!markdown) return null;
      const rendered = await renderMarkdown(markdown);
      return {
        slug,
        title: seedPageTitles[slug]?.[locale] ?? slug,
        contentHtml: rendered.html,
        toc: rendered.toc,
        seoTitle: null,
        seoDescription: null,
        updatedAt: null,
      };
    }

    const { data, error } = await publicClient()
      .from('pages')
      .select(
        'slug, updated_at, pages_i18n!inner(title, content_html, seo_title, seo_description, locale)',
      )
      .eq('slug', slug)
      .eq('status', 'published')
      .eq('pages_i18n.locale', locale)
      .maybeSingle();
    if (error) throw new Error(`[data] pages(${slug}): ${error.message}`);
    if (!data) return null;

    const row = data as unknown as {
      slug: string;
      updated_at: string | null;
      pages_i18n: {
        title: string;
        content_html: string | null;
        seo_title: string | null;
        seo_description: string | null;
      }[];
    };
    const i18n = row.pages_i18n[0];

    return {
      slug: row.slug,
      title: i18n?.title ?? row.slug,
      contentHtml: i18n?.content_html ?? '',
      toc: [],
      seoTitle: i18n?.seo_title ?? null,
      seoDescription: i18n?.seo_description ?? null,
      updatedAt: row.updated_at,
    };
  },
);

/**
 * 全站搜尋（規格 §10）。走 DB 的 `search_all` RPC，權重與片段擷取都在 SQL 完成。
 * seed 模式下退化為對標題與摘要的子字串比對，讓搜尋介面在沒有後端時仍可操作。
 */
export async function searchAll(
  locale: Locale,
  query: string,
  options: { limit?: number; offset?: number } = {},
): Promise<SearchResult[]> {
  const trimmed = query.trim();
  if (trimmed.length === 0) return [];

  const limit = options.limit ?? 20;
  const offset = options.offset ?? 0;

  if (usingSeed) {
    const [{ getPosts }, { getProjects }] = await Promise.all([
      import('./posts'),
      import('./projects'),
    ]);
    const needle = trimmed.toLowerCase();
    const [posts, projects] = await Promise.all([
      getPosts({ locale, pageSize: 200 }),
      getProjects({ locale, pageSize: 200 }),
    ]);

    const results: SearchResult[] = [
      ...posts.items
        .filter((post) => `${post.title} ${post.excerpt ?? ''}`.toLowerCase().includes(needle))
        .map((post) => ({
          type: 'post' as const,
          id: post.id,
          slug: post.slug,
          title: post.title,
          snippet: post.excerpt ?? '',
          score: 1,
          date: post.publishedAt,
          categories: post.categories.map((category) => category.name),
        })),
      ...projects.items
        .filter((project) =>
          `${project.name} ${project.tagline ?? ''} ${project.summary ?? ''}`
            .toLowerCase()
            .includes(needle),
        )
        .map((project) => ({
          type: 'project' as const,
          id: project.id,
          slug: project.slug,
          title: project.name,
          snippet: project.tagline ?? '',
          score: 1,
          date: project.startedAt,
          categories: project.categoryName ? [project.categoryName] : [],
        })),
    ];

    return results.slice(offset, offset + limit);
  }

  const { data, error } = await publicClient().rpc('search_all', {
    q: trimmed,
    p_locale: locale,
    p_limit: limit,
    p_offset: offset,
  });
  if (error) throw new Error(`[data] search_all: ${error.message}`);

  return rows<{
    type: SearchResult['type'];
    id: string;
    slug: string;
    title: string;
    snippet: string;
    score: number;
    date: string | null;
    categories: string[] | null;
  }>(data).map((row) => ({
    type: row.type,
    id: row.id,
    slug: row.slug,
    title: row.title,
    snippet: row.snippet,
    score: row.score,
    date: row.date,
    categories: row.categories ?? [],
  }));
}

/** seed 模式的單頁內容，同時是 `supabase/seed.sql` 的來源。 */
export const seedPageTitles: Record<string, Record<Locale, string>> = {
  privacy: { 'zh-TW': '隱私權政策', en: 'Privacy Policy' },
  terms: { 'zh-TW': '使用條款', en: 'Terms of Use' },
};

export const seedPageMarkdown: Record<string, Record<Locale, string>> = {
  privacy: {
    'zh-TW': `本站盡可能少收資料，並且不使用 cookie 追蹤訪客。

## 我收集什麼

- **瀏覽紀錄**：頁面路徑、來源網站、螢幕尺寸、語言、瀏覽器與作業系統、國家與城市。
- **訪客識別**：以 \`sha256(IP + User-Agent + 每日輪替的隨機鹽)\` 產生的雜湊值。**IP 不以明文儲存**，而且鹽每天更換，因此無法跨日辨識同一個人。
- **留言與聯絡表單**：你主動填寫的暱稱、Email 與內容。

## 我不收集什麼

- 不使用 Google Analytics 或任何第三方追蹤服務。
- 不放追蹤 cookie，因此本站沒有 cookie 同意橫幅。
- 不建立跨站的使用者輪廓。

## 保存多久

- 原始瀏覽事件保留 **90 天**，之後自動刪除。
- 每日彙總後的統計數字（不含個人識別資料）長期保存。
- 留言與聯絡訊息保留至你要求刪除為止。

## 使用到的第三方服務

| 服務 | 用途 |
|---|---|
| Vercel | 網站託管與 CDN |
| Supabase | 資料庫、帳號與檔案儲存 |
| Cloudflare | DNS 與表單防機器人驗證 |
| Resend | 寄送通知信 |
| YouTube | 影片內嵌（採用 youtube-nocookie 網域） |
| Google／GitHub | 選用的第三方登入 |

## 你的權利

你可以要求刪除帳號與所有留言。寄信到 hello@example.com 即可，我會在確認身分後處理。`,
    en: `This site collects as little as possible, and does not use cookies to track visitors.

## What is collected

- **Page views**: path, referrer, screen size, language, browser and OS, country and city.
- **Visitor identity**: a hash of \`sha256(IP + User-Agent + a salt that rotates daily)\`. **The IP is never stored in plain text**, and because the salt changes every day, the same person cannot be recognised across days.
- **Comments and the contact form**: the display name, email and content you choose to submit.

## What is not collected

- No Google Analytics or any third-party tracking service.
- No tracking cookies, which is why this site has no cookie consent banner.
- No cross-site profiles.

## Retention

- Raw page-view events are kept for **90 days**, then deleted automatically.
- Daily aggregates, which contain no identifying data, are kept long term.
- Comments and contact messages are kept until you ask for their removal.

## Third-party services

| Service | Purpose |
|---|---|
| Vercel | Hosting and CDN |
| Supabase | Database, accounts and file storage |
| Cloudflare | DNS and bot protection on forms |
| Resend | Notification email |
| YouTube | Video embeds, via the youtube-nocookie domain |
| Google / GitHub | Optional third-party sign-in |

## Your rights

You can ask for your account and all of your comments to be deleted. Email hello@example.com and it will be handled once your identity is confirmed.`,
  },
  terms: {
    'zh-TW': `## 內容授權

本站的**文章與圖片**著作權屬於站方。歡迎引用與轉載，請註明出處並附上原文連結；商業使用請先來信。

文章中的**程式碼片段**除另有註明外，以 MIT 授權釋出，可自由使用。

## 留言規範

留言區歡迎討論與指正。以下內容會被隱藏，重複違反者會被封鎖：

- 人身攻擊、歧視或騷擾
- 廣告、垃圾訊息與詐騙連結
- 與文章無關的政治動員

## 免責聲明

本站的技術文章反映的是寫作當下的理解與環境，可能隨時間過期。**任何與加密貨幣、投資相關的內容都不構成投資建議**，請自行研究並承擔風險。

## 服務可用性

本站為個人網站，不保證不中斷或無錯誤。`,
    en: `## Content licence

The **writing and images** on this site are copyright the site owner. Quoting and reposting are welcome with attribution and a link to the original; please email first for commercial use.

**Code snippets** in posts are released under the MIT licence unless stated otherwise, and are free to use.

## Comment policy

Discussion and corrections are welcome. The following will be hidden, and repeat offenders blocked:

- Personal attacks, discrimination or harassment
- Advertising, spam and scam links
- Off-topic political campaigning

## Disclaimer

Technical posts reflect the understanding and environment at the time of writing, and may age. **Nothing here about cryptocurrency or investing is financial advice** — do your own research and carry your own risk.

## Availability

This is a personal site, offered without any guarantee of uptime or correctness.`,
  },
};
