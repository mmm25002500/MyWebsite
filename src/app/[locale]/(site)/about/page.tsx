import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';

import { Timeline } from '@/components/timeline/timeline';
import { Container, Display, Kicker, Lede } from '@/components/ui/typography';
import { Tag } from '@/components/ui/tag';
import { getInterests, getOrganizations, getProfileCopy, getTimeline } from '@/lib/data';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { Link } from '@/lib/i18n/routing';
import { formatPeriod } from '@/lib/utils';

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslations({ locale });
  return { title: t('about.title'), description: t('site.role') };
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  setRequestLocale(locale);

  const t = await getTranslations({ locale });
  const [timeline, interests, organizations] = await Promise.all([
    getTimeline(locale),
    getInterests(locale),
    getOrganizations(locale),
  ]);
  const profile = getProfileCopy(locale);

  return (
    <>
      <Container className="pt-14">
        <Kicker>{t('about.kicker')}</Kicker>
        <Display as="h1" level={1} className="mt-3 animate-rise text-[clamp(34px,6.5vw,64px)]">
          {t('about.title')}
        </Display>

        <div className="mt-9 grid gap-9 md:grid-cols-2">
          <div className="space-y-4.5">
            <Lede>{profile.summary}</Lede>
            <div className="flex flex-wrap gap-1.5">
              {profile.traits.map((trait) => (
                <Tag key={trait}>{trait}</Tag>
              ))}
            </div>
          </div>
          <div className="aspect-4/5 rounded-md media-slot" aria-hidden="true" />
        </div>
      </Container>

      <Container className="pt-16">
        <div className="flex flex-wrap items-baseline justify-between gap-3.5">
          <Display level={2}>{t('about.timeline')}</Display>
        </div>
        <div className="mt-5">
          <Timeline events={timeline} />
        </div>
      </Container>

      {organizations.length > 0 ? (
        <Container className="pt-16">
          <Display level={2} className="mb-5">
            {t('about.organizations')}
          </Display>
          <div className="grid gap-4.5 md:grid-cols-3">
            {organizations.map((org) => (
              <Link
                key={org.id}
                href={`/organizations/${org.slug}`}
                className="flex items-center gap-3.5 rounded-md bg-surface p-3.5 text-text transition-colors hover:bg-ink-8 hover:text-text"
              >
                <div className="size-11 shrink-0 rounded-sm media-slot" />
                <div className="min-w-0">
                  <p className="m-0 font-heading text-[16px] font-bold">{org.name}</p>
                  <p className="mt-0.5 text-[13px] text-ink-62">
                    {org.role} · {formatPeriod(org.startedAt, org.endedAt, t('common.present'))}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </Container>
      ) : null}

      {interests.length > 0 ? (
        <Container className="pt-16">
          <Display level={2} className="mb-6">
            {t('about.interests')}
          </Display>
          <div className="grid gap-6.5 md:grid-cols-3">
            {interests.map((interest) => (
              <div key={interest.id}>
                <h3 className="font-heading text-[18px] font-bold">{interest.title}</h3>
                {interest.description ? (
                  <p className="mt-1.5 text-[15px] leading-relaxed text-ink-62">
                    {interest.description}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </Container>
      ) : null}

      <Container className="pt-16">
        <Display level={2} className="mb-6">
          {t('about.beliefs')}
        </Display>
        <ol className="grid gap-6.5 md:grid-cols-3">
          {profile.beliefs.map((belief, index) => (
            <li key={belief}>
              <span className="font-heading text-d3 font-bold text-accent-700">
                {String(index + 1).padStart(2, '0')}
              </span>
              <p className="mt-2 text-lede italic leading-relaxed">{belief}</p>
            </li>
          ))}
        </ol>
      </Container>
    </>
  );
}
