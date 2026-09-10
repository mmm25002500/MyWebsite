import type { MetadataRoute } from 'next';

import { siteUrl } from '@/lib/env';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        // /api/og 是各頁的 OG 圖，擋掉的話社群預覽與圖片索引都抓不到，
        // 必須排在 /api/ 之前。
        allow: ['/', '/api/og'],
        // 搜尋結果與後台不進索引。
        disallow: ['/admin', '/api/', '/search', '/en/search', '/account', '/en/account'],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
