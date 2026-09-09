import createIntlMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';

import { themeScriptSource } from '@/components/site/theme-script';
import { routing } from '@/lib/i18n/routing';
import { refreshSession } from '@/lib/supabase/middleware';

const handleI18n = createIntlMiddleware(routing);

/** `/admin/**` 需要 editor 以上的角色（規格 §5.3）。 */
const adminRoles = new Set(['editor', 'admin', 'owner']);

/**
 * 主題腳本的 CSP 雜湊。
 *
 * `ThemeScript` 是全站唯一的行內腳本，內容固定，因此以 sha256 放行而不是
 * 把 nonce 傳進元件。雜湊從元件匯出的同一個常數計算，改了腳本雜湊會跟著變。
 * Edge runtime 只有非同步的 Web Crypto，算完後快取在模組層。
 */
let themeScriptHash: string | null = null;

async function getThemeScriptHash(): Promise<string> {
  if (themeScriptHash) return themeScriptHash;

  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(themeScriptSource),
  );
  themeScriptHash = `'sha256-${btoa(String.fromCharCode(...new Uint8Array(digest)))}'`;
  return themeScriptHash;
}

/**
 * Content-Security-Policy（規格 §13.4）。
 *
 * `script-src` 帶每個請求現產的 nonce，Next.js 會自動把它加到自己輸出的
 * script 標籤上；行內的主題腳本則以雜湊放行。
 *
 * 刻意**不使用 `'strict-dynamic'`**：它會讓 `'self'` 整個被忽略，而規格 §13.4
 * 給的 script-src 本來就沒有它。
 *
 * 開發模式額外放行 `'unsafe-eval'` 與 websocket：Next.js 的 dev server 以
 * `eval` 產生 source map、以 websocket 做 HMR，擋掉的話 webpack runtime 會
 * 直接拋 EvalError，整個頁面不會 hydrate。正式環境不含這兩項。
 */
function contentSecurityPolicy(nonce: string, scriptHash: string, supabaseHost: string): string {
  const isDev = process.env.NODE_ENV === 'development';

  return [
    "default-src 'self'",
    [
      "script-src 'self'",
      `'nonce-${nonce}'`,
      scriptHash,
      isDev ? "'unsafe-eval'" : null,
      'https://challenges.cloudflare.com',
    ]
      .filter(Boolean)
      .join(' '),
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob: https://${supabaseHost} https://i.ytimg.com https://avatars.githubusercontent.com https://lh3.googleusercontent.com`,
    'frame-src https://www.youtube-nocookie.com https://challenges.cloudflare.com',
    [
      "connect-src 'self'",
      `https://${supabaseHost}`,
      `wss://${supabaseHost}`,
      'https://*.upstash.io',
      isDev ? 'ws://localhost:* http://localhost:*' : null,
    ]
      .filter(Boolean)
      .join(' '),
    "font-src 'self' data:",
    "object-src 'none'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    isDev ? null : 'upgrade-insecure-requests',
  ]
    .filter(Boolean)
    .join('; ');
}

async function applySecurityHeaders(response: NextResponse): Promise<NextResponse> {
  const nonce = crypto.randomUUID().replace(/-/g, '');
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseHost = supabaseUrl ? new URL(supabaseUrl).hostname : '*.supabase.co';

  response.headers.set(
    'content-security-policy',
    contentSecurityPolicy(nonce, await getThemeScriptHash(), supabaseHost),
  );
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/admin')) {
    const response = NextResponse.next();
    const { role } = await refreshSession(request, response);

    if (pathname === '/admin/login') return applySecurityHeaders(response);

    if (!role || !adminRoles.has(role)) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(loginUrl);
    }

    return applySecurityHeaders(response);
  }

  const response = handleI18n(request);
  // 前台仍需刷新 session，留言與帳號頁才拿得到登入狀態。
  await refreshSession(request, response);
  return applySecurityHeaders(response);
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|favicon.ico|images|.*\\..*).*)'],
};
