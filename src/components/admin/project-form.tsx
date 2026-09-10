'use client';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { deleteProject, saveProject } from '@/actions/projects';
import { Button } from '@/components/ui/button';
import type { AdminProjectDetail } from '@/lib/data/queries/admin';
import { locales, type Locale } from '@/lib/i18n/config';
import { projectLinkTypes, projectStatuses } from '@/lib/validators/project';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/toast';

const MarkdownEditor = dynamic(
  () => import('@/components/editor/markdown-editor').then((mod) => mod.MarkdownEditor),
  {
    ssr: false,
    loading: () => (
      <div className="h-[680px] animate-pulse rounded-lg border border-divider bg-surface" />
    ),
  },
);

const MAX_IMAGES = 10;

const statusLabels: Record<string, string> = {
  idea: '構想中',
  in_progress: '進行中',
  completed: '已完成',
  maintained: '維護中',
  archived: '已封存',
};

const linkTypeLabels: Record<string, string> = {
  demo: 'Demo',
  github: 'GitHub',
  appstore: 'App Store',
  playstore: 'Google Play',
  docs: '文件',
  video: '影片',
  article: '文章',
  other: '其他',
};

interface Option {
  id: string;
  name: string;
}

interface ContentDraft {
  locale: Locale;
  name: string;
  tagline: string;
  summary: string;
  contentMd: string;
  role: string;
  seoTitle: string;
  seoDescription: string;
}

const field =
  'w-full min-h-9 rounded-md border border-divider bg-bg px-2.5 py-1.5 text-[15px] text-text outline-none transition-colors focus-visible:border-accent';
const label = 'mb-1.5 block text-[14px] font-bold text-ink-70';

export function ProjectForm({
  project,
  options,
  canDelete,
}: {
  project: AdminProjectDetail | null;
  options: {
    categories: Option[];
    organizations: Option[];
    tags: Option[];
    posts: Option[];
  };
  canDelete: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [tab, setTab] = useState<'basic' | 'images' | 'links' | 'content' | 'related'>('basic');
  const [activeLocale, setActiveLocale] = useState<Locale>('zh-TW');

  const [slug, setSlug] = useState(project?.slug ?? '');
  const [status, setStatus] = useState(project?.status ?? 'in_progress');
  const [startedAt, setStartedAt] = useState(project?.startedAt ?? '');
  const [endedAt, setEndedAt] = useState(project?.endedAt ?? '');
  const [categoryId, setCategoryId] = useState(project?.categoryId ?? '');
  const [organizationId, setOrganizationId] = useState(project?.organizationId ?? '');
  const [coverUrl, setCoverUrl] = useState(project?.coverUrl ?? '');
  const [githubRepo, setGithubRepo] = useState(project?.githubRepo ?? '');
  const [isFeatured, setIsFeatured] = useState(project?.isFeatured ?? false);
  const [isVisible, setIsVisible] = useState(project?.isVisible ?? true);
  const [allowComments, setAllowComments] = useState(project?.allowComments ?? false);
  const [sortOrder, setSortOrder] = useState(project?.sortOrder ?? 0);
  const [tagIds, setTagIds] = useState<string[]>(project?.tagIds ?? []);
  const [relatedPostIds, setRelatedPostIds] = useState<string[]>(project?.relatedPostIds ?? []);
  const [metrics, setMetrics] = useState<{ key: string; value: string }[]>(
    Object.entries(project?.metrics ?? {}).map(([key, value]) => ({ key, value })),
  );
  // id 為 null 代表尚未存進 DB 的新項目。
  interface ImageDraft {
    id: string | null;
    url: string;
    alt: string;
    caption: string;
    isCover: boolean;
  }
  interface LinkDraft {
    id: string | null;
    type: (typeof projectLinkTypes)[number];
    url: string;
    label: string;
  }

  const [images, setImages] = useState<ImageDraft[]>(project?.images ?? []);
  const [links, setLinks] = useState<LinkDraft[]>(
    project?.links.map((link) => ({
      ...link,
      type: link.type as (typeof projectLinkTypes)[number],
    })) ?? [],
  );

  const [contents, setContents] = useState<ContentDraft[]>(() =>
    locales.map((locale) => {
      const existing = project?.contents.find((row) => row.locale === locale);
      return {
        locale,
        name: existing?.name ?? '',
        tagline: existing?.tagline ?? '',
        summary: existing?.summary ?? '',
        contentMd: existing?.contentMd ?? '',
        role: existing?.role ?? '',
        seoTitle: existing?.seoTitle ?? '',
        seoDescription: existing?.seoDescription ?? '',
      };
    }),
  );

  const current = contents.find((row) => row.locale === activeLocale)!;
  const patchContent = (patch: Partial<ContentDraft>) =>
    setContents((rows) =>
      rows.map((row) => (row.locale === activeLocale ? { ...row, ...patch } : row)),
    );

  const submit = () => {
    const filled = contents.filter((row) => row.name.trim());
    if (filled.length === 0) {
      toast.error('至少要有一個語系填了名稱');
      return;
    }

    startTransition(async () => {
      const result = await saveProject({
        id: project?.id ?? null,
        slug,
        status: status as (typeof projectStatuses)[number],
        startedAt,
        endedAt: endedAt || null,
        categoryId: categoryId || null,
        organizationId: organizationId || null,
        coverUrl: coverUrl || null,
        githubRepo: githubRepo || null,
        isFeatured,
        isVisible,
        allowComments,
        sortOrder,
        metrics: Object.fromEntries(
          metrics.filter((row) => row.key.trim()).map((row) => [row.key, row.value]),
        ),
        tagIds,
        relatedPostIds,
        images: images.map((image) => ({
          id: image.id,
          url: image.url,
          alt: image.alt,
          caption: image.caption,
          isCover: image.isCover,
        })),
        links: links.map((link) => ({
          id: link.id,
          type: link.type,
          url: link.url,
          label: link.label,
        })),
        contents: filled.map((row) => ({
          locale: row.locale,
          name: row.name,
          tagline: row.tagline || null,
          summary: row.summary || null,
          contentMd: row.contentMd,
          role: row.role || null,
          seoTitle: row.seoTitle || null,
          seoDescription: row.seoDescription || null,
        })),
      });

      if (!result.ok) {
        toast.error(result.error ?? '儲存失敗');
        return;
      }

      toast.success('已儲存');
      if (!project && result.projectId) router.replace(`/admin/projects/${result.projectId}`);
      else router.refresh();
    });
  };

  const remove = () => {
    if (!project) return;
    startTransition(async () => {
      const result = await deleteProject(project.id);
      if (!result.ok) {
        toast.error(result.error ?? '刪除失敗');
        return;
      }
      router.push('/admin/projects');
    });
  };

  const move = <T,>(list: T[], from: number, to: number): T[] => {
    if (to < 0 || to >= list.length) return list;
    const next = [...list];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item!);
    return next;
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-[28px] font-bold">
            {project ? current.name || project.slug : '新作品'}
          </h1>
          <p className="mt-1 text-[14px] text-ink-70">
            {project ? `/projects/${project.slug}` : '尚未儲存'}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {project ? (
            <a
              href={`/projects/${project.slug}`}
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
            ['basic', '基本'],
            ['images', `圖片 ${images.length}/${MAX_IMAGES}`],
            ['links', `連結 ${links.length}`],
            ['content', '詳細內容'],
            ['related', '關聯'],
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
          {locales.map((locale) => (
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
            </button>
          ))}
        </div>
      </div>

      {tab === 'basic' ? (
        <div className="grid max-w-5xl gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div>
              <label className={label} htmlFor="p-name">
                名稱
              </label>
              <input
                id="p-name"
                value={current.name}
                onChange={(e) => patchContent({ name: e.target.value })}
                className={field}
              />
            </div>
            <div>
              <label className={label} htmlFor="p-tagline">
                一句話
              </label>
              <input
                id="p-tagline"
                value={current.tagline}
                onChange={(e) => patchContent({ tagline: e.target.value })}
                className={field}
              />
            </div>
            <div>
              <label className={label} htmlFor="p-summary">
                摘要
              </label>
              <textarea
                id="p-summary"
                rows={3}
                value={current.summary}
                onChange={(e) => patchContent({ summary: e.target.value })}
                className={`${field} resize-y`}
              />
            </div>
            <div>
              <label className={label} htmlFor="p-role">
                我的角色
              </label>
              <input
                id="p-role"
                value={current.role}
                onChange={(e) => patchContent({ role: e.target.value })}
                className={field}
              />
            </div>
            <div>
              <label className={label} htmlFor="p-slug">
                slug
              </label>
              <input
                id="p-slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className={field}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={label} htmlFor="p-start">
                  開始日期
                </label>
                <input
                  id="p-start"
                  type="date"
                  value={startedAt}
                  onChange={(e) => setStartedAt(e.target.value)}
                  className={field}
                />
              </div>
              <div>
                <label className={label} htmlFor="p-end">
                  結束日期（留空＝進行中）
                </label>
                <input
                  id="p-end"
                  type="date"
                  value={endedAt}
                  onChange={(e) => setEndedAt(e.target.value)}
                  className={field}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={label} htmlFor="p-status">
                  狀態
                </label>
                <select
                  id="p-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className={field}
                >
                  {projectStatuses.map((value) => (
                    <option key={value} value={value}>
                      {statusLabels[value]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={label} htmlFor="p-order">
                  排序
                </label>
                <input
                  id="p-order"
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(Number(e.target.value))}
                  className={field}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={label} htmlFor="p-category">
                  分類
                </label>
                <select
                  id="p-category"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className={field}
                >
                  <option value="">未分類</option>
                  {options.categories.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={label} htmlFor="p-org">
                  所屬團隊
                </label>
                <select
                  id="p-org"
                  value={organizationId}
                  onChange={(e) => setOrganizationId(e.target.value)}
                  className={field}
                >
                  <option value="">無</option>
                  {options.organizations.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className={label} htmlFor="p-github">
                GitHub（owner 或 owner/repo）
              </label>
              <input
                id="p-github"
                value={githubRepo}
                onChange={(e) => setGithubRepo(e.target.value)}
                className={field}
              />
            </div>

            <div>
              <label className={label} htmlFor="p-cover">
                封面圖網址
              </label>
              <input
                id="p-cover"
                value={coverUrl}
                onChange={(e) => setCoverUrl(e.target.value)}
                className={field}
              />
            </div>

            <div className="space-y-2">
              {(
                [
                  [isVisible, setIsVisible, '在前台顯示'],
                  [isFeatured, setIsFeatured, '設為精選'],
                  [allowComments, setAllowComments, '開放留言'],
                ] as const
              ).map(([checked, setter, text]) => (
                <label key={text} className="flex items-center gap-2.5 text-[15px]">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => setter(e.target.checked)}
                    className="size-4 accent-[var(--color-accent)]"
                  />
                  {text}
                </label>
              ))}
            </div>

            <div>
              <span className={label}>成果數據</span>
              <div className="space-y-2">
                {metrics.map((metric, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      value={metric.key}
                      placeholder="項目"
                      onChange={(e) =>
                        setMetrics((rows) =>
                          rows.map((row, i) =>
                            i === index ? { ...row, key: e.target.value } : row,
                          ),
                        )
                      }
                      className={field}
                    />
                    <input
                      value={metric.value}
                      placeholder="數值"
                      onChange={(e) =>
                        setMetrics((rows) =>
                          rows.map((row, i) =>
                            i === index ? { ...row, value: e.target.value } : row,
                          ),
                        )
                      }
                      className={field}
                    />
                    <button
                      type="button"
                      onClick={() => setMetrics((rows) => rows.filter((_, i) => i !== index))}
                      className="shrink-0 cursor-pointer px-2 text-[14px] text-ink-70 hover:text-accent-2-700"
                    >
                      移除
                    </button>
                  </div>
                ))}
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setMetrics((rows) => [...rows, { key: '', value: '' }])}
                >
                  新增數據
                </Button>
              </div>
            </div>

            {project && canDelete ? (
              <div className="border-t border-divider pt-4">
                <Button variant="secondary" onClick={remove} disabled={pending}>
                  刪除這個作品
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {tab === 'images' ? (
        <div className="max-w-3xl space-y-3">
          <p className="text-[14px] text-ink-70">
            最多 {MAX_IMAGES} 張。第一張若未指定封面則作為封面。
          </p>
          {images.map((image, index) => (
            <div
              key={index}
              className="flex flex-wrap items-start gap-3 rounded-lg border border-divider bg-surface p-3"
            >
              <div className="size-16 shrink-0 overflow-hidden rounded-md media-slot">
                {image.url ? (
                  // 圖片來源可能是任意 Storage 路徑，不走 next/image 的最佳化。
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={image.url} alt="" className="size-full object-cover" />
                ) : null}
              </div>
              <div className="flex-1 space-y-2">
                <input
                  value={image.url}
                  placeholder="圖片網址"
                  onChange={(e) =>
                    setImages((rows) =>
                      rows.map((row, i) => (i === index ? { ...row, url: e.target.value } : row)),
                    )
                  }
                  className={field}
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={image.alt}
                    placeholder="替代文字"
                    onChange={(e) =>
                      setImages((rows) =>
                        rows.map((row, i) => (i === index ? { ...row, alt: e.target.value } : row)),
                      )
                    }
                    className={field}
                  />
                  <input
                    value={image.caption}
                    placeholder="圖說"
                    onChange={(e) =>
                      setImages((rows) =>
                        rows.map((row, i) =>
                          i === index ? { ...row, caption: e.target.value } : row,
                        ),
                      )
                    }
                    className={field}
                  />
                </div>
                <div className="flex flex-wrap items-center gap-3 text-[14px]">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="cover"
                      checked={image.isCover}
                      onChange={() =>
                        setImages((rows) =>
                          rows.map((row, i) => ({ ...row, isCover: i === index })),
                        )
                      }
                      className="size-4 accent-[var(--color-accent)]"
                    />
                    設為封面
                  </label>
                  <button
                    type="button"
                    onClick={() => setImages((rows) => move(rows, index, index - 1))}
                    className="cursor-pointer text-ink-70 hover:text-accent"
                  >
                    上移
                  </button>
                  <button
                    type="button"
                    onClick={() => setImages((rows) => move(rows, index, index + 1))}
                    className="cursor-pointer text-ink-70 hover:text-accent"
                  >
                    下移
                  </button>
                  <button
                    type="button"
                    onClick={() => setImages((rows) => rows.filter((_, i) => i !== index))}
                    className="cursor-pointer text-ink-70 hover:text-accent-2-700"
                  >
                    移除
                  </button>
                </div>
              </div>
            </div>
          ))}
          <Button
            size="sm"
            variant="secondary"
            disabled={images.length >= MAX_IMAGES}
            onClick={() =>
              setImages((rows) => [
                ...rows,
                { id: null, url: '', alt: '', caption: '', isCover: rows.length === 0 },
              ])
            }
          >
            新增圖片
          </Button>
        </div>
      ) : null}

      {tab === 'links' ? (
        <div className="max-w-3xl space-y-3">
          {links.map((link, index) => (
            <div
              key={index}
              className="flex flex-wrap items-center gap-2 rounded-lg border border-divider bg-surface p-3"
            >
              <select
                value={link.type}
                onChange={(e) =>
                  setLinks((rows) =>
                    rows.map((row, i) =>
                      i === index
                        ? { ...row, type: e.target.value as (typeof projectLinkTypes)[number] }
                        : row,
                    ),
                  )
                }
                className={`${field} w-32`}
              >
                {projectLinkTypes.map((value) => (
                  <option key={value} value={value}>
                    {linkTypeLabels[value]}
                  </option>
                ))}
              </select>
              <input
                value={link.label}
                placeholder="標籤"
                onChange={(e) =>
                  setLinks((rows) =>
                    rows.map((row, i) => (i === index ? { ...row, label: e.target.value } : row)),
                  )
                }
                className={`${field} w-40`}
              />
              <input
                value={link.url}
                placeholder="https://"
                onChange={(e) =>
                  setLinks((rows) =>
                    rows.map((row, i) => (i === index ? { ...row, url: e.target.value } : row)),
                  )
                }
                className={`${field} flex-1`}
              />
              <button
                type="button"
                onClick={() => setLinks((rows) => rows.filter((_, i) => i !== index))}
                className="cursor-pointer px-2 text-[14px] text-ink-70 hover:text-accent-2-700"
              >
                移除
              </button>
            </div>
          ))}
          <Button
            size="sm"
            variant="secondary"
            onClick={() =>
              setLinks((rows) => [...rows, { id: null, type: 'demo' as const, url: '', label: '' }])
            }
          >
            新增連結
          </Button>
        </div>
      ) : null}

      {tab === 'content' ? (
        <MarkdownEditor
          value={current.contentMd}
          onChange={(value) => patchContent({ contentMd: value })}
          onSave={submit}
        />
      ) : null}

      {tab === 'related' ? (
        <div className="grid max-w-4xl gap-6 md:grid-cols-2">
          <div>
            <span className={label}>技術標籤</span>
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
          <div>
            <span className={label}>關聯文章（Case Study）</span>
            <div className="max-h-80 space-y-1.5 overflow-y-auto">
              {options.posts.map((post) => (
                <label key={post.id} className="flex items-center gap-2.5 text-[15px]">
                  <input
                    type="checkbox"
                    checked={relatedPostIds.includes(post.id)}
                    onChange={(e) =>
                      setRelatedPostIds((ids) =>
                        e.target.checked ? [...ids, post.id] : ids.filter((id) => id !== post.id),
                      )
                    }
                    className="size-4 accent-[var(--color-accent)]"
                  />
                  {post.name}
                </label>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
