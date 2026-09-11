import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';

import { AuthForm } from '@/components/site/auth/auth-form';
import { isLocale } from '@/lib/i18n/config';

/*
 * 釘成動態渲染，讓中介層的 CSP nonce 一定蓋得進 script 標籤。
 *
 * 預先渲染的 HTML 只產生一次、逐請求現產的 nonce 蓋不進去，而這條路徑走的是帶
 * nonce 的嚴格政策，靜態化就會讓行內腳本全被擋、整頁空白。表單頁沒有內容快取的
 * 價值，直接放棄 ISR 換取這個保證。
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
  return { title: t('auth.loginTitle'), robots: { index: false, follow: false } };
}

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const { next, error } = await searchParams;
  /*
   * `error` 由 /api/auth/callback 帶回來：OAuth 或信件連結兌換失敗時不該靜悄悄。
   * 只顯示一句本地化的說明——Supabase 的原文是給開發者看的（例如「PKCE code
   * verifier not found in storage」），對訪客沒有意義。原始原因留在網址裡。
   */
  const t = await getTranslations({ locale });
  return (
    <AuthForm
      mode="login"
      nextPath={next}
      initialError={error ? t('auth.oauthFailed') : undefined}
    />
  );
}
