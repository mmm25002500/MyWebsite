import { getTranslations } from 'next-intl/server';
import { Fragment } from 'react';

import { AdSlot } from '@/components/ads/ad-slot';
import { NotesSidebar } from '@/components/site/notes-sidebar';
import { Pagination } from '@/components/site/pagination';
import { PostListRow } from '@/components/site/post-list-row';
import { Container } from '@/components/ui/typography';
import { getPosts, type PostQuery } from '@/lib/data';
import type { Locale } from '@/lib/i18n/config';

/** 筆記列表的共用版面：主欄列表 + 側欄，桌機為 1fr／254px 兩欄。 */
export async function NotesList({
  locale,
  query,
  basePath,
  showSidebar = true,
}: {
  locale: Locale;
  query: Omit<PostQuery, 'locale'>;
  basePath: string;
  showSidebar?: boolean;
}) {
  const t = await getTranslations({ locale });
  const result = await getPosts({ locale, ...query });

  return (
    <Container className="pt-8">
      <div className="grid grid-cols-[minmax(0,1fr)] gap-11 md:grid-cols-[minmax(0,1fr)_254px]">
        <div>
          {result.items.length === 0 ? (
            <p className="py-16 text-center text-[15px] text-ink-55">{t('common.empty')}</p>
          ) : (
            result.items.map((post, index) => (
              <Fragment key={post.id}>
                <PostListRow post={post} locale={locale} />
                {/* 第四篇之後插一個版位，位置固定才不會每次換頁跳來跳去。 */}
                {index === 3 ? <AdSlot name="list" label={t('ads.label')} /> : null}
              </Fragment>
            ))
          )}

          <Pagination
            page={result.page}
            totalPages={result.totalPages}
            basePath={basePath}
            query={{ sort: query.sort }}
            previousLabel={t('common.previous')}
            nextLabel={t('common.next')}
          />
        </div>

        {showSidebar ? <NotesSidebar locale={locale} /> : null}
      </div>
    </Container>
  );
}
