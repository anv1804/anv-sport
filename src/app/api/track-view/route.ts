/**
 * POST /api/track-view
 * ─────────────────────────────────────────────────────────────
 * Fire-and-forget endpoint — client gọi sau 3 giây khi user đọc bài.
 * Không block render, không ảnh hưởng performance trang.
 *
 * Body: { postId: number, fp: string }
 *  - fp: browser fingerprint (IP + UA hash, tạo ở client)
 */

import { NextResponse } from 'next/server';
import { trackPageView, trackOnlineUser } from '@/lib/cms-redis';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const postId = parseInt(body?.postId, 10);
    if (isNaN(postId) || postId <= 0) {
      return NextResponse.json({ ok: false, error: 'invalid postId' }, { status: 400 });
    }

    // Tạo fingerprint từ IP + body.fp (client-generated)
    const ip  = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
              || req.headers.get('x-real-ip')
              || 'unknown';
    const fp  = `${ip}:${body?.fp || 'anon'}`;

    // Parallel: track view + track online (fire-and-forget, không await lỗi)
    await Promise.allSettled([
      trackPageView(postId, fp),
      trackOnlineUser(fp),
    ]);

    return NextResponse.json({ ok: true });
  } catch {
    // Silent — không crash vì lỗi tracking
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
