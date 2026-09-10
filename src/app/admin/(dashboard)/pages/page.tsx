import Link from 'next/link';

import { HomeSections } from '@/components/admin/home-sections';
import { getAdminPages } from '@/lib/data/queries/admin';
import { cn, formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const metadata = { title: '頁面' };

export default async function AdminPagesPage() {
  const { pages, sections } = await getAdminPages();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-[28px] font-bold">頁面</h1>
        <p className="mt-1.5 text-[15px] text-ink-70">單頁內容與首頁區塊設定。</p>
      </div>

      <section className="space-y-3">
        <h2 className="admin-section-title">單頁</h2>
        <ul className="space-y-2">
          {pages.map((page) => (
            <li
              key={page.id}
              className="flex flex-wrap items-baseline gap-3 rounded-lg border border-divider bg-surface p-3.5"
            >
              <span className="font-bold">
                {page.pages_i18n.find((i) => i.locale === 'zh-TW')?.title ?? page.slug}
              </span>
              <span className="text-[14px] text-ink-70">/{page.slug}</span>
              <span
                className={cn(
                  'text-[14px]',
                  page.status === 'published' ? 'text-accent-700' : 'text-ink-70',
                )}
              >
                {page.status === 'published' ? '已發佈' : '草稿'}
              </span>
              <span className="ml-auto text-[14px] text-ink-70">
                {formatDate(page.updated_at, 'zh-TW')}
              </span>
              <Link
                href={`/${page.slug}`}
                target="_blank"
                className="text-[14px] text-ink-70 hover:text-accent"
              >
                前台檢視
              </Link>
              <Link
                href={`/admin/pages/${page.slug}`}
                className="text-[14px] font-bold text-accent-700 hover:text-accent"
              >
                編輯
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="admin-section-title">首頁區塊</h2>
        <HomeSections
          sections={sections.map((section) => ({
            id: section.id,
            sectionKey: section.section_key,
            isVisible: section.is_visible,
            sortOrder: section.sort_order,
          }))}
        />
      </section>
    </div>
  );
}
