import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';

import { cn } from '@/lib/utils';

export const tagVariants = cva(
  'inline-flex items-center text-kicker normal-case tracking-[0.02em] px-2.5 py-[3px] rounded-sm',
  {
    variants: {
      variant: {
        accent: 'bg-accent-100 text-accent-800',
        accent2: 'bg-accent-2-100 text-accent-2-800',
        neutral: 'bg-neutral-100 text-neutral-800',
        outline: 'border border-accent text-accent',
        /* 技能項目：以框線界定而非底色，深色主題下不會糊成一片。 */
        bordered: 'border border-divider text-text hover:border-accent hover:text-accent-700',
      },
    },
    defaultVariants: { variant: 'neutral' },
  },
);

type TagProps<T extends ElementType> = {
  as?: T;
  children?: ReactNode;
} & VariantProps<typeof tagVariants> &
  Omit<ComponentPropsWithoutRef<T>, 'as' | 'children'>;

export function Tag<T extends ElementType = 'span'>({
  as,
  variant,
  className,
  children,
  ...props
}: TagProps<T>) {
  const Component = (as ?? 'span') as ElementType;
  return (
    <Component className={cn(tagVariants({ variant }), className)} {...props}>
      {children}
    </Component>
  );
}
