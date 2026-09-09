'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { saveSetting } from '@/actions/resources';
import { Button } from '@/components/ui/button';
import type { Json } from '@/types/database';

interface SocialLink {
  key: string;
  label: string;
  url: string;
  icon: string;
}

const field =
  'w-full min-h-9 rounded-md border border-divider bg-bg px-2.5 py-1.5 text-[15px] text-text outline-none transition-colors focus-visible:border-accent';
const label = 'mb-1.5 block text-[14px] font-bold text-ink-70';

/**
 * 站台設定（規格 §8.9）。
 *
 * 只有 owner 能修改，且**敏感金鑰不在這裡** —— 依規格它們只放環境變數，
 * 後台不顯示也不儲存。
 */
export function SettingsForm({
  initial,
  canEdit,
}: {
  initial: Record<string, unknown>;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const [siteTitle, setSiteTitle] = useState(
    (initial.site_title as Record<string, string>) ?? { 'zh-TW': '', en: '' },
  );
  const [hero, setHero] = useState(
    (initial.hero as Record<string, string>) ?? { 'zh-TW': '', en: '' },
  );
  const [contactEmail, setContactEmail] = useState(String(initial.contact_email ?? ''));
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>(
    (initial.social_links as SocialLink[]) ?? [],
  );
  const [flags, setFlags] = useState({
    show_company_name: initial.show_company_name === true,
    show_certifications: initial.show_certifications === true,
    enable_three_background: initial.enable_three_background === true,
    comment_moderation: initial.comment_moderation === true,
  });

  const persist = (key: string, value: Json) => {
    setMessage(null);
    startTransition(async () => {
      const result = await saveSetting(key, value);
      setMessage(result.ok ? '已儲存' : (result.error ?? '儲存失敗'));
      if (result.ok) router.refresh();
    });
  };

  if (!canEdit) {
    return (
      <p className="rounded-lg border border-divider bg-surface p-4 text-[15px] text-ink-70">
        只有站長可以修改站台設定。
      </p>
    );
  }

  return (
    <div className="max-w-3xl space-y-8">
      {message ? <p className="text-[14px] text-accent-700">{message}</p> : null}

      <section className="space-y-3 rounded-lg border border-divider bg-surface p-4">
        <h2 className="admin-section-title">一般</h2>

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className={label} htmlFor="s-title-zh">站名（中文）</label>
            <input id="s-title-zh" value={siteTitle['zh-TW'] ?? ''} onChange={(e) => setSiteTitle((v) => ({ ...v, 'zh-TW': e.target.value }))} className={field} />
          </div>
          <div>
            <label className={label} htmlFor="s-title-en">站名（英文）</label>
            <input id="s-title-en" value={siteTitle.en ?? ''} onChange={(e) => setSiteTitle((v) => ({ ...v, en: e.target.value }))} className={field} />
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className={label} htmlFor="s-hero-zh">Hero 文案（中文）</label>
            <textarea id="s-hero-zh" rows={3} value={hero['zh-TW'] ?? ''} onChange={(e) => setHero((v) => ({ ...v, 'zh-TW': e.target.value }))} className={`${field} resize-y`} />
          </div>
          <div>
            <label className={label} htmlFor="s-hero-en">Hero 文案（英文）</label>
            <textarea id="s-hero-en" rows={3} value={hero.en ?? ''} onChange={(e) => setHero((v) => ({ ...v, en: e.target.value }))} className={`${field} resize-y`} />
          </div>
        </div>

        <div>
          <label className={label} htmlFor="s-email">公開聯絡信箱</label>
          <input id="s-email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} className={field} />
        </div>

        <Button
          size="sm"
          disabled={pending}
          onClick={() => {
            persist('site_title', siteTitle as Json);
            persist('hero', hero as Json);
            persist('contact_email', contactEmail as Json);
          }}
        >
          儲存一般設定
        </Button>
      </section>

      <section className="space-y-3 rounded-lg border border-divider bg-surface p-4">
        <h2 className="admin-section-title">顯示</h2>
        {(
          [
            ['show_company_name', '履歷顯示現職公司名稱'],
            ['show_certifications', '顯示證照區'],
            ['enable_three_background', '啟用首頁背景動畫'],
            ['comment_moderation', '留言需先審核才顯示'],
          ] as const
        ).map(([key, text]) => (
          <label key={key} className="flex items-center gap-2.5 text-[15px]">
            <input
              type="checkbox"
              checked={flags[key]}
              onChange={(event) => {
                const next = event.target.checked;
                setFlags((current) => ({ ...current, [key]: next }));
                persist(key, next);
              }}
              className="size-4 accent-[var(--color-accent)]"
            />
            {text}
          </label>
        ))}
      </section>

      <section className="space-y-3 rounded-lg border border-divider bg-surface p-4">
        <h2 className="admin-section-title">社群連結</h2>
        {socialLinks.map((link, index) => (
          <div key={index} className="flex flex-wrap gap-2">
            <input value={link.label} placeholder="名稱" onChange={(e) => setSocialLinks((rows) => rows.map((row, i) => (i === index ? { ...row, label: e.target.value } : row)))} className={`${field} w-32`} />
            <input value={link.url} placeholder="網址" onChange={(e) => setSocialLinks((rows) => rows.map((row, i) => (i === index ? { ...row, url: e.target.value } : row)))} className={`${field} flex-1`} />
            <button type="button" onClick={() => setSocialLinks((rows) => rows.filter((_, i) => i !== index))} className="cursor-pointer px-2 text-[14px] text-ink-70 hover:text-accent-2-700">
              移除
            </button>
          </div>
        ))}
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => setSocialLinks((rows) => [...rows, { key: `link-${rows.length}`, label: '', url: '', icon: 'link' }])}>
            新增連結
          </Button>
          <Button size="sm" disabled={pending} onClick={() => persist('social_links', socialLinks as unknown as Json)}>
            儲存社群連結
          </Button>
        </div>
      </section>

      <section className="rounded-lg border border-divider bg-surface p-4">
        <h2 className="admin-section-title">金鑰</h2>
        <p className="mt-2 text-[15px] text-ink-70">
          API 金鑰、資料庫密碼等敏感設定只放環境變數，後台不顯示也不儲存（規格 §8.9）。
          需要變更請改 Vercel 的環境變數或本機的 .env.local。
        </p>
      </section>
    </div>
  );
}
