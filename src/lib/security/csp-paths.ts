import { isLocale } from '@/lib/i18n/config';

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
export const strictCspPaths = [
  '/admin',
  '/account',
  '/login',
  '/register',
  '/reset-password',
  '/search',
];

export function wantsNonce(pathname: string): boolean {
  const segments = pathname.split('/');
  const bare = isLocale(segments[1] ?? '') ? `/${segments.slice(2).join('/')}` : pathname;

  return strictCspPaths.some((path) => bare === path || bare.startsWith(`${path}/`));
}

/*
 * 放在獨立模組而不是中介層裡：瀏覽器端的 AdsenseScript 也要知道哪些頁面是嚴格
 * 政策——那些頁面的 CSP 不放行廣告網域，載了腳本只會在主控台留下一串違規訊息。
 */
