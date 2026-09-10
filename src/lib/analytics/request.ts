/**
 * 請求層的共用判讀：IP、爬蟲、來源分類、同源檢查。
 *
 * 這些都只用 Web 標準 API，不碰 `node:` 模組，因此 Edge runtime（middleware、
 * `/api/og`）也能用。`visitor.ts` 的 `visitorHash` 需要 `node:crypto`，兩者
 * 因此分開放，避免 Edge 端 import 到不能跑的東西。
 */

/**
 * 是否信任反向代理送來的 IP 標頭。
 *
 * `x-forwarded-for` 與 `x-real-ip` 是純文字標頭，任何人都能自己帶——只要
 * 直接對外的是應用程式本身，攻擊者就能用它繞過以 IP 為鍵的速率限制。
 * 只有在確定前面有會覆寫這些標頭的代理時才可以信：Vercel 上自動成立
 * （`VERCEL=1`），自架（Nginx／Cloudflare Tunnel／Caddy 之類）請自行設定
 * `TRUST_PROXY_HEADERS=true`，否則一律當成 loopback。
 */
const trustProxyHeaders =
  process.env.VERCEL === '1' || process.env.TRUST_PROXY_HEADERS === 'true';

/** 取用戶端 IP。不信任代理標頭時退回 loopback（速率限制會併成同一個桶）。 */
export function clientIp(headers: Headers): string {
  if (!trustProxyHeaders) return '127.0.0.1';

  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() ?? '127.0.0.1';
  return headers.get('x-real-ip') ?? '127.0.0.1';
}

const botPattern =
  /bot|crawler|spider|crawling|slurp|facebookexternalhit|bingpreview|headlesschrome|lighthouse|pingdom|gtmetrix/i;

export function isBot(userAgent: string): boolean {
  return botPattern.test(userAgent);
}

/**
 * 來源分類（規格 §11.2）。
 */
export function referrerSource(
  referrer: string | null,
  selfHost: string,
): { source: string; domain: string | null } {
  if (!referrer) return { source: 'direct', domain: null };

  let host: string;
  try {
    host = new URL(referrer).hostname.replace(/^www\./, '');
  } catch {
    return { source: 'external', domain: null };
  }

  if (host === selfHost.replace(/^www\./, '')) return { source: 'internal', domain: host };

  const searchEngines = [
    'google.',
    'bing.',
    'duckduckgo.',
    'yahoo.',
    'baidu.',
    'ecosia.',
    'brave.',
  ];
  if (searchEngines.some((engine) => host.includes(engine))) {
    return { source: 'search', domain: host };
  }

  const socials = [
    'threads.net',
    'x.com',
    'twitter.com',
    'facebook.com',
    'instagram.com',
    'linkedin.com',
    'line.me',
    'reddit.com',
    'news.ycombinator.com',
    't.co',
  ];
  if (socials.some((social) => host.includes(social))) return { source: 'social', domain: host };

  return { source: 'external', domain: host };
}

/**
 * 同源檢查：擋掉別的網站拿使用者的瀏覽器代打自家 API。
 *
 * 以 `Origin` 為主，比對 host 而非整段字串（協定與埠在代理後面不一定一致）。
 * 沒有 `Origin` 的請求（同源 GET、部分舊瀏覽器）改看 `sec-fetch-site`，
 * 只認 `same-origin`；兩者都沒有就當作不同源。
 */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');

  if (origin) {
    try {
      return new URL(origin).host === new URL(request.url).host;
    } catch {
      return false;
    }
  }

  return request.headers.get('sec-fetch-site') === 'same-origin';
}
