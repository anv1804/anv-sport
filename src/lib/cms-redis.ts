/**
 * cms-redis.ts — Toàn bộ Redis operations cho CMS
 * ═══════════════════════════════════════════════════════════════
 *
 * Kiến trúc:
 *  1. BITMAP  view:{postId}:{YYYYMMDD}   — unique views/ngày (1 bit/user)
 *  2. INCR    views:total:{postId}       — tổng lượt xem tích lũy
 *  3. ZSET    hot:posts                  — top bài xem nhiều (sorted by score)
 *  4. BITMAP  online:{YYYYMMDDHHH}       — users online theo giờ
 *  5. INCR    rl:{ip}:{route}:{min}      — rate limiting (req/phút/IP)
 *  6. STRING  cms:stats                  — dashboard cache 5 phút
 *
 * Dung lượng RAM:
 *  - 1 triệu user unique/ngày/bài = 125 KB/bitmap
 *  - 1000 bài × 125 KB = 125 MB tối đa — thực tế << 1 MB
 */

import redis from './redis';

// ─── Key builders ────────────────────────────────────────────────────────────
const today   = () => new Date().toISOString().slice(0, 10).replace(/-/g, '');  // YYYYMMDD
const thisHour = () => `${today()}${new Date().getUTCHours().toString().padStart(2, '0')}`; // YYYYMMDDHHH

const K = {
  viewBitmap:  (id: number | string)  => `view:${id}:${today()}`,
  viewTotal:   (id: number | string)  => `views:total:${id}`,
  hotPosts:                              'hot:posts',
  onlineBitmap:                          `online:${thisHour()}`,
  rateLimit:   (ip: string, route: string) => {
    const min = Math.floor(Date.now() / 60000); // floor to current minute
    return `rl:${ip}:${route}:${min}`;
  },
  dashStats:                             'cms:stats',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
/**
 * Chuyển IP hoặc fingerprint → bit offset (0..2^27 ≈ 128M)
 * Dùng hash đơn giản để phân tán đều, tránh collision cơ bản.
 */
function hashToBit(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h) % (1 << 27); // max 134M bits = 16 MB/bitmap
}

async function safeRun<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  if (!redis) return fallback;
  try { return await fn(); }
  catch { return fallback; }
}

// ═══════════════════════════════════════════════════════════════
// 1. PAGE VIEW TRACKING
// ═══════════════════════════════════════════════════════════════

/**
 * Gọi khi user xem bài viết (từ /api/track-view).
 * - SETBIT: đánh dấu user đã xem hôm nay (dedup)
 * - INCR total: nếu chưa xem hôm nay mới tăng
 * - ZINCRBY hot:posts: tăng score để xếp hạng hot
 */
export async function trackPageView(postId: number, userHash: string): Promise<void> {
  await safeRun(async () => {
    if (!redis) return;
    const bit  = hashToBit(userHash);
    const bKey = K.viewBitmap(postId);

    // GETBIT trước — nếu đã xem hôm nay thì bỏ qua INCR
    const alreadySeen = await (redis as any).getbit(bKey, bit) as number;

    const pipe = redis.pipeline();
    (pipe as any).setbit(bKey, bit, 1);
    (pipe as any).expire(bKey, 60 * 60 * 24 * 30); // giữ 30 ngày

    if (!alreadySeen) {
      // Unique view: tăng tổng tích lũy + hot score
      pipe.incr(K.viewTotal(postId));
      (pipe as any).zincrby(K.hotPosts, 1, String(postId));
    }

    await pipe.exec();
    // Hot posts ZSET: giữ TTL 7 ngày (refresh mỗi lần có view)
    await redis.expire(K.hotPosts, 60 * 60 * 24 * 7);
  }, undefined);
}

/**
 * Lấy tổng lượt xem của một bài.
 * Ưu tiên Redis → fallback 0.
 */
export async function getPostViews(postId: number): Promise<number> {
  return safeRun(async () => {
    if (!redis) return 0;
    const v = await redis.get<string>(K.viewTotal(postId));
    return parseInt(v ?? '0', 10) || 0;
  }, 0);
}

/**
 * Lấy unique views hôm nay của một bài (BITCOUNT).
 */
export async function getTodayUniqueViews(postId: number): Promise<number> {
  return safeRun(async () => {
    if (!redis) return 0;
    const count = await (redis as any).bitcount(K.viewBitmap(postId)) as number;
    return count || 0;
  }, 0);
}

/**
 * Tổng unique views toàn site hôm nay (OR tất cả bitmaps).
 * Chỉ gọi từ dashboard — tốn ~1ms, không cần cache riêng.
 */
export async function getTotalTodayViews(): Promise<number> {
  return safeRun(async () => {
    if (!redis) return 0;
    // Scan tất cả key view:*:today
    const pattern = `view:*:${today()}`;
    const keys = await redis.keys(pattern);
    if (!keys.length) return 0;
    // Dùng BITOP OR vào temp key rồi BITCOUNT
    const tmpKey = `tmp:views:${today()}`;
    await (redis as any).bitop('OR', tmpKey, ...keys);
    await redis.expire(tmpKey, 300); // giữ 5 phút
    const count = await (redis as any).bitcount(tmpKey) as number;
    return count || 0;
  }, 0);
}

// ═══════════════════════════════════════════════════════════════
// 2. HOT POSTS — SORTED SET
// ═══════════════════════════════════════════════════════════════

/**
 * Lấy top N post IDs xem nhiều nhất (từ ZSET).
 */
export async function getHotPostIds(topN = 10): Promise<number[]> {
  return safeRun(async () => {
    if (!redis) return [];
    const ids = await redis.zrange(K.hotPosts, 0, topN - 1, { rev: true });
    return ids.map(id => parseInt(id as string, 10)).filter(n => !isNaN(n));
  }, []);
}

/**
 * Lấy view count của nhiều bài cùng lúc (pipeline).
 */
export async function getBatchPostViews(postIds: number[]): Promise<Record<number, number>> {
  const result: Record<number, number> = {};
  if (!redis || !postIds.length) return result;
  return safeRun(async () => {
    if (!redis) return result;
    const pipe = redis.pipeline();
    for (const id of postIds) pipe.get(K.viewTotal(id));
    const res = await pipe.exec() as (string | null)[];
    for (let i = 0; i < postIds.length; i++) {
      result[postIds[i]] = parseInt(res[i] ?? '0', 10) || 0;
    }
    return result;
  }, result);
}

// ═══════════════════════════════════════════════════════════════
// 3. ONLINE USER TRACKING — BITMAP theo giờ
// ═══════════════════════════════════════════════════════════════

/**
 * Đánh dấu user đang online.
 * Gọi từ middleware hoặc layout fetch (server-side, silent).
 */
export async function trackOnlineUser(sessionId: string): Promise<void> {
  await safeRun(async () => {
    if (!redis) return;
    const bit = hashToBit(sessionId);
    const key = K.onlineBitmap;
    await (redis as any).setbit(key, bit, 1);
    await redis.expire(key, 7200); // TTL 2h
  }, undefined);
}

/**
 * Đếm số user đang online trong giờ hiện tại (BITCOUNT).
 * O(N/8) với N = max bit offset = rất nhanh.
 */
export async function getOnlineCount(): Promise<number> {
  return safeRun(async () => {
    if (!redis) return 0;
    const count = await (redis as any).bitcount(K.onlineBitmap) as number;
    return count || 0;
  }, 0);
}

// ═══════════════════════════════════════════════════════════════
// 4. RATE LIMITING — INCR sliding window (1 phút)
// ═══════════════════════════════════════════════════════════════

/**
 * Kiểm tra rate limit.
 * @param ip       IP hoặc user fingerprint
 * @param route    Tên route (vd: 'generate-prediction')
 * @param maxReqs  Số request tối đa/phút (default 10)
 * @returns { allowed, remaining, resetInSec }
 */
export async function checkRateLimit(
  ip: string,
  route: string,
  maxReqs = 10,
): Promise<{ allowed: boolean; remaining: number; resetInSec: number }> {
  const fallback = { allowed: true, remaining: maxReqs, resetInSec: 60 };
  return safeRun(async () => {
    if (!redis) return fallback;
    const key = K.rateLimit(ip, route);
    const pipe = redis.pipeline();
    pipe.incr(key);
    pipe.ttl(key);
    const [count, ttl] = await pipe.exec() as [number, number];
    // Lần đầu tiên trong phút → set TTL
    if (ttl === -1) await redis.expire(key, 60);
    const c = count || 1;
    const allowed = c <= maxReqs;
    return {
      allowed,
      remaining: Math.max(0, maxReqs - c),
      resetInSec: ttl > 0 ? ttl : 60,
    };
  }, fallback);
}

// ═══════════════════════════════════════════════════════════════
// 5. DASHBOARD STATS CACHE — JSON 5 phút
// ═══════════════════════════════════════════════════════════════

export interface DashboardStats {
  todayViews:   number;
  onlineNow:    number;
  hotPostIds:   number[];
  cachedAt:     string;
}

export async function getDashboardStats(): Promise<DashboardStats | null> {
  return safeRun(async () => {
    if (!redis) return null;
    const raw = await redis.get<string>(K.dashStats);
    if (raw) { try { return JSON.parse(raw) as DashboardStats; } catch {} }
    return null;
  }, null);
}

export async function setDashboardStats(stats: DashboardStats): Promise<void> {
  await safeRun(async () => {
    if (!redis) return;
    await redis.set(K.dashStats, JSON.stringify(stats), { ex: 300 }); // 5 phút
  }, undefined);
}

/**
 * Tính toán và cache lại dashboard stats.
 * Gọi từ admin dashboard hoặc cron.
 */
export async function refreshDashboardStats(): Promise<DashboardStats> {
  const [todayViews, onlineNow, hotPostIds] = await Promise.all([
    getTotalTodayViews(),
    getOnlineCount(),
    getHotPostIds(10),
  ]);
  const stats: DashboardStats = {
    todayViews,
    onlineNow,
    hotPostIds,
    cachedAt: new Date().toISOString(),
  };
  await setDashboardStats(stats);
  return stats;
}
