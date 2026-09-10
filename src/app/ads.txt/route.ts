import { adsEnabled, adsenseClient } from '@/lib/ads/config';

export const dynamic = 'force-static';

/**
 * AdSense 要求網站根目錄提供 ads.txt，宣告哪些帳號有權販售這個網域的廣告
 * 版位。以路由輸出而不是放靜態檔：publisher id 存在環境變數裡，不進版控。
 */
export function GET() {
  if (!adsEnabled) return new Response('', { status: 404 });

  const publisherId = adsenseClient.replace(/^ca-/, '');
  const body = `google.com, ${publisherId}, DIRECT, f08c47fec0942fa0\n`;

  return new Response(body, {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'public, max-age=3600',
    },
  });
}
