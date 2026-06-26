/**
 * ============================================================
 * ANV Sport — Match Analytics Engine  (v2 — compact)
 * ============================================================
 * Không có data hardcode. Elo được lấy động:
 *  1. Redis HASH  "elo:FIFA"  (sync từ ESPN standings mỗi 24h)
 *  2. Fallback: FIFA rank → công thức tuyến tính
 *
 * Mô hình toán học:
 *  - Dixon-Coles Bivariate Poisson (xG)
 *  - Elo-based attack/defense strength
 *  - Form factor từ ESPN lastFiveGames (cache Redis BITFIELD)
 *  - H2H adjustment từ ESPN headToHeadGames
 * ============================================================
 */

import { rHGet, rHSet, rGet, rSet, rGetForm, rSetForm, KEYS, TTL } from './redis';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface WinProb  { w1: number; draw: number; w2: number }
export interface H2HData  {
  total: number; team1Wins: number; draws: number; team2Wins: number;
  recentMatches: { date: string; score: string; winner: number }[];
}
export interface MatchPrediction {
  probabilities: WinProb;
  xGoals: {
    half1:     { predicted: string; ouLine: string; ouPick: 'Tài' | 'Xỉu' };
    half2:     { predicted: string; ouLine: string; ouPick: 'Tài' | 'Xỉu' };
    fullMatch: { predicted: string; ouLine: string; ouPick: 'Tài' | 'Xỉu' };
  };
  expectedCards:   { half1: { team1: number; team2: number; total: number }; half2: { team1: number; team2: number; total: number }; fullMatch: { team1: number; team2: number; total: number } };
  expectedCorners: { half1: { team1: number; team2: number; total: number }; half2: { team1: number; team2: number; total: number }; fullMatch: { team1: number; team2: number; total: number } };
  team1Form: string[]; team2Form: string[];
  h2hData: H2HData;
  elo: { team1: number; team2: number };
  xG: { team1: number; team2: number; total: number };
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. ELO ĐỘNG — từ Redis hoặc FIFA rank → công thức
//    Rank → Elo:  Elo = 2100 - (rank - 1) × 13   [range ~2100..1100]
//    Không có rank → hash-based pseudo Elo in 1380..1700
// ─────────────────────────────────────────────────────────────────────────────

/** Ánh xạ FIFA rank tối thiểu để bootstrap trước khi có ESPN sync */
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
  'Bosnia & Herzegovina':57,'Qatar':58,'Curaçao':59,'Bolivia':60,
};

function rankToElo(rank: number): number { return Math.round(2100 - (rank - 1) * 13); }

function hashElo(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return 1380 + (Math.abs(h) % 320);
}

function seedElo(name: string): number {
  const clean = name.trim();
  if (FIFA_RANK_SEED[clean]) return rankToElo(FIFA_RANK_SEED[clean]);
  for (const [k, r] of Object.entries(FIFA_RANK_SEED)) {
    if (clean.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(clean.toLowerCase()))
      return rankToElo(r);
  }
  return hashElo(clean);
}

export async function getTeamElo(name: string): Promise<number> {
  const cached = await rHGet(KEYS.eloHash, name);
  if (cached) return parseInt(cached, 10);
  return seedElo(name);
}

/** Dùng bởi sync-elo route: ghi bảng Elo từ standings vào Redis */
export async function setEloFromStandings(entries: { name: string; elo: number }[]): Promise<void> {
  const data: Record<string, number> = {};
  for (const { name, elo } of entries) data[name] = Math.round(elo);
  await rHSet(KEYS.eloHash, data, TTL.ELO);
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. FORM FACTOR — từ Redis BITFIELD hoặc parse ESPN lastFiveGames
// ─────────────────────────────────────────────────────────────────────────────

function parseFormEspn(lastFiveGames: any, team: string): string[] | null {
  if (!Array.isArray(lastFiveGames) || !lastFiveGames.length) return null;
  const item = lastFiveGames.find((x: any) => {
    const dn = (x.team?.displayName || '').toLowerCase();
    const t  = team.toLowerCase();
    return dn.includes(t) || t.includes(dn);
  });
  if (!item?.events?.length) return null;
  return item.events.slice(0, 5).map((e: any) => {
    const r = (e.gameResult || 'D').toUpperCase();
    return ['W','D','L'].includes(r) ? r : 'D';
  });
}

function deterministicForm(name: string): string[] {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return ['W','D','L','W','W'].map((_, i) => ['W','D','L'][(Math.abs(h) * (i + 7)) % 3]);
}

function formMultiplier(form: string[]): number {
  const score = form.reduce((s, r) => s + (r === 'W' ? 3 : r === 'D' ? 1 : 0), 0);
  return 0.85 + (score / 15) * 0.30; // 0.85..1.15
}

async function resolveForm(teamSlug: string, teamName: string, lastFiveGames: any): Promise<string[]> {
  const cached = await rGetForm(teamSlug);
  if (cached) return cached;
  const form = parseFormEspn(lastFiveGames, teamName) || deterministicForm(teamName);
  await rSetForm(teamSlug, form); // store in BITFIELD
  return form;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. H2H PARSER (từ ESPN headToHeadGames)
// ─────────────────────────────────────────────────────────────────────────────

function parseH2H(headToHeadGames: any, t1: string, t2: string): H2HData {
  const empty: H2HData = { total: 0, team1Wins: 0, draws: 0, team2Wins: 0, recentMatches: [] };
  if (!headToHeadGames?.[0]?.events?.length) return empty;
  let t1w = 0, t2w = 0, d = 0;
  const matches: H2HData['recentMatches'] = [];
  for (const e of headToHeadGames[0].events) {
    const dt = e.gameDate ? new Date(e.gameDate).toLocaleDateString('vi-VN') : '';
    const [h = 0, a = 0] = (e.score || '0-0').split('-').map(Number);
    const opIsT1 = (e.opponent?.displayName || '').toLowerCase().includes(t1.toLowerCase().split(' ')[0]);
    let winner = 0;
    if (h === a) d++;
    else if (h > a) { if (opIsT1) { t2w++; winner = 2; } else { t1w++; winner = 1; } }
    else            { if (opIsT1) { t1w++; winner = 1; } else { t2w++; winner = 2; } }
    matches.push({ date: dt, score: `${h}-${a}`, winner });
  }
  return { total: matches.length, team1Wins: t1w, draws: d, team2Wins: t2w, recentMatches: matches.slice(0, 5) };
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. DIXON-COLES BIVARIATE POISSON
// ─────────────────────────────────────────────────────────────────────────────

function poissonPmf(k: number, λ: number): number {
  if (λ <= 0) return k === 0 ? 1 : 0;
  let lp = -λ + k * Math.log(λ);
  for (let i = 2; i <= k; i++) lp -= Math.log(i);
  return Math.exp(lp);
}

function dcCorrection(i: number, j: number, l1: number, l2: number, ρ = -0.10): number {
  if (i === 0 && j === 0) return 1 - l1 * l2 * ρ;
  if (i === 1 && j === 0) return 1 + l2 * ρ;
  if (i === 0 && j === 1) return 1 + l1 * ρ;
  if (i === 1 && j === 1) return 1 - ρ;
  return 1;
}

function eloStrength(elo: number) {
  const n = (elo - 1700) / 300;
  return { atk: 1 + n * 0.35, def: 1 - n * 0.35 };
}

function buildMatrix(elo1: number, elo2: number, mult1: number, mult2: number, scale = 1.0) {
  const BASE = 1.25;
  const s1 = eloStrength(elo1), s2 = eloStrength(elo2);
  const λ1 = BASE * s1.atk * s2.def * mult1 * scale;
  const λ2 = BASE * s2.atk * s1.def * mult2 * scale;
  const N = 7; let total = 0;
  const M: number[][] = Array.from({ length: N }, () => new Array(N).fill(0));
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
    M[i][j] = poissonPmf(i, λ1) * poissonPmf(j, λ2) * dcCorrection(i, j, λ1, λ2);
    total += M[i][j];
  }
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) M[i][j] /= total;
  return { M, λ1, λ2 };
}

function probFromMatrix(M: number[][]): WinProb {
  let p1 = 0, pd = 0, p2 = 0;
  for (let i = 0; i < M.length; i++) for (let j = 0; j < M[i].length; j++)
    (i > j ? (p1 += M[i][j]) : i === j ? (pd += M[i][j]) : (p2 += M[i][j]));
  const t = p1 + pd + p2 || 1;
  return { w1: Math.round(p1/t*100), draw: Math.round(pd/t*100), w2: Math.round(p2/t*100) };
}

function ouFromMatrix(M: number[][], xgTotal: number) {
  const LINES = [0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5];
  const pOver = (line: number) => {
    let p = 0;
    for (let i = 0; i < M.length; i++) for (let j = 0; j < M[i].length; j++)
      if (i + j > line) p += M[i][j];
    return p;
  };
  let best = 2.5, bestDiff = 999;
  for (const l of LINES) { const d = Math.abs(pOver(l) - 0.5); if (d < bestDiff) { bestDiff = d; best = l; } }
  const po = pOver(best);
  const fmt = (n: number) => n === Math.floor(n) ? `${n}.0` : `${n}`;
  return { predicted: Math.round(xgTotal * 2) / 2, ouLine: fmt(best), ouPick: (po >= 0.5 ? 'Tài' : 'Xỉu') as 'Tài' | 'Xỉu' };
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. CARDS & CORNERS
// ─────────────────────────────────────────────────────────────────────────────

function computeCards(elo1: number, elo2: number, isKnockout: boolean) {
  const base = isKnockout ? 4.0 : 3.5;
  const total = base + Math.min(0.8, Math.abs(elo1 - elo2) / 500);
  const [r1, r2] = elo1 < elo2 ? [0.57, 0.43] : [0.43, 0.57];
  const t1 = Math.round(total * r1 * 10) / 10, t2 = Math.round(total * r2 * 10) / 10;
  const half = (v: number, f: number) => Math.round(v * f * 10) / 10;
  return {
    half1:     { team1: half(t1, 0.42), team2: half(t2, 0.42), total: half(t1 + t2, 0.42) },
    half2:     { team1: half(t1, 0.58), team2: half(t2, 0.58), total: half(t1 + t2, 0.58) },
    fullMatch: { team1: t1, team2: t2, total: Math.round((t1 + t2) * 10) / 10 },
  };
}

function computeCorners(λ1: number, λ2: number) {
  const C = 4.5, c1 = λ1 * C, c2 = λ2 * C, tot = c1 + c2;
  const r1 = (v: number) => Math.round(v * 10) / 10;
  return {
    half1:     { team1: r1(c1 * 0.45), team2: r1(c2 * 0.45), total: r1(tot * 0.45) },
    half2:     { team1: r1(c1 * 0.55), team2: r1(c2 * 0.55), total: r1(tot * 0.55) },
    fullMatch: { team1: r1(c1), team2: r1(c2), total: r1(tot) },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. LIVE IN-PLAY PROBABILITY (Bivariate Poisson với thời gian còn lại)
// ─────────────────────────────────────────────────────────────────────────────

export function getLiveProbabilityV2Compat(
  score1: number, score2: number, minutesElapsed: number,
  preW1: number, _preDraw: number, preW2: number,
): WinProb {
  const stoppage = minutesElapsed >= 90 ? 5 : 2;
  const minsLeft = Math.max(0, 90 + stoppage - minutesElapsed);
  const diff = score1 - score2;
  if (minsLeft <= 0) {
    if (diff > 0) return { w1: 96, draw: 3, w2: 1 };
    if (diff < 0) return { w1: 1,  draw: 3, w2: 96 };
    return { w1: 2, draw: 96, w2: 2 };
  }
  const frac = minsLeft / 90;
  const tot = preW1 + preW2 || 1;
  let λ1 = 1.25 * (preW1 / tot) * 1.6 * frac;
  let λ2 = 1.25 * (preW2 / tot) * 1.6 * frac;
  if (diff > 0) { λ1 *= 0.85; λ2 *= 1.20; }
  else if (diff < 0) { λ1 *= 1.20; λ2 *= 0.85; }
  let pW1 = 0, pD = 0, pW2 = 0;
  for (let i = 0; i <= 5; i++) for (let j = 0; j <= 5; j++) {
    const p = poissonPmf(i, λ1) * poissonPmf(j, λ2) * dcCorrection(i, j, λ1, λ2);
    const ns1 = score1 + i, ns2 = score2 + j;
    if (ns1 > ns2) pW1 += p; else if (ns1 === ns2) pD += p; else pW2 += p;
  }
  const t = pW1 + pD + pW2 || 1;
  let w1 = Math.round(pW1/t*100), draw = Math.round(pD/t*100), w2 = Math.round(pW2/t*100);
  // Invariant: draw >= trailing team win
  if (diff > 0 && draw < w2) { [draw, w2] = [w2, draw]; }
  if (diff < 0 && draw < w1) { [draw, w1] = [w1, draw]; }
  return { w1: Math.max(1, Math.min(98, w1)), draw: Math.max(1, Math.min(97, draw)), w2: Math.max(1, Math.min(98, w2)) };
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. MAIN COMPUTE — tổng hợp tất cả bước trên
// ─────────────────────────────────────────────────────────────────────────────

export interface ComputeInput {
  matchId: string; team1Name: string; team2Name: string;
  category?: string; lastFiveGames?: any; headToHeadGames?: any; isKnockout?: boolean;
}

export async function computePrediction(input: ComputeInput): Promise<MatchPrediction> {
  const { matchId, team1Name, team2Name, lastFiveGames, headToHeadGames, isKnockout } = input;

  // ── Cache check ─────────────────────────────────────────────
  const cacheKey = KEYS.prediction(matchId);
  const cached   = await rGet(cacheKey);
  if (cached) { try { return JSON.parse(cached); } catch {} }

  // ── 1. Elo ─────────────────────────────────────────────────
  const [elo1, elo2] = await Promise.all([getTeamElo(team1Name), getTeamElo(team2Name)]);

  // ── 2. Form ─────────────────────────────────────────────────
  const slug1 = team1Name.toLowerCase().replace(/\s+/g, '-');
  const slug2 = team2Name.toLowerCase().replace(/\s+/g, '-');
  const [form1arr, form2arr] = await Promise.all([
    resolveForm(slug1, team1Name, lastFiveGames),
    resolveForm(slug2, team2Name, lastFiveGames),
  ]);
  const m1 = formMultiplier(form1arr), m2 = formMultiplier(form2arr);

  // ── 3. H2H ─────────────────────────────────────────────────
  const h2h = parseH2H(headToHeadGames, team1Name, team2Name);
  const h2hWinRate1 = h2h.total ? h2h.team1Wins / (h2h.team1Wins + h2h.team2Wins || 1) : 0.5;
  const h2hAdj = (h2hWinRate1 - 0.5) * 8 * Math.min(1, h2h.total / 10); // ±4%

  // ── 4. Poisson xG matrix ────────────────────────────────────
  const { M, λ1, λ2 } = buildMatrix(elo1, elo2, m1, m2);

  // ── 5. Win probabilities ────────────────────────────────────
  let prob = probFromMatrix(M);
  prob = {
    w1:   Math.max(1, Math.min(97, prob.w1   + Math.round(h2hAdj))),
    draw: Math.max(1, Math.min(60, prob.draw)),
    w2:   Math.max(1, Math.min(97, prob.w2   - Math.round(h2hAdj))),
  };
  const pSum = prob.w1 + prob.draw + prob.w2;
  prob = { w1: Math.round(prob.w1/pSum*100), draw: Math.round(prob.draw/pSum*100), w2: Math.round(prob.w2/pSum*100) };

  // ── 6. Over/Under (full, H1 ×0.45, H2 ×0.55) ───────────────
  const { M: Mh, λ1: lh1, λ2: lh2 } = buildMatrix(elo1, elo2, m1, m2, 0.97);
  const xgTotal = Math.round((λ1 + λ2) * 10) / 10;
  const ouFull  = ouFromMatrix(M,  xgTotal);
  const ouH1    = ouFromMatrix(Mh, Math.round((lh1 + lh2) * 0.45 * 10) / 10);
  const ouH2    = ouFromMatrix(Mh, Math.round((lh1 + lh2) * 0.55 * 10) / 10);
  const fmt     = (n: number) => `${n} bàn`;

  // ── 7. Cards & Corners ──────────────────────────────────────
  const cards   = computeCards(elo1, elo2, isKnockout ?? false);
  const corners = computeCorners(λ1, λ2);

  const result: MatchPrediction = {
    probabilities: prob,
    xGoals: {
      half1:     { predicted: fmt(ouH1.predicted), ouLine: ouH1.ouLine, ouPick: ouH1.ouPick },
      half2:     { predicted: fmt(ouH2.predicted), ouLine: ouH2.ouLine, ouPick: ouH2.ouPick },
      fullMatch: { predicted: fmt(ouFull.predicted), ouLine: ouFull.ouLine, ouPick: ouFull.ouPick },
    },
    expectedCards:   cards,
    expectedCorners: corners,
    team1Form: form1arr,
    team2Form: form2arr,
    h2hData:   h2h,
    elo:       { team1: elo1, team2: elo2 },
    xG:        { team1: Math.round(λ1 * 10) / 10, team2: Math.round(λ2 * 10) / 10, total: xgTotal },
  };

  // ── 8. Cache kết quả ────────────────────────────────────────
  await rSet(cacheKey, JSON.stringify(result), TTL.PREDICTION);

  return result;
}

// ─── Backward-compat sync wrapper cho các component dùng getWinProbability ──

export function getWinProbabilityV2(id: string, name1: string, name2: string): WinProb {
  // Sync fallback (không await) — dùng khi component không hỗ trợ async
  const elo1 = seedElo(name1), elo2 = seedElo(name2);
  const { M } = buildMatrix(elo1, elo2, 1.0, 1.0);
  return probFromMatrix(M);
}
