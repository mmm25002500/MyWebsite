import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { AdsPrivacyNotice } from '@/components/ads/ads-privacy-notice';
import { MarkdownContent } from '@/components/content/markdown-content';
import { PageHeader } from '@/components/site/page-header';
import { Container } from '@/components/ui/typography';
import { getStaticPage } from '@/lib/data';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { notFoundMetadata, pageAlternates } from '@/lib/seo';

/** `pages` 表驅動的單頁（privacy、terms…）共用的呈現與 metadata。 */
export async function staticPageMetadata(locale: string, slug: string): Promise<Metadata> {
  if (!isLocale(locale)) return {};
  const page = await getStaticPage(locale, slug);
  if (!page) return notFoundMetadata;
  return {
    title: page.seoTitle ?? page.title,
    description: page.seoDescription ?? undefined,
    alternates: pageAlternates(locale, `/${slug}`),
  };
}

export async function StaticPageView({ locale, slug }: { locale: Locale; slug: string }) {
  const page = await getStaticPage(locale, slug);
  if (!page) notFound();

  return (
    <>
      <PageHeader title={page.title} />
      <Container className="pt-10">
        <div className="max-w-[70ch]">
          <MarkdownContent html={page.contentHtml} />
          {slug === 'privacy' ? <AdsPrivacyNotice locale={locale} /> : null}
        </div>
      </Container>
    </>
  );
}
