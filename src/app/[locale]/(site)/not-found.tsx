import { MagnifyingGlassIcon } from '@phosphor-icons/react/dist/ssr';
import { getTranslations } from 'next-intl/server';

import { PostListRow } from '@/components/site/post-list-row';
import { Button } from '@/components/ui/button';
import { Container, Display, Kicker } from '@/components/ui/typography';
import { getLatestPosts } from '@/lib/data';
import { defaultLocale } from '@/lib/i18n/config';
import { Link } from '@/lib/i18n/routing';

/**
 * 404。
 *
 * not-found 拿不到路由參數，因此語系固定用預設值——這一頁沒有內容需要翻譯以外
 * 的語系資訊，而 `getTranslations()` 會沿用當下請求的語系。
 */
export default async function NotFound() {
  const t = await getTranslations();

  // 死巷子裡給一條出路：讓讀者至少看得到最近寫了什麼。
  const recent = await getLatestPosts(defaultLocale, 4).catch(() => []);

  return (
    <Container className="py-24 md:py-32">
      <div className="mx-auto max-w-[52ch] text-center">
        <p
          aria-hidden
          className="font-heading text-[clamp(88px,20vw,180px)] font-bold leading-[0.85] tracking-tight text-ink-8"
        >
          404
        </p>
        <Display as="h1" level={2} className="mt-2">
          {t('common.notFoundTitle')}
        </Display>
        <p className="mt-4 text-lede text-ink-62">{t('common.notFoundBody')}</p>

        <div className="mt-8 flex flex-wrap justify-center gap-2">
          <Button as={Link} href="/">
            {t('common.backHome')}
          </Button>
          <Button as={Link} href="/notes" variant="secondary">
            {t('nav.notes')}
          </Button>
          <Button as={Link} href="/search" variant="secondary">
            <MagnifyingGlassIcon size={14} weight="duotone" />
            {t('nav.search')}
          </Button>
        </div>
      </div>

      {recent.length > 0 ? (
        <section className="mx-auto mt-16 max-w-[60ch] border-t border-divider pt-8">
          <Kicker>{t('home.latestPosts')}</Kicker>
          <div className="mt-3">
            {recent.map((post) => (
              <PostListRow key={post.id} post={post} locale={defaultLocale} />
            ))}
          </div>
        </section>
      ) : null}
    </Container>
  );
}
