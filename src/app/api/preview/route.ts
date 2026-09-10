import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { requireRole } from '@/lib/auth/session';
import { renderMarkdown } from '@/lib/content/markdown';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// 預覽會跑完整的 Shiki + KaTeX 管線，很吃 CPU；上限壓在合理的文章長度。
const bodySchema = z.object({ markdown: z.string().max(200_000) });

/**
 * 編輯器的即時預覽。
 *
 * 走伺服器端渲染而不是在瀏覽器裡另外跑一套：規格 §9.2 要求預覽與前台使用
 * 同一條管線，在客戶端重做一份必然會漂移，而且 Shiki 與 KaTeX 加起來會讓
 * 後台 bundle 大上許多。
 */
export async function POST(request: NextRequest) {
  /*
   * `requireRole` 權限不足時直接拋錯，在 route handler 裡會變成 500——
   * 對呼叫端來說看起來像伺服器壞了。這裡接住並回 403，語意才正確。
   */
  try {
    await requireRole('editor');
  } catch {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ html: '', issues: [] }, { status: 400 });

  const rendered = await renderMarkdown(parsed.data.markdown);

  return NextResponse.json({
    html: rendered.html,
    issues: rendered.issues,
    wordCount: rendered.wordCount,
    readingTimeMin: rendered.readingTimeMin,
  });
}
