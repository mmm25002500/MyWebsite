import { createHash } from 'node:crypto';

/**
 * 訪客雜湊（規格 §11.2）：`sha256(ip + user-agent + 每日輪替的鹽)`。
 *
 * IP 不以明文儲存，鹽每日由 pg_cron 更換，因此無法跨日辨識同一個人，
 * 也就不需要 cookie 與同意橫幅。
 */
export function visitorHash(ip: string, userAgent: string, salt: string): string {
  return createHash('sha256').update(`${ip}|${userAgent}|${salt}`).digest('hex');
}

/** 取用戶端 IP。Vercel 會帶 `x-forwarded-for`，本機退回 loopback。 */
export function clientIp(headers: Headers): string {
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
