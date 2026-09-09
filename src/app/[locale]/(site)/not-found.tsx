import { getTranslations } from 'next-intl/server';

import { Button } from '@/components/ui/button';
import { Container, Display, Kicker } from '@/components/ui/typography';
import { Link } from '@/lib/i18n/routing';

export default async function NotFound() {
  const t = await getTranslations();

  return (
    <Container className="py-32 text-center">
      <Kicker>404</Kicker>
      <Display as="h1" level={1} className="mt-3">
        {t('common.notFoundTitle')}
      </Display>
      <p className="mx-auto mt-5 max-w-[44ch] text-lede text-ink-62">{t('common.notFoundBody')}</p>
      <div className="mt-8 flex justify-center gap-2">
        <Button as={Link} href="/">
          {t('common.backHome')}
        </Button>
        <Button as={Link} href="/notes" variant="secondary">
          {t('nav.notes')}
        </Button>
      </div>
    </Container>
  );
}
