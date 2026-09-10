import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';

import { PageHeader } from '@/components/site/page-header';
import { Tag } from '@/components/ui/tag';
import { Container, Display, Kicker, Lede } from '@/components/ui/typography';
import {
  getCertifications,
  getEducation,
  getExperiences,
  getLanguages,
  getProfileCopy,
  getSiteSettings,
  getSkillGroups,
} from '@/lib/data';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { formatPeriod } from '@/lib/utils';
import { pageAlternates } from '@/lib/seo';
import type { EmploymentType, LanguageProficiency } from '@/types/content';

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslations({ locale });
  return {
    title: t('resume.title'),
    description: t('site.role'),
    alternates: pageAlternates(locale, '/resume'),
  };
}

export default async function ResumePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  setRequestLocale(locale);

  const t = await getTranslations({ locale });
  const [settings, experiences, education, skillGroups, languages] = await Promise.all([
    getSiteSettings(locale),
    getExperiences(locale),
    getEducation(locale),
    getSkillGroups(locale),
    getLanguages(locale),
  ]);
  const certifications = settings.showCertifications ? await getCertifications(locale) : [];
  const profile = getProfileCopy(locale);

  const employmentLabel: Record<EmploymentType, string> = {
    full_time: t('resume.typeFullTime'),
    founder: t('resume.typeFounder'),
    freelance: t('resume.typeFreelance'),
    part_time: t('resume.typePartTime'),
    intern: t('resume.typeIntern'),
  };

  const proficiencyLabel: Record<LanguageProficiency, string> = {
    native: t('resume.proficiencyNative'),
    fluent: t('resume.proficiencyFluent'),
    intermediate: t('resume.proficiencyIntermediate'),
    basic: t('resume.proficiencyBasic'),
  };

  return (
    <>
      <PageHeader kicker={t('nav.resume')} title={t('resume.title')} />

      <Container className="pt-12">
        <section>
          <Display level={2} className="mb-4">
            {t('resume.summary')}
          </Display>
          <Lede className="max-w-[68ch] text-ink-62">{profile.summary}</Lede>
        </section>

        <section className="pt-14">
          <Display level={2} className="mb-6">
            {t('resume.experience')}
          </Display>
          <ol className="space-y-9">
            {experiences.map((experience) => (
              <li key={experience.id} className="grid gap-3 md:grid-cols-[160px_minmax(0,1fr)]">
                <div>
                  <Kicker>
                    {formatPeriod(experience.startedAt, experience.endedAt, t('common.present'))}
                  </Kicker>
                  <p className="mt-1 text-[13px] text-ink-55">
                    {employmentLabel[experience.employmentType]}
                  </p>
                </div>
                <div>
                  <h3 className="font-heading text-[20px] font-bold">{experience.title}</h3>
                  {settings.showCompanyName && experience.showCompanyName ? (
                    <p className="mt-0.5 text-[15px] text-accent-700">{experience.companyName}</p>
                  ) : null}

                  {experience.highlights.length > 0 ? (
                    <details className="group mt-3" open>
                      <summary className="cursor-pointer list-none font-heading text-kicker uppercase text-ink-55 marker:hidden">
                        <span className="group-open:hidden">{t('resume.expand')}</span>
                        <span className="hidden group-open:inline">{t('resume.collapse')}</span>
                      </summary>
                      <ul className="mt-2.5 list-disc space-y-1.5 pl-5 text-[15px] leading-relaxed text-ink-62">
                        {experience.highlights.map((highlight) => (
                          <li key={highlight}>{highlight}</li>
                        ))}
                      </ul>
                    </details>
                  ) : null}

                  {experience.tech.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {experience.tech.map((tech) => (
                        <Tag key={tech}>{tech}</Tag>
                      ))}
                    </div>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="pt-14">
          <Display level={2} className="mb-6">
            {t('resume.education')}
          </Display>
          <ol className="space-y-6">
            {education.map((item) => (
              <li key={item.id} className="grid gap-3 md:grid-cols-[160px_minmax(0,1fr)]">
                <Kicker>{formatPeriod(item.startedAt, item.endedAt, t('common.present'))}</Kicker>
                <div>
                  <h3 className="font-heading text-[18px] font-bold">{item.school}</h3>
                  <p className="mt-0.5 text-[15px] text-ink-62">
                    {[item.field, item.degree].filter(Boolean).join(' · ')}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="pt-14">
          <Display level={2} className="mb-6">
            {t('resume.skills')}
          </Display>
          <div className="grid gap-6.5 md:grid-cols-2">
            {skillGroups.map((group) => (
              <div key={group.id}>
                <h3 className="font-heading text-[18px] font-bold text-text">{group.name}</h3>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {group.skills.map((skill) => (
                    <Tag key={skill.id} variant={skill.isPrimary ? 'accent' : 'bordered'}>
                      {skill.name}
                    </Tag>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="pt-14">
          <Display level={2} className="mb-6">
            {t('resume.languages')}
          </Display>
          <ul className="flex flex-wrap gap-x-9 gap-y-3 text-[15px]">
            {languages.map((language) => (
              <li key={language.id}>
                <span className="font-heading font-bold">{language.name}</span>
                <span className="ml-2 text-ink-62">{proficiencyLabel[language.proficiency]}</span>
              </li>
            ))}
          </ul>
        </section>

        {certifications.length > 0 ? (
          <section className="pt-14">
            <Display level={2} className="mb-6">
              {t('resume.certifications')}
            </Display>
            <ul className="space-y-3 text-[15px]">
              {certifications.map((certification) => (
                <li key={certification.id}>
                  <span className="font-heading font-bold">{certification.name}</span>
                  <span className="ml-2 text-ink-62">{certification.issuer}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </Container>
    </>
  );
}
