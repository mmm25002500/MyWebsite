import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { clientIp, isBot, isSameOrigin } from '@/lib/analytics/request';
import { checkRateLimit } from '@/lib/cache/ratelimit';
import { hasSupabase } from '@/lib/env';
import { createServiceClient } from '@/lib/supabase/service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const bodySchema = z.object({ buttonId: z.string().uuid() });

/**
 * 連結樹按鈕的點擊記錄，由 `TrackedLink` 以 `navigator.sendBeacon` 呼叫。
 *
 * 原本前台按鈕是直接連出去的 `<a>`，全站沒有任何地方寫入 `click_count`，所以後台
 * 永遠顯示 0；`link_clicks` 則有一條開給匿名訪客直接寫入的政策，沒有速率限制，
 * 也不會讓計數增加。現在唯一的寫入路徑是這支 API：
 *
 * - 同源檢查與速率限制（每個 IP 每分鐘 30 次），擋掉從別站或腳本灌數字。
 * - 爬蟲的點擊不計（它們通常不執行 JavaScript，但少數會）。
 * - 計數與明細在同一個資料庫函式裡完成；按鈕不存在或已隱藏時不計。
 * - 訪客雜湊由資料庫以當日的鹽計算，鹽不外流到應用層（與瀏覽分析相同）。
 */
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return NextResponse.json({ ok: false }, { status: 403 });

  const ip = clientIp(request.headers);
  const { success } = await checkRateLimit('link-click', ip, 30, 60);
  if (!success) return NextResponse.json({ ok: false }, { status: 429 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });

  const userAgent = request.headers.get('user-agent') ?? '';
  if (isBot(userAgent) || !hasSupabase) return NextResponse.json({ ok: true });

  const { error } = await createServiceClient().rpc('record_link_click', {
    p_button_id: parsed.data.buttonId,
    p_ip: ip,
    p_user_agent: userAgent,
    p_referrer: request.headers.get('referer'),
  } as never);

  if (error) return NextResponse.json({ ok: false }, { status: 500 });
  return NextResponse.json({ ok: true });
}
