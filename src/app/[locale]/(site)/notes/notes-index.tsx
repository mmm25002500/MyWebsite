import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';

import { CategoryTabs } from '@/components/site/category-tabs';
import { PageHeader } from '@/components/site/page-header';
import { Container } from '@/components/ui/typography';
import { getCategories } from '@/lib/data';
import type { Locale } from '@/lib/i18n/config';

import { NotesList } from './notes-list';

/**
 * 筆記列表的共用內容，給 `/notes`、`/notes/page/N`、以及分類的對應路由使用。
 *
 * 分頁走路徑而不是查詢字串：讀 `searchParams` 會讓整個路由被迫逐請求渲染，
 * Vercel 的邊緣快取一路 MISS，實測 TTFB 是其他頁面的兩倍多。改成路徑之後
 * 這些頁面可以預先渲染。
 */
export async function NotesIndex({
  locale,
  page,
  categorySlug,
}: {
  locale: Locale;
  page: number;
  categorySlug?: string;
}) {
  const t = await getTranslations({ locale });
  const categories = await getCategories(locale);

  const category = categorySlug ? categories.find((item) => item.slug === categorySlug) : undefined;
  if (categorySlug && !category) notFound();

  return (
    <>
      <PageHeader
        kicker={t('nav.notes')}
        title={category ? category.name : t('notes.title')}
        description={category ? (category.description ?? undefined) : t('notes.description')}
      />
      <Container className="mt-8">
        <CategoryTabs categories={categories} allLabel={t('notes.allCategories')} />
      </Container>
      <NotesList
        locale={locale}
        basePath={category ? `/notes/c/${category.slug}` : '/notes'}
        query={{ page, ...(category ? { categorySlug: category.slug } : {}) }}
      />
    </>
  );
}

/**
 * 列表共有幾頁。`/notes/page/N` 的 `generateStaticParams` 用它把每一頁都預先產生。
 */
export async function notesPageCount(locale: Locale, categorySlug?: string): Promise<number> {
  const { getPosts } = await import('@/lib/data');
  const result = await getPosts({ locale, page: 1, ...(categorySlug ? { categorySlug } : {}) });
  return result.totalPages;
}
