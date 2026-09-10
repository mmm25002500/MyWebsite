import { timingSafeEqual } from 'node:crypto';

import { revalidateTag } from 'next/cache';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const bodySchema = z.object({ tags: z.array(z.string().min(1).max(120)).min(1).max(50) });

/**
 * 定值時間比對。
 *
 * `===` 一遇到不同的位元組就回傳，回應時間會隨著猜對的前綴變長，足以讓人
 * 一個字元一個字元把 token 試出來。`timingSafeEqual` 要求兩邊等長，因此
 * 先比長度——長度本身不是秘密。
 */
function secretMatches(provided: string | null, expected: string): boolean {
  if (!provided) return false;

  const a = Buffer.from(provided);
  const b = Buffer.from(`Bearer ${expected}`);
  if (a.length !== b.length) return false;

  return timingSafeEqual(a, b);
}

/** 手動失效快取。後台儲存時呼叫（規格 §5.1）。 */
export async function POST(request: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret || !secretMatches(request.headers.get('authorization'), secret)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });

  for (const tag of parsed.data.tags) revalidateTag(tag);
  return NextResponse.json({ ok: true, revalidated: parsed.data.tags });
}
