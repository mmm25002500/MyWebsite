import Link from 'next/link';

import { PostTable } from '@/components/admin/post-table';
import { Button } from '@/components/ui/button';
import { getAdminPosts, getPostFormOptions } from '@/lib/data/queries/admin';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const statusFilters = [
  { value: undefined, label: '全部' },
  { value: 'published', label: '已發佈' },
  { value: 'draft', label: '草稿' },
  { value: 'unlisted', label: '不列出' },
  { value: 'archived', label: '已封存' },
] as const;

export default async function AdminPostsPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    category?: string;
    tag?: string;
    q?: string;
    missing?: string;
    page?: string;
  }>;
}) {
  const query = await searchParams;

  const [{ rows, total, page, totalPages }, options] = await Promise.all([
    getAdminPosts({
      status: query.status,
      categoryId: query.category,
      tagId: query.tag,
      search: query.q,
      missingLocale: query.missing,
      page: query.page ? Number(query.page) : 1,
    }),
    getPostFormOptions(),
  ]);

  const href = (patch: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries({ ...query, ...patch })) {
      if (value) params.set(key, value);
    }
    params.delete('page');
    const search = params.toString();
    return search ? `/admin/posts?${search}` : '/admin/posts';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <div>
          <h1 className="text-[28px] font-bold">筆記</h1>
          <p className="mt-1.5 text-[15px] text-ink-70">共 {total} 篇</p>
        </div>
        <Button as={Link} href="/admin/posts/new" className="ml-auto">
          寫新文章
        </Button>
      </div>

      <div className="space-y-3 rounded-lg border border-divider bg-surface p-4">
        <form action="/admin/posts" method="get" className="flex gap-2">
          {query.status ? <input type="hidden" name="status" value={query.status} /> : null}
          <input
            type="search"
            name="q"
            defaultValue={query.q ?? ''}
            placeholder="搜尋標題或 slug"
            className="min-h-9 flex-1 rounded-md border border-divider bg-bg px-2.5 py-1.5 text-[15px] text-text outline-none focus-visible:border-accent"
          />
          <Button type="submit" size="sm" variant="secondary">
            搜尋
          </Button>
        </form>

        <div className="flex flex-wrap items-baseline gap-2">
          <span className="w-14 shrink-0 text-[14px] font-bold text-ink-70">狀態</span>
          {statusFilters.map((filter) => (
            <Link
              key={filter.label}
              href={href({ status: filter.value })}
              className={cn(
                'rounded-md px-2.5 py-1 text-[14px] transition-colors',
                (query.status ?? undefined) === filter.value
                  ? 'bg-accent font-bold text-bg'
                  : 'text-text hover:bg-ink-8',
              )}
            >
              {filter.label}
            </Link>
          ))}
        </div>

        <div className="flex flex-wrap items-baseline gap-2">
          <span className="w-14 shrink-0 text-[14px] font-bold text-ink-70">分類</span>
          <Link
            href={href({ category: undefined })}
            className={cn(
              'rounded-md px-2.5 py-1 text-[14px] transition-colors',
              !query.category ? 'bg-accent font-bold text-bg' : 'text-text hover:bg-ink-8',
            )}
          >
            全部
          </Link>
          {options.categories.map((category) => (
            <Link
              key={category.id}
              href={href({ category: category.id })}
              className={cn(
                'rounded-md px-2.5 py-1 text-[14px] transition-colors',
                query.category === category.id
                  ? 'bg-accent font-bold text-bg'
                  : 'text-text hover:bg-ink-8',
              )}
            >
              {category.name}
            </Link>
          ))}
        </div>

        <div className="flex flex-wrap items-baseline gap-2">
          <span className="w-14 shrink-0 text-[14px] font-bold text-ink-70">語言</span>
          <Link
            href={href({ missing: undefined })}
            className={cn(
              'rounded-md px-2.5 py-1 text-[14px] transition-colors',
              !query.missing ? 'bg-accent font-bold text-bg' : 'text-text hover:bg-ink-8',
            )}
          >
            全部
          </Link>
          <Link
            href={href({ missing: 'en' })}
            className={cn(
              'rounded-md px-2.5 py-1 text-[14px] transition-colors',
              query.missing === 'en' ? 'bg-accent font-bold text-bg' : 'text-text hover:bg-ink-8',
            )}
          >
            缺英文版
          </Link>
        </div>
      </div>

      <PostTable rows={rows} />

      {totalPages > 1 ? (
        <nav className="flex justify-center gap-1.5 text-[15px]">
          {Array.from({ length: totalPages }, (_, index) => index + 1).map((item) => {
            const params = new URLSearchParams();
            for (const [key, value] of Object.entries(query)) if (value) params.set(key, value);
            if (item > 1) params.set('page', String(item));
            else params.delete('page');
            const search = params.toString();

            return (
              <Link
                key={item}
                href={search ? `/admin/posts?${search}` : '/admin/posts'}
                className={cn(
                  'min-w-9 rounded-md px-3 py-1.5 text-center transition-colors',
                  item === page ? 'bg-accent text-bg' : 'text-text hover:bg-ink-8',
                )}
              >
                {item}
              </Link>
            );
          })}
        </nav>
      ) : null}
    </div>
  );
}
