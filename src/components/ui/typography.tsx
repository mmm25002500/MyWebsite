import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';

import { cn } from '@/lib/utils';

/** 頁面容器。報紙版面的量測欄寬。 */
export function Container({ className, children, ...props }: ComponentPropsWithoutRef<'div'>) {
  return (
    <div className={cn('w-full max-w-page mx-auto px-[22px] md:px-11', className)} {...props}>
      {children}
    </div>
  );
}

type PolymorphicProps<T extends ElementType> = {
  as?: T;
  children?: ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'children'>;

/** 眉題：小字、全大寫、寬字距，用來標示區塊。 */
export function Kicker<T extends ElementType = 'p'>({
  as,
  className,
  children,
  ...props
}: PolymorphicProps<T>) {
  const Component = (as ?? 'p') as ElementType;
  return (
    <Component
      className={cn('font-heading text-kicker font-bold uppercase text-ink-55 m-0', className)}
      {...props}
    >
      {children}
    </Component>
  );
}

/** 報紙標題。`level` 只決定字級，語意標籤由 `as` 決定。 */
export function Display<T extends ElementType = 'h2'>({
  as,
  level = 2,
  className,
  children,
  ...props
}: PolymorphicProps<T> & { level?: 1 | 2 | 3 }) {
  const Component = (as ?? 'h2') as ElementType;
  const size = level === 1 ? 'text-d1' : level === 2 ? 'text-d2' : 'text-d3';
  return (
    <Component className={cn('font-heading font-bold m-0', size, className)} {...props}>
      {children}
    </Component>
  );
}

/** 導言段落。 */
export function Lede({ className, children, ...props }: ComponentPropsWithoutRef<'p'>) {
  return (
    <p className={cn('text-lede m-0', className)} {...props}>
      {children}
    </p>
  );
}

/** 報紙頭版的粗細線對——區塊之間唯一允許出現的線。 */
export function RuleFurniture({ children }: { children?: ReactNode }) {
  return (
    <div>
      <div className="h-1 bg-text" />
      {children ? (
        <div className="flex flex-wrap justify-between gap-x-6 gap-y-2 py-2 text-kicker uppercase text-ink-55">
          {children}
        </div>
      ) : null}
      <div className="h-px bg-text" />
    </div>
  );
}
