/**
 * POST /api/sync-elo
 * ─────────────────────────────────────────────────────────────
 * Fetch ESPN World Cup standings → tính Elo thực từ tournament
 * performance → ghi vào Redis HASH "elo:FIFA"
 *
 * Chạy tự động mỗi 24h qua supercomputerScheduler hoặc gọi thủ công.
 *
 * Công thức Elo từ group stage:
 *   baseElo  = 2100 - (fifaRank - 1) × 13       (từ seed FIFA rank)
 *   perfAdj  = wins×30 + ties×10 - losses×20    (tối đa ±90)
 *   goalAdj  = clamp((gf - ga) / played × 8, -40, +40)
 *   finalElo = clamp(baseElo + perfAdj + goalAdj, 1000, 2200)
 */

import { NextResponse } from 'next/server';
import { setEloFromStandings } from '@/lib/matchEngine';

export const dynamic = 'force-dynamic';

const ESPN_STANDINGS = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/standings';

const FIFA_RANK_SEED: Record<string, number> = {
  'Argentina':1,'France':2,'England':3,'Brazil':4,'Spain':5,'Portugal':6,
  'Netherlands':7,'Germany':8,'Belgium':9,'Italy':10,'Uruguay':11,
  'Colombia':12,'Croatia':13,'Morocco':14,'Mexico':15,'Denmark':16,
  'USA':17,'Japan':18,'Switzerland':19,'Austria':20,'South Korea':21,
  'Senegal':22,'Turkey':23,'Ecuador':24,'Canada':25,'Australia':26,
  'Chile':27,'Poland':28,'Czech Republic':29,'Norway':30,'Ukraine':31,
  'Serbia':32,'Hungary':33,'Slovakia':34,'Romania':35,'Scotland':36,
  'Wales':37,'Algeria':38,'Ivory Coast':39,'Tunisia':40,'Egypt':41,
  'Cameroon':42,'Ghana':43,'Paraguay':44,'Costa Rica':45,'Saudi Arabia':46,
  'Iran':47,'Iraq':48,'Uzbekistan':49,'South Africa':50,'DR Congo':51,
  'Panama':52,'Cape Verde':53,'Jordan':54,'New Zealand':55,'Haiti':56,
  'Bosnia & Herzegovina':57,'Qatar':58,'Curaçao':59,
};

function rankToElo(rank: number) { return 2100 - (rank - 1) * 13; }

function getStat(stats: any[], name: string): number {
  const s = stats?.find((x: any) =>
    (x.name || x.abbreviation || '').toLowerCase() === name.toLowerCase()
  );
  return parseFloat(s?.value ?? s?.displayValue ?? '0') || 0;
}

export async function POST(req: Request) {
  // Bảo vệ: chỉ nội bộ hoặc cron
  const auth = req.headers.get('x-sync-secret');
  if (process.env.SYNC_SECRET && auth !== process.env.SYNC_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const res  = await fetch(ESPN_STANDINGS, { next: { revalidate: 0 } });
    const json = await res.json().catch(() => null);

    // ESPN standings: json.standings.entries[] hoặc json.children[].standings.entries[]
    const allGroups: any[] =
      json?.children?.map((c: any) => c?.standings?.entries ?? []).flat() ??
      json?.standings?.entries ?? [];

    const entries: { name: string; elo: number }[] = [];
    const seen = new Set<string>();

    for (const entry of allGroups) {
      const teamName: string = entry.team?.displayName ?? entry.team?.name ?? '';
      if (!teamName || seen.has(teamName)) continue;
      seen.add(teamName);

      const stats  = entry.stats ?? [];
      const wins   = getStat(stats, 'wins')   || getStat(stats, 'W')  || 0;
      const losses = getStat(stats, 'losses') || getStat(stats, 'L')  || 0;
      const ties   = getStat(stats, 'ties')   || getStat(stats, 'T')  || getStat(stats, 'D') || 0;
      const gf     = getStat(stats, 'pointsFor')     || getStat(stats, 'GF') || 0;
      const ga     = getStat(stats, 'pointsAgainst') || getStat(stats, 'GA') || 0;
      const played = wins + losses + ties;

      // Tìm FIFA rank từ seed (fuzzy match)
      let rank = 99;
      for (const [k, r] of Object.entries(FIFA_RANK_SEED)) {
        if (teamName.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(teamName.toLowerCase())) {
          rank = r; break;
        }
      }

      const baseElo = rankToElo(rank);
      const perfAdj = wins * 30 + ties * 10 - losses * 20;
      const goalAdj = played > 0 ? Math.max(-40, Math.min(40, ((gf - ga) / played) * 8)) : 0;
      const finalElo = Math.max(1000, Math.min(2200, baseElo + perfAdj + goalAdj));

      entries.push({ name: teamName, elo: finalElo });
    }

    // Nếu ESPN chưa có standings (trước giải), dùng seed thuần
    if (entries.length === 0) {
      for (const [name, rank] of Object.entries(FIFA_RANK_SEED))
        entries.push({ name, elo: rankToElo(rank) });
    }

    await setEloFromStandings(entries);

    return NextResponse.json({
      ok: true,
      synced: entries.length,
      sample: entries.slice(0, 5),
      source: entries.length > 0 && allGroups.length > 0 ? 'espn-live' : 'seed-fallback',
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// GET — để dễ test thủ công từ browser
export async function GET(req: Request) { return POST(req); }
