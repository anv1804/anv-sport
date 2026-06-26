/**
 * content-cache.ts — Redis Cache-Aside cho Post, Club, Player
 * ═══════════════════════════════════════════════════════════════
 *
 * Pattern: Cache-Aside với tag-based invalidation
 *
 *  READ:  Redis GET → HIT return / MISS → DB → Redis SET → return
 *  WRITE: DB update → Redis DEL (invalidate) → next read refills
 *
 * TTL Strategy:
 *  - Post content:    1h   (nội dung ít thay đổi)
 *  - Post list/page:  30s  (feed cần gần-realtime)
 *  - Club detail:     1h   (dữ liệu tĩnh)
 *  - Player detail:   30m  (stats có thể cập nhật)
 *  - Navigation menu: 5m   (thay đổi không thường xuyên)
 *  - Search results:  2m   (fresh enough)
 *
 * Không có Redis → fallback sang DB trực tiếp (graceful degrade)
 * ═══════════════════════════════════════════════════════════════
 */

import redis from './redis';

// ─── TTL ─────────────────────────────────────────────────────────────────────
const TTL = {
  POST:         3600,   // 1h
  POST_LIST:    30,     // 30s
  CLUB:         3600,   // 1h
  CLUB_LIST:    300,    // 5m
  PLAYER:       1800,   // 30m
  PLAYER_LIST:  300,    // 5m
  NAV:          300,    // 5m
  SEARCH:       120,    // 2m
  HOT_CONTENT:  86400,  // 7 ngày (ZSET, dùng expire riêng)
} as const;

// ─── Key builders ─────────────────────────────────────────────────────────────
export const CK = {
  post:       (id: number)            => `post:${id}`,
  postList:   (slug: string, p: number) => `posts:cat:${slug}:p:${p}`,
  club:       (slug: string)          => `club:${slug}`,
  clubList:   (p: number)             => `clubs:list:p:${p}`,
  clubIndex:                             'club:index',
  player:     (slug: string)          => `player:${slug}`,
  playerList: (p: number)             => `players:list:p:${p}`,
  playerIndex:                           'player:index',
  hotClubs:                              'hot:clubs',
  hotPlayers:                            'hot:players',
  nav:                                   'nav:menu',
  search:     (hash: string)          => `search:${hash}`,
} as const;

// ─── Safe helpers ─────────────────────────────────────────────────────────────
async function cGet<T>(key: string): Promise<T | null> {
  if (!redis) return null;
  try {
    const raw = await redis.get<string>(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch { return null; }
}

async function cSet(key: string, val: unknown, ttl: number): Promise<void> {
  if (!redis) return;
  try { await redis.set(key, JSON.stringify(val), { ex: ttl }); }
  catch { /* silent */ }
}

async function cDel(...keys: string[]): Promise<void> {
  if (!redis || !keys.length) return;
  try { await redis.del(...keys); }
  catch { /* silent */ }
}

// ═══════════════════════════════════════════════════════════════════════════════
// POST CACHE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Lấy post từ Redis hoặc DB.
 * Tự động cache nếu hit DB.
 * @param id Post ID
 * @param dbFetch Hàm query DB (injected để không import prisma ở đây)
 */
export async function getCachedPost<T>(
  id: number,
  dbFetch: () => Promise<T | null>,
): Promise<T | null> {
  const key = CK.post(id);
  const cached = await cGet<T>(key);
  if (cached) return cached;

  const data = await dbFetch();
  if (data) await cSet(key, data, TTL.POST);
  return data;
}

/**
 * Lấy danh sách posts theo category page.
 */
export async function getCachedPostList<T>(
  categorySlug: string,
  page: number,
  dbFetch: () => Promise<T>,
): Promise<T> {
  const key = CK.postList(categorySlug, page);
  const cached = await cGet<T>(key);
  if (cached) return cached;

  const data = await dbFetch();
  await cSet(key, data, TTL.POST_LIST);
  return data;
}

/**
 * Gọi khi admin sửa/xóa post — xóa các key liên quan.
 */
export async function invalidatePost(id: number, categorySlugs: string[] = []): Promise<void> {
  const keys = [CK.post(id), ...categorySlugs.flatMap(s => [0,1,2,3,4].map(p => CK.postList(s, p+1)))];
  await cDel(...keys);
}

// ═══════════════════════════════════════════════════════════════════════════════
// CLUB CACHE
// ═══════════════════════════════════════════════════════════════════════════════

export async function getCachedClub<T>(
  slug: string,
  dbFetch: () => Promise<T | null>,
): Promise<T | null> {
  const key = CK.club(slug);
  const cached = await cGet<T>(key);
  if (cached) return cached;

  const data = await dbFetch();
  if (data) {
    await cSet(key, data, TTL.CLUB);
    // Ghi index (slug → compact info) để search nhanh
    await updateClubIndex(slug, data);
  }
  return data;
}

export async function getCachedClubList<T>(
  page: number,
  dbFetch: () => Promise<T>,
): Promise<T> {
  const key = CK.clubList(page);
  const cached = await cGet<T>(key);
  if (cached) return cached;

  const data = await dbFetch();
  await cSet(key, data, TTL.CLUB_LIST);
  return data;
}

/** Track lượt visit CLB → ZINCRBY hot:clubs */
export async function trackClubVisit(clubId: string): Promise<void> {
  if (!redis) return;
  try {
    await (redis as any).zincrby(CK.hotClubs, 1, clubId);
    await redis.expire(CK.hotClubs, TTL.HOT_CONTENT);
  } catch { /* silent */ }
}

/** Top N CLB xem nhiều */
export async function getHotClubIds(n = 5): Promise<string[]> {
  if (!redis) return [];
  try {
    const ids = await redis.zrange(CK.hotClubs, 0, n - 1, { rev: true });
    return ids as string[];
  } catch { return []; }
}

/** Ghi compact info vào HASH index */
async function updateClubIndex(slug: string, club: any): Promise<void> {
  if (!redis) return;
  try {
    const val = JSON.stringify({ id: club.id, name: club.name, logo: club.logo || '' });
    await redis.hset(CK.clubIndex, { [slug]: val });
    await redis.expire(CK.clubIndex, 86400);
  } catch { /* silent */ }
}

/** Lookup CLB từ HASH index (không cần DB) */
export async function lookupClub(slug: string): Promise<{ id: string; name: string; logo: string } | null> {
  if (!redis) return null;
  try {
    const raw = await redis.hget<string>(CK.clubIndex, slug);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

export async function invalidateClub(slug: string): Promise<void> {
  await cDel(CK.club(slug), ...[0,1,2].map(p => CK.clubList(p+1)));
  if (redis) { try { await redis.hdel(CK.clubIndex, slug); } catch {} }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PLAYER / ENTITY CACHE
// ═══════════════════════════════════════════════════════════════════════════════

export async function getCachedPlayer<T>(
  slug: string,
  dbFetch: () => Promise<T | null>,
): Promise<T | null> {
  const key = CK.player(slug);
  const cached = await cGet<T>(key);
  if (cached) return cached;

  const data = await dbFetch();
  if (data) {
    await cSet(key, data, TTL.PLAYER);
    await updatePlayerIndex(slug, data);
  }
  return data;
}

export async function getCachedPlayerList<T>(
  page: number,
  dbFetch: () => Promise<T>,
): Promise<T> {
  const key = CK.playerList(page);
  const cached = await cGet<T>(key);
  if (cached) return cached;

  const data = await dbFetch();
  await cSet(key, data, TTL.PLAYER_LIST);
  return data;
}

/** Track lượt visit cầu thủ → ZINCRBY hot:players */
export async function trackPlayerVisit(playerId: string): Promise<void> {
  if (!redis) return;
  try {
    await (redis as any).zincrby(CK.hotPlayers, 1, playerId);
    await redis.expire(CK.hotPlayers, TTL.HOT_CONTENT);
  } catch { /* silent */ }
}

/** Top N cầu thủ xem nhiều */
export async function getHotPlayerIds(n = 5): Promise<string[]> {
  if (!redis) return [];
  try {
    const ids = await redis.zrange(CK.hotPlayers, 0, n - 1, { rev: true });
    return ids as string[];
  } catch { return []; }
}

async function updatePlayerIndex(slug: string, player: any): Promise<void> {
  if (!redis) return;
  try {
    const val = JSON.stringify({
      id: player.id || slug,
      name: player.name,
      avatar: player.image || player.avatar || '',
      club: player.team?.name || player.club?.name || '',
    });
    await redis.hset(CK.playerIndex, { [slug]: val });
    await redis.expire(CK.playerIndex, 86400);
  } catch { /* silent */ }
}

/** Lookup cầu thủ từ HASH index */
export async function lookupPlayer(slug: string): Promise<{ id: string; name: string; avatar: string; club: string } | null> {
  if (!redis) return null;
  try {
    const raw = await redis.hget<string>(CK.playerIndex, slug);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

export async function invalidatePlayer(slug: string): Promise<void> {
  await cDel(CK.player(slug), ...[0,1,2].map(p => CK.playerList(p+1)));
  if (redis) { try { await redis.hdel(CK.playerIndex, slug); } catch {} }
}

// ═══════════════════════════════════════════════════════════════════════════════
// NAVIGATION & SEARCH CACHE
// ═══════════════════════════════════════════════════════════════════════════════

export async function getCachedNav<T>(dbFetch: () => Promise<T>): Promise<T> {
  const cached = await cGet<T>(CK.nav);
  if (cached) return cached;
  const data = await dbFetch();
  await cSet(CK.nav, data, TTL.NAV);
  return data;
}

export async function invalidateNav(): Promise<void> {
  await cDel(CK.nav);
}

export async function getCachedSearch<T>(
  query: string,
  dbFetch: () => Promise<T>,
): Promise<T> {
  // Hash query để làm key
  let h = 0;
  for (let i = 0; i < query.length; i++) h = (Math.imul(31, h) + query.charCodeAt(i)) | 0;
  const key = CK.search(Math.abs(h).toString(36));

  const cached = await cGet<T>(key);
  if (cached) return cached;
  const data = await dbFetch();
  await cSet(key, data, TTL.SEARCH);
  return data;
}
