import type { MetadataRoute } from 'next';

import { siteUrl } from '@/lib/env';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // 搜尋結果與後台不進索引。
        disallow: ['/admin', '/api/', '/search', '/en/search'],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
