import { getRequestConfig } from 'next-intl/server';

import { defaultLocale, isLocale } from './config';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = requested && isLocale(requested) ? requested : defaultLocale;

  return {
    locale,
    messages: (await import(`./dictionaries/${locale}.json`)).default,
    timeZone: 'Asia/Taipei',
  };
});

export { routing };
