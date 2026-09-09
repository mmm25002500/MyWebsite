import { Link } from '@/lib/i18n/routing';
import { cn } from '@/lib/utils';

/** 列表分頁。以連結呈現，不需要 JavaScript。 */
export function Pagination({
  page,
  totalPages,
  basePath,
  query = {},
  previousLabel,
  nextLabel,
}: {
  page: number;
  totalPages: number;
  basePath: string;
  query?: Record<string, string | undefined>;
  previousLabel: string;
  nextLabel: string;
}) {
  if (totalPages <= 1) return null;

  const href = (targetPage: number) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value) params.set(key, value);
    }
    if (targetPage > 1) params.set('page', String(targetPage));
    const search = params.toString();
    return search ? `${basePath}?${search}` : basePath;
  };

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1).filter(
    (item) => item === 1 || item === totalPages || Math.abs(item - page) <= 1,
  );

  return (
    <nav className="mt-10 flex flex-wrap items-center justify-center gap-1.5 text-[15px]">
      {page > 1 ? (
        <Link href={href(page - 1)} className="px-3 py-1.5 text-text hover:text-accent">
          ← {previousLabel}
        </Link>
      ) : null}

      {pages.map((item, index) => (
        <span key={item} className="flex items-center gap-1.5">
          {index > 0 && item - (pages[index - 1] ?? 0) > 1 ? (
            <span className="text-ink-55">…</span>
          ) : null}
          <Link
            href={href(item)}
            aria-current={item === page ? 'page' : undefined}
            className={cn(
              'min-w-9 rounded-md px-3 py-1.5 text-center transition-colors',
              item === page ? 'bg-accent text-bg' : 'text-text hover:bg-ink-8',
            )}
          >
            {item}
          </Link>
        </span>
      ))}

      {page < totalPages ? (
        <Link href={href(page + 1)} className="px-3 py-1.5 text-text hover:text-accent">
          {nextLabel} →
        </Link>
      ) : null}
    </nav>
  );
}
