import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';

import { PageHeader } from '@/components/site/page-header';
import { YouTubeEmbed } from '@/components/site/youtube-embed';
import { Container } from '@/components/ui/typography';
import { getVideos } from '@/lib/data';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { formatDate, formatCompactNumber, formatDuration } from '@/lib/utils';

// 影片資料來自 6 小時快取的 YouTube 代理（規格 §4.2）。
export const revalidate = 21600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslations({ locale });
  return { title: t('videos.title'), description: t('videos.description') };
}

export default async function VideosPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  setRequestLocale(locale);

  const t = await getTranslations({ locale });
  const videos = await getVideos();

  return (
    <>
      <PageHeader
        kicker={t('nav.videos')}
        title={t('videos.title')}
        description={t('videos.description')}
      />

      <Container className="pt-10">
        {videos.length === 0 ? (
          <p className="py-16 text-center text-[15px] text-ink-55">{t('common.empty')}</p>
        ) : (
          <div className="grid gap-9 md:grid-cols-3">
            {videos.map((video) => (
              <article key={video.youtubeId}>
                <YouTubeEmbed
                  youtubeId={video.youtubeId}
                  title={video.title}
                  playLabel={t('videos.playVideo')}
                />
                <h2 className="mt-3 font-heading text-[17px] font-bold leading-tight">
                  {video.title}
                </h2>
                <p className="mt-1.5 text-[13px] text-ink-62">
                  {video.publishedAt ? formatDate(video.publishedAt, locale) : ''}
                  {video.viewCount > 0
                    ? ` · ${t('videos.watchCount', { count: formatCompactNumber(video.viewCount, locale) })}`
                    : ''}
                  {video.durationSeconds > 0 ? ` · ${formatDuration(video.durationSeconds)}` : ''}
                </p>
              </article>
            ))}
          </div>
        )}
      </Container>
    </>
  );
}
