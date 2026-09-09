import Image from 'next/image';
import { getTranslations } from 'next-intl/server';

import { Container } from '@/components/ui/typography';
import { getSiteSettings } from '@/lib/data';
import type { Locale } from '@/lib/i18n/config';
import { Link } from '@/lib/i18n/routing';

const footerLinks = [
  { key: 'changelog', href: '/changelog' },
  { key: 'privacy', href: '/privacy' },
  { key: 'terms', href: '/terms' },
] as const;

export async function SiteFooter({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale });
  const settings = await getSiteSettings(locale);
  const year = new Date().getFullYear();

  return (
    <footer className="mt-24">
      <Container>
        <div className="h-px bg-divider" />
        <div className="flex flex-col gap-6 py-8 md:flex-row md:items-start md:justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/images/avatar.webp"
              alt={t('site.name')}
              width={40}
              height={40}
              className="size-10 shrink-0 rounded-full object-cover"
            />
            <div>
              <p className="font-heading text-[20px] font-bold tracking-[0.06em]">TSX</p>
              <p className="mt-0.5 text-[14px] text-ink-62">
                {t('site.name')} · {t('site.nameEn')} · {t('site.domain')}
              </p>
            </div>
          </div>

          <nav className="flex flex-wrap gap-x-5 gap-y-2 text-[14px]" aria-label="footer">
            {footerLinks.map((item) => (
              <Link key={item.key} href={item.href} className="text-text hover:text-accent">
                {t(`nav.${item.key}`)}
              </Link>
            ))}
            {settings.socialLinks.slice(0, 4).map((social) => (
              <a
                key={social.key}
                href={social.url}
                rel="me noopener noreferrer"
                target="_blank"
                className="text-text hover:text-accent"
              >
                {social.label}
              </a>
            ))}
          </nav>
        </div>
        <div className="flex flex-wrap justify-between gap-2 pb-10 text-kicker uppercase text-ink-55">
          <span>
            © {year} {t('site.name')}
          </span>
        </div>
      </Container>
    </footer>
  );
}
