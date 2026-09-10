import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound, redirect } from 'next/navigation';

import { AccountPanel } from '@/components/site/auth/account-panel';
import { LinkedAccounts } from '@/components/site/auth/linked-accounts';
import { TotpSetup } from '@/components/site/auth/totp-setup';
import { PageHeader } from '@/components/site/page-header';
import { Container, Display } from '@/components/ui/typography';
import { getViewerProfile } from '@/lib/data/queries/viewer';
import { hasSupabase } from '@/lib/env';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { Link } from '@/lib/i18n/routing';
import { formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslations({ locale });
  return { title: t('auth.accountTitle'), robots: { index: false, follow: false } };
}

export default async function AccountPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  setRequestLocale(locale);

  const t = await getTranslations({ locale });
  const viewer = hasSupabase ? await getViewerProfile() : null;

  if (!viewer) redirect('/login?next=/account');

  return (
    <>
      <PageHeader kicker={t('nav.account')} title={viewer.displayName} />

      <Container className="pt-8">
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
          <div>
            <p className="text-[30px] font-bold leading-none tabular-nums text-accent-700">
              {viewer.commentCount}
            </p>
            <p className="mt-1.5 text-[14px] text-ink-70">{t('auth.commentCount')}</p>
          </div>
          <div>
            <p className="text-[30px] font-bold leading-none tabular-nums text-accent-700">
              {viewer.likeCount}
            </p>
            <p className="mt-1.5 text-[14px] text-ink-70">{t('auth.likeCount')}</p>
          </div>
          <div>
            <p className="text-[16px]">{formatDate(viewer.joinedAt, locale)}</p>
            <p className="mt-1.5 text-[14px] text-ink-70">{t('auth.joinedAt')}</p>
          </div>
        </div>
      </Container>

      <Container className="pt-14">
        <Display level={2} className="mb-4">
          {t('auth.security')}
        </Display>
        <div className="max-w-[60ch] space-y-5">
          <div className="rounded-lg border border-divider bg-surface p-5">
            <TotpSetup />
          </div>

          <div className="rounded-lg border border-divider bg-surface p-5">
            <p className="font-heading text-[16px] font-bold">{t('auth.linkedAccounts')}</p>
            <p className="mb-3 mt-1 text-[14px] text-ink-62">{t('auth.linkedAccountsHint')}</p>
            <LinkedAccounts />
          </div>
        </div>
      </Container>

      <Container className="pt-14">
        <Display level={2} className="mb-6">
          {t('auth.myComments')}
        </Display>

        {viewer.comments.length === 0 ? (
          <p className="py-12 text-center text-[15px] text-ink-70">{t('auth.noComments')}</p>
        ) : (
          <ul className="divide-y divide-divider">
            {viewer.comments.map((comment) => (
              <li key={comment.id} className="py-5">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-[14px] text-ink-70">
                  <span>{formatDate(comment.createdAt, locale)}</span>
                  {comment.postSlug && comment.postTitle ? (
                    <Link
                      href={`/notes/p/${comment.postSlug}`}
                      className="text-accent-700 hover:text-accent"
                    >
                      {comment.postTitle}
                    </Link>
                  ) : null}
                  {comment.status === 'deleted' ? (
                    <span className="text-accent-2-700">{t('notes.commentDeleted')}</span>
                  ) : null}
                </div>
                {comment.status !== 'deleted' ? (
                  <p className="mt-2 whitespace-pre-wrap text-[16px] leading-relaxed">
                    {comment.content}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Container>

      <Container className="pt-14">
        <Display level={2} className="mb-6">
          {t('auth.profile')}
        </Display>
        <AccountPanel email={viewer.email} />
      </Container>
    </>
  );
}
