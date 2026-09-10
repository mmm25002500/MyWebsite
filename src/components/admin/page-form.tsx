'use client';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { savePage } from '@/actions/pages';
import { Button } from '@/components/ui/button';
import { locales, type Locale } from '@/lib/i18n/config';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';

// 編輯器只在這一頁用得到，動態載入才不會讓其他後台頁面一起背這包。
const MarkdownEditor = dynamic(
  () => import('@/components/editor/markdown-editor').then((mod) => mod.MarkdownEditor),
  {
    ssr: false,
    loading: () => (
      <div className="h-[680px] animate-pulse rounded-lg border border-divider bg-surface" />
    ),
  },
);

export interface PageContentDraft {
  locale: Locale;
  title: string;
  contentMd: string;
  seoTitle: string;
  seoDescription: string;
}

export interface AdminPageDetail {
  id: string;
  slug: string;
  status: 'draft' | 'published';
  contents: PageContentDraft[];
}

const field =
  'w-full rounded-md border border-divider bg-bg px-3 py-2 text-[15px] text-text outline-none focus:border-accent';

/** 單頁編輯（規格 §8.5）。slug 固定，因為 `/privacy` 與 `/terms` 是寫在路由裡的。 */
export function PageForm({ page }: { page: AdminPageDetail }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [activeLocale, setActiveLocale] = useState<Locale>('zh-TW');
  const [status, setStatus] = useState(page.status);
  const [tab, setTab] = useState<'content' | 'seo'>('content');

  const [contents, setContents] = useState<PageContentDraft[]>(() =>
    locales.map(
      (locale) =>
        page.contents.find((row) => row.locale === locale) ?? {
          locale,
          title: '',
          contentMd: '',
          seoTitle: '',
          seoDescription: '',
        },
    ),
  );

  const current = contents.find((row) => row.locale === activeLocale)!;

  const patch = (values: Partial<PageContentDraft>) =>
    setContents((rows) =>
      rows.map((row) => (row.locale === activeLocale ? { ...row, ...values } : row)),
    );

  const submit = () => {
    startTransition(async () => {
      // 完全沒填標題的語系不送出，免得在資料庫留下空白的翻譯列。
      const filled = contents.filter((row) => row.title.trim().length > 0);
      if (filled.length === 0) {
        toast.error('至少要填一個語系的標題');
        return;
      }

      const result = await savePage({ id: page.id, status, contents: filled });
      if (!result.ok) {
        toast.error(result.error ?? '儲存失敗');
        return;
      }

      if (result.issues && result.issues.length > 0) {
        toast.success(`已儲存，但有 ${result.issues.length} 個指令警告`);
      } else {
        toast.success('已儲存');
      }
      router.refresh();
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-[28px] font-bold">{current.title || page.slug}</h1>
          <p className="mt-1 text-[14px] text-ink-70">/{page.slug}</p>
        </div>

        <div className="ml-auto flex items-center gap-2.5">
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as 'draft' | 'published')}
            className={cn(field, 'w-auto')}
          >
            <option value="published">已發佈</option>
            <option value="draft">草稿</option>
          </select>
          <Button as="a" href={`/${page.slug}`} target="_blank" variant="secondary">
            前台檢視
          </Button>
          <Button type="button" onClick={submit} disabled={pending}>
            {pending ? '儲存中…' : '儲存'}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b border-divider pb-2.5">
        {(['content', 'seo'] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            className={cn(
              'rounded-md px-3 py-1.5 text-[15px]',
              tab === item ? 'bg-ink-8 font-bold text-text' : 'text-ink-70 hover:text-text',
            )}
          >
            {item === 'content' ? '內容' : 'SEO'}
          </button>
        ))}

        <div className="ml-auto flex gap-1.5">
          {locales.map((locale) => (
            <button
              key={locale}
              type="button"
              onClick={() => setActiveLocale(locale)}
              className={cn(
                'rounded-md px-3 py-1.5 text-[15px]',
                activeLocale === locale ? 'bg-accent text-bg' : 'text-text hover:bg-ink-8',
              )}
            >
              {locale === 'zh-TW' ? '中文' : 'English'}
              {contents.find((row) => row.locale === locale)?.title ? ' ✓' : ''}
            </button>
          ))}
        </div>
      </div>

      {tab === 'content' ? (
        <div className="space-y-4">
          <div>
            <label className="admin-label" htmlFor="page-title">
              標題
            </label>
            <input
              id="page-title"
              className={field}
              value={current.title}
              onChange={(event) => patch({ title: event.target.value })}
            />
          </div>

          <MarkdownEditor
            value={current.contentMd}
            onChange={(value) => patch({ contentMd: value })}
            onSave={submit}
          />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="admin-label" htmlFor="page-seo-title">
              SEO 標題（留空沿用標題）
            </label>
            <input
              id="page-seo-title"
              className={field}
              value={current.seoTitle}
              onChange={(event) => patch({ seoTitle: event.target.value })}
            />
          </div>
          <div>
            <label className="admin-label" htmlFor="page-seo-description">
              SEO 描述
            </label>
            <input
              id="page-seo-description"
              className={field}
              value={current.seoDescription}
              onChange={(event) => patch({ seoDescription: event.target.value })}
            />
          </div>
        </div>
      )}
    </div>
  );
}
