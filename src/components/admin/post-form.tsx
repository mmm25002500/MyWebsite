'use client';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, useTransition } from 'react';

import { deletePost, savePost } from '@/actions/posts';
import { Button } from '@/components/ui/button';
import type { AdminPostDetail } from '@/lib/data/queries/admin';
import { locales, type Locale } from '@/lib/i18n/config';
import { cn, slugify } from '@/lib/utils';

// 編輯器只在後台用得到，動態載入才不會讓其他後台頁面一起背這包。
const MarkdownEditor = dynamic(
  () => import('@/components/editor/markdown-editor').then((mod) => mod.MarkdownEditor),
  {
    ssr: false,
    loading: () => (
      <div className="h-[680px] animate-pulse rounded-lg border border-divider bg-surface" />
    ),
  },
);

interface Option {
  id: string;
  name: string;
}

interface ContentDraft {
  locale: Locale;
  title: string;
  subtitle: string;
  excerpt: string;
  contentMd: string;
  seoTitle: string;
  seoDescription: string;
}

type Tab = 'content' | 'seo' | 'settings';

const emptyContent = (locale: Locale): ContentDraft => ({
  locale,
  title: '',
  subtitle: '',
  excerpt: '',
  contentMd: '',
  seoTitle: '',
  seoDescription: '',
});

const field =
  'w-full min-h-9 rounded-md border border-divider bg-bg px-2.5 py-1.5 text-[15px] text-text outline-none transition-colors focus-visible:border-accent';
const label = 'mb-1.5 block text-[14px] font-bold text-ink-70';

export function PostForm({
  post,
  options,
  canDelete,
}: {
  post: AdminPostDetail | null;
  options: { categories: Option[]; tags: Option[]; series: { id: string; title: string }[] };
  canDelete: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [tab, setTab] = useState<Tab>('content');
  const [activeLocale, setActiveLocale] = useState<Locale>('zh-TW');
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);

  const [slug, setSlug] = useState(post?.slug ?? '');
  const [status, setStatus] = useState(post?.status ?? 'draft');
  const [publishedAt, setPublishedAt] = useState(post?.publishedAt?.slice(0, 16) ?? '');
  const [coverUrl, setCoverUrl] = useState(post?.coverUrl ?? '');
  const [canonicalUrl, setCanonicalUrl] = useState(post?.canonicalUrl ?? '');
  const [isPinned, setIsPinned] = useState(post?.isPinned ?? false);
  const [isFeatured, setIsFeatured] = useState(post?.isFeatured ?? false);
  const [allowComments, setAllowComments] = useState(post?.allowComments ?? true);
  const [seriesId, setSeriesId] = useState(post?.seriesId ?? '');
  const [seriesOrder, setSeriesOrder] = useState(post?.seriesOrder?.toString() ?? '');
  const [categoryIds, setCategoryIds] = useState<string[]>(post?.categoryIds ?? []);
  const [primaryCategoryId, setPrimaryCategoryId] = useState(post?.primaryCategoryId ?? '');
  const [tagIds, setTagIds] = useState<string[]>(post?.tagIds ?? []);

  const [contents, setContents] = useState<ContentDraft[]>(() =>
    locales.map((locale) => {
      const existing = post?.contents.find((row) => row.locale === locale);
      return existing
        ? {
            locale,
            title: existing.title,
            subtitle: existing.subtitle ?? '',
            excerpt: existing.excerpt ?? '',
            contentMd: existing.contentMd,
            seoTitle: existing.seoTitle ?? '',
            seoDescription: existing.seoDescription ?? '',
          }
        : emptyContent(locale);
    }),
  );

  const current = contents.find((row) => row.locale === activeLocale)!;

  const patchContent = (patch: Partial<ContentDraft>) => {
    setContents((rows) =>
      rows.map((row) => (row.locale === activeLocale ? { ...row, ...patch } : row)),
    );
  };

  // 新文章：標題打完自動帶 slug，已存在的文章不動，以免改標題就換網址。
  useEffect(() => {
    if (post || activeLocale !== 'zh-TW' || !current.title) return;
    setSlug((value) => (value ? value : slugify(current.title)));
  }, [current.title, post, activeLocale]);

  // 選第一個分類時自動設為主分類（規格 §8.2）。
  useEffect(() => {
    if (categoryIds.length === 0) {
      setPrimaryCategoryId('');
      return;
    }
    if (!categoryIds.includes(primaryCategoryId)) setPrimaryCategoryId(categoryIds[0]!);
  }, [categoryIds, primaryCategoryId]);

  const filled = useMemo(
    () => contents.filter((row) => row.title.trim() && row.contentMd.trim()),
    [contents],
  );

  const submit = () => {
    setMessage(null);

    if (filled.length === 0) {
      setMessage({ kind: 'error', text: '至少要有一個語系填了標題與內容' });
      return;
    }

    startTransition(async () => {
      const result = await savePost({
        id: post?.id ?? null,
        slug,
        status: status as 'draft' | 'published' | 'unlisted' | 'archived',
        publishedAt: publishedAt ? new Date(publishedAt).toISOString() : null,
        coverUrl: coverUrl || null,
        canonicalUrl: canonicalUrl || null,
        isPinned,
        isFeatured,
        allowComments,
        seriesId: seriesId || null,
        seriesOrder: seriesOrder ? Number(seriesOrder) : null,
        categoryIds,
        primaryCategoryId,
        tagIds,
        contents: filled.map((row) => ({
          locale: row.locale,
          title: row.title,
          subtitle: row.subtitle || null,
          excerpt: row.excerpt || null,
          contentMd: row.contentMd,
          seoTitle: row.seoTitle || null,
          seoDescription: row.seoDescription || null,
        })),
      });

      if (!result.ok) {
        setMessage({ kind: 'error', text: result.error ?? '儲存失敗' });
        return;
      }

      setMessage({
        kind: 'ok',
        text: result.issues?.length
          ? `已儲存，但有 ${result.issues.length} 個指令語法問題`
          : '已儲存',
      });

      if (!post && result.postId) router.replace(`/admin/posts/${result.postId}`);
      else router.refresh();
    });
  };

  const remove = () => {
    if (!post) return;
    startTransition(async () => {
      const result = await deletePost(post.id);
      if (!result.ok) {
        setMessage({ kind: 'error', text: result.error ?? '刪除失敗' });
        return;
      }
      router.push('/admin/posts');
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-[28px] font-bold">
            {post ? current.title || post.slug : '新文章'}
          </h1>
          <p className="mt-1 text-[14px] text-ink-70">
            {post ? `/notes/p/${post.slug}` : '尚未儲存'}
          </p>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {message ? (
            <span
              className={cn(
                'text-[14px]',
                message.kind === 'ok' ? 'text-accent-700' : 'text-accent-2-700',
              )}
            >
              {message.text}
            </span>
          ) : null}
          {post ? (
            <a
              href={`/notes/p/${post.slug}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-md border border-divider px-3 py-1.5 text-[14px] text-text hover:bg-ink-8"
            >
              前台檢視
            </a>
          ) : null}
          <Button onClick={submit} disabled={pending}>
            {pending ? '儲存中…' : '儲存'}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-divider">
        {(
          [
            ['content', '內容'],
            ['seo', 'SEO'],
            ['settings', '設定'],
          ] as const
        ).map(([key, text]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={cn(
              '-mb-px cursor-pointer border-b-2 px-3 py-2 text-[15px] transition-colors',
              tab === key
                ? 'border-accent font-bold text-text'
                : 'border-transparent text-ink-70 hover:text-text',
            )}
          >
            {text}
          </button>
        ))}

        <div className="ml-auto flex overflow-hidden rounded-md border border-divider">
          {locales.map((locale) => {
            const draft = contents.find((row) => row.locale === locale)!;
            const hasContent = Boolean(draft.title.trim() && draft.contentMd.trim());
            return (
              <button
                key={locale}
                type="button"
                onClick={() => setActiveLocale(locale)}
                className={cn(
                  'cursor-pointer px-3 py-1.5 text-[14px] transition-colors',
                  activeLocale === locale ? 'bg-accent text-bg' : 'text-text hover:bg-ink-8',
                )}
              >
                {locale === 'zh-TW' ? '中文' : 'English'}
                <span className={cn('ml-1.5', hasContent ? 'opacity-100' : 'opacity-40')}>
                  {hasContent ? '✓' : '✗'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {tab === 'content' ? (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className={label} htmlFor="post-title">
                標題
              </label>
              <input
                id="post-title"
                value={current.title}
                onChange={(event) => patchContent({ title: event.target.value })}
                className={field}
              />
            </div>
            <div>
              <label className={label} htmlFor="post-subtitle">
                副標
              </label>
              <input
                id="post-subtitle"
                value={current.subtitle}
                onChange={(event) => patchContent({ subtitle: event.target.value })}
                className={field}
              />
            </div>
          </div>

          <div>
            <label className={label} htmlFor="post-excerpt">
              摘要（留空會自動從內文擷取）
            </label>
            <textarea
              id="post-excerpt"
              rows={2}
              value={current.excerpt}
              onChange={(event) => patchContent({ excerpt: event.target.value })}
              className={`${field} resize-y`}
            />
          </div>

          <MarkdownEditor
            value={current.contentMd}
            onChange={(value) => patchContent({ contentMd: value })}
            onSave={submit}
          />
        </div>
      ) : null}

      {tab === 'seo' ? (
        <div className="max-w-2xl space-y-4">
          <div>
            <label className={label} htmlFor="post-seo-title">
              SEO 標題（留空則使用文章標題）
            </label>
            <input
              id="post-seo-title"
              value={current.seoTitle}
              onChange={(event) => patchContent({ seoTitle: event.target.value })}
              className={field}
            />
          </div>
          <div>
            <label className={label} htmlFor="post-seo-desc">
              SEO 描述
            </label>
            <textarea
              id="post-seo-desc"
              rows={3}
              value={current.seoDescription}
              onChange={(event) => patchContent({ seoDescription: event.target.value })}
              className={`${field} resize-y`}
            />
          </div>
          <div>
            <label className={label} htmlFor="post-canonical">
              Canonical URL
            </label>
            <input
              id="post-canonical"
              value={canonicalUrl}
              onChange={(event) => setCanonicalUrl(event.target.value)}
              placeholder="https://"
              className={field}
            />
          </div>
          <div>
            <label className={label} htmlFor="post-cover">
              封面圖網址
            </label>
            <input
              id="post-cover"
              value={coverUrl}
              onChange={(event) => setCoverUrl(event.target.value)}
              className={field}
            />
          </div>
        </div>
      ) : null}

      {tab === 'settings' ? (
        <div className="grid max-w-4xl gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div>
              <label className={label} htmlFor="post-slug">
                slug
              </label>
              <input
                id="post-slug"
                value={slug}
                onChange={(event) => setSlug(event.target.value)}
                className={field}
              />
              <p className="mt-1 text-[13px] text-ink-70">
                修改後會自動建立舊網址的 301 轉址。
              </p>
            </div>

            <div>
              <label className={label} htmlFor="post-status">
                狀態
              </label>
              <select
                id="post-status"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className={field}
              >
                <option value="draft">草稿</option>
                <option value="published">已發佈</option>
                <option value="unlisted">不列出</option>
                <option value="archived">已封存</option>
              </select>
            </div>

            <div>
              <label className={label} htmlFor="post-published">
                發佈時間
              </label>
              <input
                id="post-published"
                type="datetime-local"
                value={publishedAt}
                onChange={(event) => setPublishedAt(event.target.value)}
                className={field}
              />
            </div>

            <div className="space-y-2">
              {(
                [
                  [isPinned, setIsPinned, '置頂於列表最上方'],
                  [isFeatured, setIsFeatured, '設為精選'],
                  [allowComments, setAllowComments, '開放留言'],
                ] as const
              ).map(([checked, setter, text]) => (
                <label key={text} className="flex items-center gap-2.5 text-[15px]">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(event) => setter(event.target.checked)}
                    className="size-4 accent-[var(--color-accent)]"
                  />
                  {text}
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <span className={label}>分類（可多選，圓點為主分類）</span>
              <div className="space-y-1.5">
                {options.categories.map((category) => {
                  const checked = categoryIds.includes(category.id);
                  return (
                    <div key={category.id} className="flex items-center gap-2.5 text-[15px]">
                      <input
                        type="checkbox"
                        id={`cat-${category.id}`}
                        checked={checked}
                        onChange={(event) =>
                          setCategoryIds((ids) =>
                            event.target.checked
                              ? [...ids, category.id]
                              : ids.filter((id) => id !== category.id),
                          )
                        }
                        className="size-4 accent-[var(--color-accent)]"
                      />
                      <label htmlFor={`cat-${category.id}`} className="flex-1">
                        {category.name}
                      </label>
                      {checked ? (
                        <button
                          type="button"
                          onClick={() => setPrimaryCategoryId(category.id)}
                          title="設為主分類"
                          className={cn(
                            'size-3.5 cursor-pointer rounded-full border-2 transition-colors',
                            primaryCategoryId === category.id
                              ? 'border-accent bg-accent'
                              : 'border-divider',
                          )}
                        />
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <span className={label}>標籤</span>
              <div className="flex flex-wrap gap-1.5">
                {options.tags.map((tag) => {
                  const checked = tagIds.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() =>
                        setTagIds((ids) =>
                          checked ? ids.filter((id) => id !== tag.id) : [...ids, tag.id],
                        )
                      }
                      className={cn(
                        'cursor-pointer rounded-md border px-2.5 py-1 text-[14px] transition-colors',
                        checked
                          ? 'border-accent bg-accent-100 text-accent-800'
                          : 'border-divider text-text hover:bg-ink-8',
                      )}
                    >
                      {tag.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-[1fr_100px] gap-3">
              <div>
                <label className={label} htmlFor="post-series">
                  系列
                </label>
                <select
                  id="post-series"
                  value={seriesId}
                  onChange={(event) => setSeriesId(event.target.value)}
                  className={field}
                >
                  <option value="">不屬於系列</option>
                  {options.series.map((series) => (
                    <option key={series.id} value={series.id}>
                      {series.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={label} htmlFor="post-series-order">
                  序號
                </label>
                <input
                  id="post-series-order"
                  type="number"
                  value={seriesOrder}
                  onChange={(event) => setSeriesOrder(event.target.value)}
                  className={field}
                />
              </div>
            </div>

            {post && canDelete ? (
              <div className="border-t border-divider pt-4">
                <Button variant="secondary" onClick={remove} disabled={pending}>
                  刪除這篇文章
                </Button>
                <p className="mt-1.5 text-[13px] text-ink-70">刪除後無法復原。</p>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
