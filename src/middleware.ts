import { createClient } from '@supabase/supabase-js';
import createIntlMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';

import { themeScriptSource } from '@/components/site/theme-script';
import { isLocale } from '@/lib/i18n/config';
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

// ---------------------------------------------------------------------------
// 轉址表（規格 §6.3）
// ---------------------------------------------------------------------------

interface RedirectRule {
  to: string;
  status: number;
}

/**
 * 讀轉址表用的 service-role client。
 *
 * `redirects` 的 RLS 只開給 editor 以上，而中介層處理的是未登入的訪客，
 * 用 anon key 會一筆都讀不到，因此這裡繞過 RLS。只做 select，且只取
 * 轉址需要的三個欄位。
 *
 * 沒有沿用 `@/lib/supabase/service`：那支在缺金鑰時直接拋錯，中介層跑在
 * 每一個請求上，拋錯等於整站 500——這裡寧可回 null 讓轉址功能安靜地不啟用。
 * 它另外帶了 `server-only`，也不適合放進 Edge 的中介層。
 *
 * 建在模組層並快取：中介層每個請求都會執行，每次重建 client 太浪費。
 */
let serviceClient: ReturnType<typeof createClient> | null = null;

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;

  serviceClient ??= createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return serviceClient;
}

/*
 * 轉址表快取 60 秒。
 *
 * 中介層跑在每一個請求上，逐次查資料庫會讓每一頁都多一趟往返。後台儲存
 * 轉址時雖然有 `revalidateTag('site')`，但那只影響 Next.js 的資料快取，
 * 管不到這裡的模組層變數——因此新增或修改轉址最多會有 60 秒的延遲生效。
 */
const REDIRECT_CACHE_MS = 60_000;
let redirectCache: Map<string, RedirectRule> | null = null;
let redirectCacheExpires = 0;

async function getRedirects(): Promise<Map<string, RedirectRule>> {
  if (redirectCache && Date.now() < redirectCacheExpires) return redirectCache;

  const map = new Map<string, RedirectRule>();
  const supabase = getServiceClient();

  if (supabase) {
    const { data, error } = await supabase
      .from('redirects')
      .select('from_path, to_path, status_code')
      .eq('is_active', true);

    if (error) console.error('[middleware] 讀取轉址表失敗：', error.message);

    for (const row of (data ?? []) as { from_path: string; to_path: string; status_code: number }[]) {
      map.set(row.from_path, { to: row.to_path, status: row.status_code });
    }
  }

  // 失敗時也快取空表，避免資料庫出問題時每個請求都再打一次。
  redirectCache = map;
  redirectCacheExpires = Date.now() + REDIRECT_CACHE_MS;
  return map;
}

const redirectStatuses = new Set([301, 302, 307, 308]);

/**
 * 比對轉址表。命中就回傳目的地與狀態碼。
 *
 * 轉址是以不含語系前綴的路徑存的（`/notes/p/old`），因此先把 `/en` 這類
 * 前綴拆下來，命中後再接回去，英文頁不會被轉回中文版。
 * query string 不參與比對，但會原樣帶到新網址。
 */
async function matchRedirect(
  request: NextRequest,
): Promise<{ url: URL; status: number } | null> {
  const { pathname, search } = request.nextUrl;

  const segments = pathname.split('/');
  const maybeLocale = segments[1] ?? '';
  const prefix = isLocale(maybeLocale) ? `/${maybeLocale}` : '';
  const bare = prefix ? pathname.slice(prefix.length) || '/' : pathname;

  const rule = (await getRedirects()).get(bare);
  if (!rule) return null;

  const status = redirectStatuses.has(rule.status) ? rule.status : 301;

  // 絕對網址只接受 https；其餘一律當成站內路徑，`//evil.com` 因此進不來。
  if (/^https:\/\//i.test(rule.to)) {
    try {
      return { url: new URL(rule.to), status };
    } catch {
      return null;
    }
  }

  if (!rule.to.startsWith('/') || rule.to.startsWith('//')) return null;

  return { url: new URL(`${prefix}${rule.to}${search}`, request.url), status };
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

  // 轉址在 i18n 之前：命中就直接送走，不必再跑語系協商與 session 刷新。
  const redirect = await matchRedirect(request);
  if (redirect) return NextResponse.redirect(redirect.url, redirect.status);

  const response = handleI18n(request);
  // 前台仍需刷新 session，留言與帳號頁才拿得到登入狀態。
  await refreshSession(request, response);
  return applySecurityHeaders(response);
}

export const config = {
  /*
   * 排除靜態資源，但 `/admin/**` 無論路徑長什麼樣都要進來——原本的
   * `.*\\..*` 會把任何帶點的路徑整段跳過，連 `/admin/posts/a.b` 這種
   * 也會繞過權限檢查，因此改成只排除「結尾是副檔名」的請求並單獨列出 admin。
   */
  matcher: ['/((?!api|_next|_vercel|favicon.ico|images|.*\\.[\\w]+$).*)', '/admin/:path*'],
};
