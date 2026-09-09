import { getTranslations } from 'next-intl/server';

import type { Locale } from '@/lib/i18n/config';
import { Link } from '@/lib/i18n/routing';
import { formatDate } from '@/lib/utils';
import type { PostSummary } from '@/types/content';

/** 筆記列表的一列。報紙式的橫列，靠上緣細線分隔。 */
export async function PostListRow({ post, locale }: { post: PostSummary; locale: Locale }) {
  const t = await getTranslations({ locale });

  return (
    <article className="border-t border-divider transition-colors hover:bg-ink-4">
      <Link href={`/notes/p/${post.slug}`} className="block px-1 py-4.5 text-text hover:text-text">
        <p className="font-heading text-kicker font-bold uppercase text-ink-55">
          {formatDate(post.publishedAt, locale)}
          {post.categories.length > 0
            ? ` · ${post.categories.map((category) => category.name).join('、')}`
            : ''}
          {` · ${t('common.minutesRead', { minutes: post.readingTimeMin })}`}
          {post.isPinned ? ` · ${t('notes.pinned')}` : ''}
        </p>
        <h3 className="mt-1 font-heading text-[clamp(19px,2.2vw,25px)] font-bold leading-tight">
          {post.title}
        </h3>
        {post.excerpt ? (
          <p className="mt-1.5 max-w-[70ch] text-[15px] leading-relaxed text-ink-62">{post.excerpt}</p>
        ) : null}
      </Link>
    </article>
  );
}
