import { revalidateTag } from 'next/cache';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const bodySchema = z.object({ tags: z.array(z.string().min(1).max(120)).min(1).max(50) });

/** 手動失效快取。後台儲存時呼叫（規格 §5.1）。 */
export async function POST(request: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });

  for (const tag of parsed.data.tags) revalidateTag(tag);
  return NextResponse.json({ ok: true, revalidated: parsed.data.tags });
}
