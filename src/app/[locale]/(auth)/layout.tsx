import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';

import { Container } from '@/components/ui/typography';
import { isLocale } from '@/lib/i18n/config';
import { Link } from '@/lib/i18n/routing';

export default async function AuthLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  return (
    <div className="min-h-screen bg-bg text-text">
      <Container className="flex min-h-screen max-w-md flex-col justify-center py-16">
        <Link
          href="/"
          className="mb-8 text-center font-heading text-[20px] font-bold tracking-[0.06em] text-text hover:text-accent"
        >
          TSX
        </Link>
        {children}
      </Container>
    </div>
  );
}
