import { cn } from '@/lib/utils';

/** 載入骨架的單一色塊。 */
export function SkeletonBar({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-ink-8', className)} aria-hidden="true" />;
}

/** 列表型頁面的載入骨架：頁首 + 數列。 */
export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="pt-14">
      <SkeletonBar className="h-3 w-16" />
      <SkeletonBar className="mt-4 h-12 w-64" />
      <div className="mt-10 space-y-6">
        {Array.from({ length: rows }, (_, index) => (
          <div key={index} className="space-y-2 border-t border-divider pt-5">
            <SkeletonBar className="h-2.5 w-40" />
            <SkeletonBar className="h-6 w-3/4" />
            <SkeletonBar className="h-3 w-full max-w-[60ch]" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** 卡片型頁面的載入骨架。 */
export function CardsSkeleton({ cards = 6 }: { cards?: number }) {
  return (
    <div className="pt-14">
      <SkeletonBar className="h-3 w-16" />
      <SkeletonBar className="mt-4 h-12 w-56" />
      <div className="mt-10 grid gap-9 md:grid-cols-3">
        {Array.from({ length: cards }, (_, index) => (
          <div key={index} className="space-y-3">
            <SkeletonBar className="aspect-16/10 w-full" />
            <SkeletonBar className="h-2.5 w-20" />
            <SkeletonBar className="h-5 w-2/3" />
            <SkeletonBar className="h-3 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
