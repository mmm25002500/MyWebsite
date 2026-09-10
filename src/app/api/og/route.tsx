import { ImageResponse } from 'next/og';
import { z } from 'zod';

import { clientIp } from '@/lib/analytics/request';
import { checkRateLimit } from '@/lib/cache/ratelimit';
import { hasSupabase } from '@/lib/env';
import dictionary from '@/lib/i18n/dictionaries/zh-TW.json';
import { createPublicClient } from '@/lib/supabase/public';

export const runtime = 'edge';

const querySchema = z.object({
  // 參數白名單（規格 §5.1）：只接受已知的類型與一個 slug。
  type: z.enum(['post', 'project', 'page']).default('page'),
  slug: z
    .string()
    .trim()
    .max(120)
    .regex(/^[^\s/?#[\]@!$&'()*+,;=]+$/)
    .optional(),
});

const size = { width: 1200, height: 630 };

/**
 * 由 slug 反查標題。
 *
 * 標題**不接受由網址直接傳入**：那等於讓任何人拿本站的網域產出任意文字的
 * 圖片，貼到社群上看起來就像是站方發的。改成只收 slug、文字一律從資料庫
 * 撈，查不到就退回站名。
 */
async function lookupTitle(type: 'post' | 'project', slug: string): Promise<string | null> {
  if (!hasSupabase) return null;

  const view = type === 'post' ? 'v_public_posts' : 'v_public_projects';
  const column = type === 'post' ? 'title' : 'name';

  try {
    const { data, error } = await createPublicClient()
      .from(view)
      .select('*')
      .eq('slug', slug)
      .limit(1);
    if (error || !data || data.length === 0) return null;

    const value = (data[0] as unknown as Record<string, unknown>)[column];
    return typeof value === 'string' && value.length > 0 ? value.slice(0, 120) : null;
  } catch {
    return null;
  }
}

/** 動態 OG 圖。報紙頭版式構圖：粗細線對 + 大標。 */
export async function GET(request: Request) {
  const { success } = await checkRateLimit('og', clientIp(request.headers), 30, 60);
  if (!success) return new Response('Too Many Requests', { status: 429 });

  const parsed = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  const data = parsed.success ? parsed.data : { type: 'page' as const, slug: undefined };

  const looked =
    data.type !== 'page' && data.slug ? await lookupTitle(data.type, data.slug) : null;

  const title = looked ?? dictionary.site.name;
  const subtitle = dictionary.site.kicker;
  const kicker =
    data.type === 'post'
      ? 'NOTES'
      : data.type === 'project'
        ? 'PROJECTS'
        : dictionary.site.domain.toUpperCase();

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: '#f3f2f2',
        color: '#201e1d',
        padding: '64px 72px',
        fontFamily: 'serif',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontSize: 22, letterSpacing: 6, color: '#006786' }}>{kicker}</span>
        <span style={{ fontSize: 22, letterSpacing: 6, color: '#7d7979' }}>TSX</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ height: 6, background: '#201e1d' }} />
        <div style={{ height: 18 }} />
        <div style={{ fontSize: 62, lineHeight: 1.1, fontWeight: 600, letterSpacing: -1 }}>
          {title}
        </div>
        <div style={{ height: 18 }} />
        <div style={{ height: 2, background: '#201e1d' }} />
      </div>

      <div style={{ display: 'flex', fontSize: 26, color: '#605d5d' }}>{subtitle}</div>
    </div>,
    size,
  );
}
