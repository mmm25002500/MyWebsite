import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';

import { CopyButton } from '@/components/site/copy-button';
import { PageHeader } from '@/components/site/page-header';
import { Button } from '@/components/ui/button';
import { Container, Display, Kicker, Lede } from '@/components/ui/typography';
import { getSponsorMethods, getSponsors } from '@/lib/data';
import { sponsorIntro, sponsorPerks } from '@/lib/data/seed/site';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { pageAlternates } from '@/lib/seo';

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslations({ locale });
  return { title: t('sponsor.title'), alternates: pageAlternates(locale, '/sponsor') };
}

export default async function SponsorPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  setRequestLocale(locale);

  const t = await getTranslations({ locale });
  const [methods, sponsors] = await Promise.all([getSponsorMethods(locale), getSponsors(locale)]);

  return (
    <>
      <PageHeader kicker={t('nav.sponsor')} title={t('sponsor.title')} />

      <Container className="pt-10">
        <Lede className="max-w-[62ch] text-ink-62">{sponsorIntro[locale]}</Lede>
      </Container>

      <Container className="pt-14">
        <Display level={2} className="mb-6">
          {t('sponsor.methods')}
        </Display>
        <div className="grid gap-4.5 md:grid-cols-3">
          {methods.map((method) => (
            <div key={method.id} className="flex flex-col gap-2.5 rounded-md bg-surface p-4">
              <h3 className="font-heading text-[18px] font-bold">{method.label}</h3>
              {method.network ? (
                <Kicker>
                  {t('sponsor.network')} · {method.network}
                </Kicker>
              ) : null}
              {method.note ? (
                <p className="flex-1 text-[14px] leading-relaxed text-ink-62">{method.note}</p>
              ) : null}

              {method.type === 'crypto' ? (
                method.addressOrUrl ? (
                  <>
                    <code className="block break-all rounded-md bg-bg px-2.5 py-2 text-[13px]">
                      {method.addressOrUrl}
                    </code>
                    <CopyButton
                      value={method.addressOrUrl}
                      label={t('sponsor.copyAddress')}
                      copiedLabel={t('common.copied')}
                    />
                  </>
                ) : (
                  <p className="text-[13px] text-ink-55">{t('common.empty')}</p>
                )
              ) : (
                <Button
                  as="a"
                  href={method.addressOrUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  size="sm"
                >
                  {method.label}
                </Button>
              )}
            </div>
          ))}
        </div>
      </Container>

      <Container className="pt-14">
        <Display level={2} className="mb-5">
          {t('sponsor.perks')}
        </Display>
        <ul className="max-w-[62ch] list-disc space-y-2 pl-5 text-ink-62">
          {sponsorPerks[locale].map((perk) => (
            <li key={perk}>{perk}</li>
          ))}
        </ul>
      </Container>

      {sponsors.length > 0 ? (
        <Container className="pt-14">
          <Display level={2} className="mb-5">
            {t('sponsor.sponsors')}
          </Display>
          <ul className="flex flex-wrap gap-3">
            {sponsors.map((sponsor) => (
              <li key={sponsor.id} className="rounded-md bg-surface px-3.5 py-2 text-[15px]">
                {sponsor.isAnonymous ? t('sponsor.anonymous') : sponsor.displayName}
              </li>
            ))}
          </ul>
        </Container>
      ) : null}
    </>
  );
}
