/**
 * Upstash Redis singleton — graceful null fallback khi chưa cấu hình.
 * Dùng REST API → không cần persistent TCP connection (phù hợp serverless).
 */
import { Redis } from '@upstash/redis';

function createClient(): Redis | null {
  const url   = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[Redis] UPSTASH_REDIS_REST_URL / TOKEN chưa được cấu hình — bỏ qua cache.');
    }
    return null;
  }
  return new Redis({ url, token });
}

// Singleton — tái dùng qua nhiều request trong cùng process
const redis: Redis | null = (() => {
  try { return createClient(); }
  catch { return null; }
})();

export default redis;

// ─── TTL constants ────────────────────────────────────────────────────────────
export const TTL = {
  ELO:        60 * 60 * 24,      // 24h — Elo đội tuyển
  PREDICTION: 60 * 60 * 2,       // 2h  — kết quả prediction
  FORM_BITS:  60 * 60 * 12,      // 12h — form bitfield
} as const;

// ─── Redis key helpers ────────────────────────────────────────────────────────
export const KEYS = {
  eloHash:    'elo:FIFA',                          // HASH { teamName → elo }
  prediction: (id: string) => `pred:${id}`,        // STRING JSON
  formBits:   (slug: string) => `form:${slug}`,    // BITFIELD 10 bits
} as const;

// ─── Safe wrappers — không crash khi Redis null/lỗi ─────────────────────────

export async function rGet(key: string): Promise<string | null> {
  if (!redis) return null;
  try { return await redis.get<string>(key); }
  catch { return null; }
}

export async function rSet(key: string, val: string, ttl: number): Promise<void> {
  if (!redis) return;
  try { await redis.set(key, val, { ex: ttl }); }
  catch { /* silent */ }
}

export async function rHGet(hash: string, field: string): Promise<string | null> {
  if (!redis) return null;
  try { return await redis.hget<string>(hash, field); }
  catch { return null; }
}

export async function rHSet(hash: string, data: Record<string, string | number>, ttl: number): Promise<void> {
  if (!redis) return;
  try {
    await redis.hset(hash, data);
    await redis.expire(hash, ttl);
  } catch { /* silent */ }
}

// ─── BITFIELD: form 5 trận — 2 bits/game (W=3, D=2, L=0) ───────────────────
//   bit offset: game1 = 0, game2 = 2, game3 = 4, game4 = 6, game5 = 8

export async function rSetForm(slug: string, form: string[]): Promise<void> {
  if (!redis) return;
  try {
    const key = KEYS.formBits(slug);
    const encode = (r: string) => r === 'W' ? 3 : r === 'D' ? 2 : 0;
    // Build BITFIELD SET commands
    const cmds = form.slice(0, 5).flatMap((r, i) =>
      ['SET', 'u2', String(i * 2), String(encode(r))] as [string, string, string, string]
    );
    if (cmds.length) {
      await (redis as any).bitfield(key, ...cmds);
      await redis.expire(key, TTL.FORM_BITS);
    }
  } catch { /* silent */ }
}

export async function rGetForm(slug: string): Promise<string[] | null> {
  if (!redis) return null;
  try {
    const key = KEYS.formBits(slug);
    const cmds = [0, 2, 4, 6, 8].flatMap(offset =>
      ['GET', 'u2', String(offset)] as [string, string, string]
    );
    const bits = await (redis as any).bitfield(key, ...cmds) as number[] | null;
    if (!bits || bits.every(b => b === 0)) return null;
    const decode = (v: number) => v === 3 ? 'W' : v === 2 ? 'D' : 'L';
    return bits.map(decode);
  } catch { return null; }
}
