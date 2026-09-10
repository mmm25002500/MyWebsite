import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

import { getCategories } from '@/lib/data';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { localePath, notFoundMetadata, pageAlternates } from '@/lib/seo';

import { NotesIndex, notesPageCount } from '../../../../notes-index';

export const revalidate = 3600;

/*
 * 刻意不寫 `generateStaticParams`。
 *
 * 建置時逐一數頁數，等於每個語系（乘上每個分類）都打一次資料庫，實測會把
 * Supabase 打到 Gateway Timeout、整個建置失敗。這些頁面有 `revalidate`，
 * 第一次被造訪時產生並快取就夠了。
 *
 * 附帶的好處：沒有預先產生的參數，`notFound()` 才回得了真正的 404——有預先
 * 渲染參數的路由會先把 shell 串流出去，狀態列那時就送出了，改不回來。
 */

function parsePage(value: string): number | null {
  if (!/^[1-9][0-9]*$/.test(value)) return null;
  return Number(value);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; category: string; page: string }>;
}): Promise<Metadata> {
  const { locale, category: slug, page } = await params;
  if (!isLocale(locale)) return {};
  const parsed = parsePage(page);
  if (parsed === null) return {};

  const category = (await getCategories(locale)).find((item) => item.slug === slug);
  if (!category) return notFoundMetadata;

  return {
    title: `${category.name} · ${parsed}`,
    description: category.description ?? undefined,
    alternates: pageAlternates(locale, `/notes/c/${slug}/page/${parsed}`),
  };
}

export default async function CategoryPagedPage({
  params,
}: {
  params: Promise<{ locale: string; category: string; page: string }>;
}) {
  const { locale: raw, category: slug, page } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  setRequestLocale(locale);

  const parsed = parsePage(page);
  if (parsed === null) notFound();
  if (parsed === 1) redirect(localePath(locale, `/notes/c/${slug}`));

  const total = await notesPageCount(locale, slug);
  if (parsed > total) notFound();

  return <NotesIndex locale={locale} page={parsed} categorySlug={slug} />;
}
