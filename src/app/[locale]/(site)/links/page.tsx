import { ArrowSquareOutIcon } from '@phosphor-icons/react/dist/ssr';
import type { Metadata } from 'next';
import Image from 'next/image';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';

import { Container, Display, Kicker } from '@/components/ui/typography';
import { getLinkGroups, getSiteSettings } from '@/lib/data';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { cn } from '@/lib/utils';

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslations({ locale });
  return { title: t('links.title'), description: t('links.description') };
}

/** 連結樹。行動版優先的單欄版面（規格 §3.1）。 */
export default async function LinksPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  setRequestLocale(locale);

  const t = await getTranslations({ locale });
  const [groups, settings] = await Promise.all([getLinkGroups(locale), getSiteSettings(locale)]);

  return (
    <Container className="max-w-xl pt-16">
      <div className="text-center">
        <Image
          src="/images/avatar.webp"
          alt={t('site.name')}
          width={96}
          height={96}
          priority
          className="mx-auto size-24 rounded-full object-cover"
        />
        <Display as="h1" level={2} className="mt-5">
          {t('site.name')}
        </Display>
        <p className="mt-2 text-[15px] text-ink-62">{settings.heroTagline}</p>
      </div>

      <div className="mt-10 space-y-9">
        {groups.map((group) => (
          <section key={group.id}>
            <Kicker className="text-center">{group.name}</Kicker>
            <ul className="mt-3.5 space-y-2.5">
              {group.buttons.map((button) => (
                <li key={button.id}>
                  <a
                    href={button.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      'flex items-center gap-3 rounded-md border px-4 py-3.5 text-text transition-colors hover:text-text',
                      button.isHighlighted
                        ? 'border-accent bg-accent-100 hover:bg-accent-200'
                        : 'border-divider hover:bg-ink-8',
                    )}
                  >
                    <span className="size-8 shrink-0 rounded-sm media-slot" aria-hidden="true" />
                    <span className="min-w-0 flex-1">
                      <span className="block font-heading text-[16px] font-bold">
                        {button.label}
                      </span>
                      {button.description ? (
                        <span className="mt-0.5 block text-[13px] text-ink-62">
                          {button.description}
                        </span>
                      ) : null}
                    </span>
                    <ArrowSquareOutIcon
                      size={16}
                      weight="duotone"
                      className="shrink-0 opacity-50"
                    />
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </Container>
  );
}
