import { NextResponse, type NextRequest } from 'next/server';

import { createServerSupabase } from '@/lib/supabase/server';

/**
 * OAuth 與信件連結回站時的落點。
 *
 * Supabase 走的是 PKCE：使用者在 Google／GitHub 授權完，或點了註冊確認信、
 * 密碼重設信之後，會被送回站上並帶著 `?code=`。**那個 code 必須在伺服器端用
 * `exchangeCodeForSession` 換成 session cookie**，換完之前使用者仍然是未登入。
 *
 * 原本這幾條流程的 `redirectTo` 都直接指向 `/account`，但 `/account` 是需要登入
 * 的頁面：session 還沒建立，它會先把人 307 送去 `/login`，`?code=` 也就跟著被
 * 丟掉。使用者的體驗是「授權完什麼都沒發生」。
 *
 * 放在 `/api/` 底下是刻意的：中介層的 matcher 排除了 `api`，這條路徑不會被
 * next-intl 加上語系前綴而變成不存在的路由。
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;

  const code = searchParams.get('code');
  const next = safeNext(searchParams.get('next'));

  // provider 或 Supabase 自己回報的錯誤（使用者按了取消授權也走這裡）。
  const providerError = searchParams.get('error_description') ?? searchParams.get('error');
  if (providerError) return NextResponse.redirect(failureUrl(origin, providerError));

  if (!code) return NextResponse.redirect(failureUrl(origin, 'missing_code'));

  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(failureUrl(origin, error.message));

  return NextResponse.redirect(new URL(next, origin));
}

/**
 * 只接受站內路徑。
 *
 * 這個值來自網址，沒有擋的話 `?next=https://evil.example` 就是一個開放轉址，
 * 可以拿來讓釣魚連結看起來像是從本站出去的。`//` 開頭同樣要擋，瀏覽器會把它
 * 當成協定相對的絕對網址。
 */
function safeNext(value: string | null): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/account';
  return value;
}

function failureUrl(origin: string, reason: string): URL {
  const url = new URL('/login', origin);
  url.searchParams.set('error', reason.slice(0, 200));
  return url;
}
