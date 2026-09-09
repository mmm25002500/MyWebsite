import type { ReactNode } from 'react';

import { Container, Display, Kicker, Lede } from '@/components/ui/typography';

/** 內頁的統一頁首：眉題、標題、導言。以留白分節，不畫線。 */
export function PageHeader({
  kicker,
  title,
  description,
  children,
}: {
  kicker?: string;
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <Container className="pt-14">
      {kicker ? <Kicker>{kicker}</Kicker> : null}
      <Display as="h1" level={1} className="mt-3 animate-rise text-[clamp(34px,6.5vw,64px)]">
        {title}
      </Display>
      {description ? <Lede className="mt-5 max-w-[62ch] text-ink-62">{description}</Lede> : null}
      {children}
    </Container>
  );
}
