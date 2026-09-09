import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentPropsWithoutRef, ElementType, Ref, ReactNode } from 'react';

import { cn } from '@/lib/utils';

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-1.5 whitespace-nowrap font-heading font-bold leading-tight rounded-md border border-transparent cursor-pointer transition-colors disabled:opacity-45 disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        primary: 'bg-accent text-bg hover:bg-accent-600 hover:text-bg active:bg-accent-700',
        secondary: 'border-divider text-text hover:bg-ink-8 hover:text-text active:bg-ink-30',
        ghost: 'text-accent hover:bg-accent/10 active:bg-accent/20',
      },
      size: {
        md: 'text-[15px] px-4 py-2.5',
        sm: 'text-[14px] px-3 py-1.5',
        icon: 'size-9 p-0',
      },
      block: {
        true: 'w-full',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

type ButtonProps<T extends ElementType> = {
  as?: T;
  children?: ReactNode;
  // React 19 起 ref 是一般的 prop，不需要 forwardRef。
  ref?: Ref<HTMLButtonElement>;
} & VariantProps<typeof buttonVariants> &
  Omit<ComponentPropsWithoutRef<T>, 'as' | 'children'>;

/** 動作元件。`as` 可換成 `Link` 或 `a`，樣式與語意分開。 */
export function Button<T extends ElementType = 'button'>({
  as,
  variant,
  size,
  block,
  className,
  children,
  ...props
}: ButtonProps<T>) {
  const Component = (as ?? 'button') as ElementType;
  return (
    <Component
      className={cn(buttonVariants({ variant, size, block }), className)}
      {...(Component === 'button' && !('type' in props) ? { type: 'button' } : {})}
      {...props}
    >
      {children}
    </Component>
  );
}
