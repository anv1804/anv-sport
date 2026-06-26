'use client';

/**
 * ViewTracker — Client component, fire-and-forget.
 * Gọi /api/track-view sau 3 giây để tránh bounce (user vào rồi thoát ngay).
 * Tạo fingerprint đơn giản từ User-Agent + screen để dedup user.
 */

import { useEffect } from 'react';

interface Props { postId: number }

export function ViewTracker({ postId }: Props) {
  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        // Tạo fingerprint nhẹ từ browser info — không cần thư viện nặng
        const fp = [
          navigator.userAgent.length,
          screen.width,
          screen.height,
          screen.colorDepth,
          Intl.DateTimeFormat().resolvedOptions().timeZone,
        ].join(':');

        await fetch('/api/track-view', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ postId, fp }),
          // keepalive: gửi ngay cả khi user navigate away
          keepalive: true,
        });
      } catch {
        // Silent — không alert user vì đây chỉ là analytics
      }
    }, 3000); // Đợi 3s để tránh bounce

    return () => clearTimeout(timer);
  }, [postId]);

  // Không render gì cả
  return null;
}
