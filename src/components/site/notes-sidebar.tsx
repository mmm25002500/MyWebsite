import { getTranslations } from 'next-intl/server';

import { Tag } from '@/components/ui/tag';
import { getPostArchive, getSeriesList, getTags } from '@/lib/data';
import type { Locale } from '@/lib/i18n/config';
import { Link } from '@/lib/i18n/routing';

/** 筆記頁側欄：標籤雲、系列文、封存。 */
export async function NotesSidebar({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale });
  const [tags, series, archive] = await Promise.all([
    getTags(locale),
    getSeriesList(locale),
    getPostArchive(locale),
  ]);

  return (
    <aside className="space-y-9 text-[15px]">
      {tags.length > 0 ? (
        <section>
          <p className="font-heading text-kicker font-bold uppercase text-ink-55">
            {t('notes.tagCloud')}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {tags.slice(0, 24).map((tag) => (
              <Tag
                key={tag.id}
                as={Link}
                href={`/notes/tag/${tag.slug}`}
                className="hover:bg-accent-100"
              >
                {tag.name}
              </Tag>
            ))}
          </div>
        </section>
      ) : null}

      {series.length > 0 ? (
        <section>
          <p className="font-heading text-kicker font-bold uppercase text-ink-55">
            {t('notes.series')}
          </p>
          <ul className="mt-3 space-y-2">
            {series.map((item) => (
              <li key={item.id}>
                <Link href={`/notes/series/${item.slug}`} className="text-text hover:text-accent">
                  {item.title}
                </Link>
                {item.postCount > 0 ? (
                  <span className="ml-1.5 text-[13px] text-ink-55">
                    {t('notes.postsCount', { count: item.postCount })}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {archive.length > 0 ? (
        <section>
          <p className="font-heading text-kicker font-bold uppercase text-ink-55">
            {t('notes.archive')}
          </p>
          <ul className="mt-3 space-y-2">
            {archive.slice(0, 6).map((group) => (
              <li key={group.year}>
                <Link href="/notes/archive" className="text-text hover:text-accent">
                  {group.year}
                </Link>
                <span className="ml-1.5 text-[13px] text-ink-55">
                  {t('notes.postsCount', {
                    count: group.months.reduce((total, month) => total + month.posts.length, 0),
                  })}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </aside>
  );
}
