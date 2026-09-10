import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';

import { SetNewPassword } from '@/components/site/auth/set-new-password';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { noIndex } from '@/lib/seo';

/*
 * 釘成動態渲染，理由同其他表單頁：這條路徑走帶 nonce 的嚴格 CSP，靜態化會讓
 * 行內腳本全被擋、整頁空白。
 */
export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslations({ locale });
  return { title: t('auth.setNewPasswordTitle'), robots: noIndex };
}

/**
 * 密碼重設信的落地頁。
 *
 * 信件連結先進 `/api/auth/callback` 把 `?code=` 換成 session，再轉來這裡。到得了
 * 這一頁就表示信箱的擁有權已經被證明，所以不再問目前的密碼——會點這封信的人正是
 * 因為不記得密碼。
 */
export default async function SetNewPasswordPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  setRequestLocale(locale);

  return <SetNewPassword />;
}
