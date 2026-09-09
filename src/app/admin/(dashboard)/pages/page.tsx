import Link from 'next/link';

import { getAdminPages } from '@/lib/data/queries/admin';
import { cn, formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const metadata = { title: '頁面' };

const sectionLabels: Record<string, string> = {
  hero: 'Hero',
  stats: '數據列',
  featured_projects: '精選專案',
  latest_posts: '最新筆記',
  skills: '核心技能',
  organizations: '我的團隊',
  videos: '精選影片',
  contact: '聯絡',
};

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
            <li key={page.id} className="flex flex-wrap items-baseline gap-3 rounded-lg border border-divider bg-surface p-3.5">
              <span className="font-bold">
                {page.pages_i18n.find((i) => i.locale === 'zh-TW')?.title ?? page.slug}
              </span>
              <span className="text-[14px] text-ink-70">/{page.slug}</span>
              <span className={cn('text-[14px]', page.status === 'published' ? 'text-accent-700' : 'text-ink-70')}>
                {page.status === 'published' ? '已發佈' : '草稿'}
              </span>
              <span className="ml-auto text-[14px] text-ink-70">
                {formatDate(page.updated_at, 'zh-TW')}
              </span>
              <Link href={`/${page.slug}`} target="_blank" className="text-[14px] text-ink-70 hover:text-accent">
                前台檢視
              </Link>
            </li>
          ))}
        </ul>
        <p className="text-[14px] text-ink-70">
          單頁的 Markdown 編輯介面尚未接上，目前內容由匯入腳本產生。
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="admin-section-title">首頁區塊</h2>
        <ul className="space-y-2">
          {sections.map((section) => (
            <li key={section.id} className="flex items-baseline gap-3 rounded-lg border border-divider bg-surface p-3.5">
              <span className="w-8 shrink-0 tabular-nums text-ink-70">{section.sort_order}</span>
              <span className="font-bold">{sectionLabels[section.section_key] ?? section.section_key}</span>
              <span className={cn('ml-auto text-[14px]', section.is_visible ? 'text-text' : 'text-ink-45')}>
                {section.is_visible ? '顯示' : '隱藏'}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
