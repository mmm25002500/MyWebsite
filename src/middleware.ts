import { createClient } from '@supabase/supabase-js';
import createIntlMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';

import { themeScriptSource } from '@/components/site/theme-script';
import { adsEnabled, adsenseHosts, isAdRoute } from '@/lib/ads/config';
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

  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(themeScriptSource));
  themeScriptHash = `'sha256-${btoa(String.fromCharCode(...new Uint8Array(digest)))}'`;
  return themeScriptHash;
}

/**
 * Cloudflare Web Analytics 的 beacon。
 *
 * 由 Cloudflare 在邊緣自動注入，沒有 nonce，所以要靠來源網域放行——nonce 不會
 * 讓 script-src 裡的網域白名單失效（會讓它失效的是 'strict-dynamic'，而我們刻意
 * 沒有用）。回報打到 cloudflareinsights.com，connect-src 也要一併開。
 *
 * 不想載入的話，關掉的地方在 Cloudflare 的 Web Analytics，不是這裡。
 */
const cloudflareInsights = {
  script: 'https://static.cloudflareinsights.com',
  connect: 'https://cloudflareinsights.com',
} as const;

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
 *
 * `ads` 為真時（只有設定了 AdSense、而且是會出現廣告的路徑）改用一份放寬的
 * 政策：**這是一個明確的取捨**。AdSense 的廣告框會自己注入行內腳本，帶
 * nonce 的政策擋得死死的，因此那些路徑改成 `'unsafe-inline'` 加網域白名單。
 * 首頁、聯絡表單、登入註冊與整個後台不在其中，維持原本的嚴格政策。
 */
function contentSecurityPolicy(
  nonce: string | null,
  scriptHash: string,
  supabaseHost: string,
  ads: boolean,
): string {
  const isDev = process.env.NODE_ENV === 'development';

  if (ads || !nonce) {
    return [
      "default-src 'self'",
      // CSP3：script-src 只要出現 nonce 或 hash，'unsafe-inline' 就會被忽略，因此兩者都不帶。
      [
        "script-src 'self' 'unsafe-inline'",
        isDev ? "'unsafe-eval'" : null,
        'https://challenges.cloudflare.com',
        cloudflareInsights.script,
        ...(ads ? adsenseHosts.script : []),
      ]
        .filter(Boolean)
        .join(' '),
      "style-src 'self' 'unsafe-inline'",
      [
        `img-src 'self' data: blob: https://${supabaseHost}`,
        'https://i.ytimg.com',
        'https://avatars.githubusercontent.com',
        'https://lh3.googleusercontent.com',
        ...(ads ? adsenseHosts.image : []),
      ].join(' '),
      [
        'frame-src https://www.youtube-nocookie.com https://challenges.cloudflare.com',
        ...(ads ? adsenseHosts.frame : []),
      ].join(' '),
      [
        "connect-src 'self'",
        `https://${supabaseHost}`,
        `wss://${supabaseHost}`,
        cloudflareInsights.connect,
        ...(ads ? adsenseHosts.connect : []),
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

  return [
    "default-src 'self'",
    [
      "script-src 'self'",
      `'nonce-${nonce}'`,
      scriptHash,
      isDev ? "'unsafe-eval'" : null,
      'https://challenges.cloudflare.com',
      cloudflareInsights.script,
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
      cloudflareInsights.connect,
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

/**
 * 把標頭覆寫回「請求」，而不只是回應。
 *
 * Next.js 是從**請求**上的 `content-security-policy` 取出 nonce，再蓋到它自己
 * 輸出的 <script> 標籤上。只設在回應標頭的話，瀏覽器會拿到一份「只准帶 nonce」
 * 的政策、HTML 卻一個 nonce 屬性都沒有，於是所有行內腳本（包含 RSC 的
 * `self.__next_f` 酬載）全被擋下，React 拿不到 flight 資料就把容器清空——正式
 * 環境整頁白畫面，主控台只留一句 `Connection closed.`。
 *
 * `NextResponse.next({ request: { headers } })` 就是靠下面這兩個協定標頭傳遞的，
 * 但前台的回應由 next-intl 的中介層產生，我們插不進那個呼叫，因此直接寫。
 *
 * 注意 `x-middleware-override-headers` 會**整組取代**下游看到的請求標頭，漏列
 * 就等於把該標頭從請求上拿掉（少了 cookie 就沒有登入狀態），所以必須列全。
 */
function overrideRequestHeaders(
  request: NextRequest,
  response: NextResponse,
  extra: Record<string, string>,
): void {
  const headers = new Headers();

  // 上游若已經覆寫過就接續它的結果，否則以原始請求為底。
  const existing = response.headers.get('x-middleware-override-headers');
  if (existing) {
    for (const name of existing.split(',').map((item) => item.trim()).filter(Boolean)) {
      const value = response.headers.get(`x-middleware-request-${name}`);
      if (value !== null) headers.set(name, value);
    }
  } else {
    request.headers.forEach((value, name) => headers.set(name, value));
  }

  for (const [name, value] of Object.entries(extra)) headers.set(name.toLowerCase(), value);

  const names: string[] = [];
  headers.forEach((value, name) => {
    names.push(name);
    response.headers.set(`x-middleware-request-${name}`, value);
  });
  response.headers.set('x-middleware-override-headers', names.join(','));
}

/**
 * 哪些路徑用帶 nonce 的嚴格政策。
 *
 * **nonce 和靜態預先渲染是互斥的**：Next.js 的 nonce 是逐請求現產、在渲染時蓋到
 * script 標籤上，而 SSG／ISR 的 HTML 只產生一次並重複回應，蓋不進去。結果就是
 * 政策要求 nonce、HTML 卻沒有，行內腳本（含 RSC 的 `self.__next_f` 酬載）全被擋，
 * 整頁空白。
 *
 * 因此嚴格政策只給「每次請求都會重新渲染」的路徑——整個後台，以及會讀 cookie
 * 判斷登入狀態的帳號與登入相關頁面。其餘的公開內容頁走放寬版（`'unsafe-inline'`，
 * 不帶 nonce），保住 ISR 帶來的效能。
 *
 * **這是一個明確的取捨**：公開頁面失去 script-src 對行內注入的防護，剩下 `'self'`
 * 與網域白名單，以及 React 預設的輸出跳脫。權限操作、表單與 session 都在嚴格政策
 * 那一側。名單裡任何一條若哪天變成完全靜態，那一頁就會白畫面，改路由時要一併檢查。
 */
const strictCspPaths = ['/admin', '/account', '/login', '/register', '/reset-password', '/search'];

function wantsNonce(pathname: string): boolean {
  const segments = pathname.split('/');
  const bare = isLocale(segments[1] ?? '') ? `/${segments.slice(2).join('/')}` : pathname;

  return strictCspPaths.some((path) => bare === path || bare.startsWith(`${path}/`));
}

async function applySecurityHeaders(
  request: NextRequest,
  response: NextResponse,
  pathname: string,
): Promise<NextResponse> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseHost = supabaseUrl ? new URL(supabaseUrl).hostname : '*.supabase.co';
  const ads = adsEnabled && isAdRoute(pathname);
  const nonce = !ads && wantsNonce(pathname) ? crypto.randomUUID().replace(/-/g, '') : null;

  const csp = contentSecurityPolicy(nonce, await getThemeScriptHash(), supabaseHost, ads);

  response.headers.set('content-security-policy', csp);
  // 只有帶 nonce 的政策需要讓 Next.js 讀到；放寬版沒有 nonce 可傳。
  if (nonce) overrideRequestHeaders(request, response, { 'content-security-policy': csp });

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

    for (const row of (data ?? []) as {
      from_path: string;
      to_path: string;
      status_code: number;
    }[]) {
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
async function matchRedirect(request: NextRequest): Promise<{ url: URL; status: number } | null> {
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
    const { role } = await refreshSession(request, response, { withRole: true });

    if (pathname === '/admin/login') return applySecurityHeaders(request, response, pathname);

    if (!role || !adminRoles.has(role)) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(loginUrl);
    }

    return applySecurityHeaders(request, response, pathname);
  }

  // 轉址在 i18n 之前：命中就直接送走，不必再跑語系協商與 session 刷新。
  const redirect = await matchRedirect(request);
  if (redirect) return NextResponse.redirect(redirect.url, redirect.status);

  const response = handleI18n(request);
  // 前台仍需刷新 session，留言與帳號頁才拿得到登入狀態。
  await refreshSession(request, response);
  return applySecurityHeaders(request, response, pathname);
}

export const config = {
  /*
   * 排除靜態資源，但 `/admin/**` 無論路徑長什麼樣都要進來——原本的
   * `.*\\..*` 會把任何帶點的路徑整段跳過，連 `/admin/posts/a.b` 這種
   * 也會繞過權限檢查，因此改成只排除「結尾是副檔名」的請求並單獨列出 admin。
   */
  matcher: ['/((?!api|_next|_vercel|favicon.ico|images|.*\\.[\\w]+$).*)', '/admin/:path*'],
};
