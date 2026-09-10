import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';

import { ContactForm } from '@/components/site/contact-form';
import { ObfuscatedEmail } from '@/components/site/obfuscated-email';
import { PageHeader } from '@/components/site/page-header';
import { Button } from '@/components/ui/button';
import { Container, Display } from '@/components/ui/typography';
import { getSiteSettings } from '@/lib/data';
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
  return {
    title: t('contact.title'),
    description: t('contact.description'),
    alternates: pageAlternates(locale, '/contact'),
  };
}

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  setRequestLocale(locale);

  const t = await getTranslations({ locale });
  const settings = await getSiteSettings(locale);
  const [user = 'hello', domain = 'example.com'] = settings.contactEmail.split('@');

  return (
    <>
      <PageHeader
        kicker={t('nav.contact')}
        title={t('contact.title')}
        description={t('contact.description')}
      />

      <Container className="pt-10">
        <p className="text-lede">
          <ObfuscatedEmail user={user} domain={domain} />
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          {settings.socialLinks.map((social) => (
            <Button
              key={social.key}
              as="a"
              href={social.url}
              target="_blank"
              rel="me noopener noreferrer"
              variant="secondary"
              size="sm"
            >
              {social.label}
            </Button>
          ))}
        </div>
      </Container>

      <Container className="pt-14">
        <Display level={2} className="mb-6">
          {t('contact.title')}
        </Display>
        <ContactForm />
      </Container>
    </>
  );
}
