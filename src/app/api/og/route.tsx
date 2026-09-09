import { ImageResponse } from 'next/og';
import { z } from 'zod';

import dictionary from '@/lib/i18n/dictionaries/zh-TW.json';

export const runtime = 'edge';

const querySchema = z.object({
  // 參數白名單（規格 §5.1）：只接受已知的類型與有限長度的文字。
  type: z.enum(['post', 'project', 'page']).default('page'),
  title: z.string().max(120).optional(),
  subtitle: z.string().max(160).optional(),
  slug: z.string().max(120).optional(),
});

const size = { width: 1200, height: 630 };

/** 動態 OG 圖。報紙頭版式構圖：粗細線對 + 大標。 */
export async function GET(request: Request) {
  const parsed = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));

  const data = parsed.success ? parsed.data : { type: 'page' as const };
  const title = ('title' in data && data.title) || 'TSX';
  const subtitle = ('subtitle' in data && data.subtitle) || dictionary.site.kicker;
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
