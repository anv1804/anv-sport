import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getWinProbability(id: string, name1: string, name2: string) {
  if (isPlaceholderTeam(name1) || isPlaceholderTeam(name2)) {
    return { w1: 50, draw: 0, w2: 50 };
  }

  const key = (name1 + name2).toLowerCase();
  if (key.includes('switzerland') && key.includes('canada')) {
    return { w1: 52, draw: 23, w2: 25 };
  }

  const getRankLocal = (name: string) => {
    const ranks: Record<string, number> = {
      'Argentina': 1, 'France': 2, 'England': 3, 'Brazil': 4, 'Belgium': 5,
      'Portugal': 6, 'Netherlands': 7, 'Spain': 8, 'Germany': 9, 'Uruguay': 10,
      'Colombia': 11, 'Croatia': 12, 'Morocco': 13, 'Mexico': 14, 'USA': 15,
      'Switzerland': 40, 'Japan': 17, 'South Korea': 18, 'Canada': 20, 'Senegal': 20,
      'Denmark': 21, 'Austria': 22, 'Turkey': 23, 'Ecuador': 24, 'Chile': 25,
      'Italy': 26, 'Australia': 27, 'Iran': 28, 'Poland': 29, 'Czech Republic': 30,
      'Scotland': 31, 'Norway': 32, 'Wales': 33, 'Hungary': 34, 'Paraguay': 35,
      'Serbia': 36, 'Costa Rica': 37, 'Saudi Arabia': 38, 'Tunisia': 39, 'Egypt': 40,
      'Romania': 41, 'Algeria': 42, 'Slovakia': 43, 'Ivory Coast': 44, 'Cameroon': 45,
      'Ghana': 46, 'South Africa': 47, 'Panama': 49, 'DR Congo': 55,
      'Bosnia & Herzegovina': 57, 'Qatar': 60, 'Iraq': 63, 'Uzbekistan': 64,
      'Cape Verde': 65, 'Curaçao': 76, 'Haiti': 83, 'Jordan': 87, 'New Zealand': 96,
    };
    const cleanName = name.trim();
    if (ranks[cleanName]) return ranks[cleanName];
    for (const k of Object.keys(ranks)) {
      if (cleanName.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(cleanName.toLowerCase())) {
        return ranks[k];
      }
    }
    const h = cleanName.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    return ((h * 7 + 1) % 80 + 20);
  };

  const rank1 = getRankLocal(name1);
  const rank2 = getRankLocal(name2);

  const combined = id + name1 + name2;
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    hash = combined.charCodeAt(i) + ((hash << 5) - hash);
  }
  const absHash = Math.abs(hash);
  const variance = (absHash % 11) - 5; // -5% to +5% organic variation
  
  const draw = 18 + (absHash % 11); // 18% to 28% draw
  const remaining = 100 - draw;
  
  const rankDiff = rank2 - rank1; // Positive if team1 is higher ranked (better), negative if team2 is better
  let ratio1 = 0.5 + (rankDiff * 0.016) + (variance / 100);
  ratio1 = Math.min(0.88, Math.max(0.12, ratio1));
  
  const w1 = Math.round(remaining * ratio1);
  const w2 = remaining - w1;

  return { w1, draw, w2 };
}

/**
 * Tính lại xác suất thắng/hòa/thua khi trận đang diễn ra.
 * Dựa vào tỉ số hiện tại và số phút còn lại (mô hình xác suất Poisson đơn giản).
 *
 * @param score1 Bàn thắng đội 1 hiện tại
 * @param score2 Bàn thắng đội 2 hiện tại
 * @param minutesElapsed Số phút đã thi đấu (0-90)
 * @param preMatchW1 Xác suất trận thắng đội 1 trước trận (0-100)
 * @param preMatchDraw Xác suất hòa trước trận (0-100)
 * @param preMatchW2 Xác suất trận thắng đội 2 trước trận (0-100)
 */
export function getLiveProbability(
  score1: number,
  score2: number,
  minutesElapsed: number,
  preMatchW1: number,
  preMatchDraw: number,
  preMatchW2: number
): { w1: number; draw: number; w2: number } {
  // Phút 90 từ ESPN thường là đang đá bù giờ, chưa kết thúc.
  // Thêm 5 phút bù giờ mặc định để tránh nhảy về 0% sai.
  const STOPPAGE_TIME = 5;
  const effectiveMax = minutesElapsed >= 90 ? 90 + STOPPAGE_TIME : 90;
  const minsRemaining = Math.max(0, effectiveMax - minutesElapsed);

  // Tốc độ ghi bàn trung bình World Cup ~2.5 bàn/90 phút
  const avgGoalsPerMin = 2.5 / 90;
  const expectedGoalsLeft = avgGoalsPerMin * minsRemaining;

  const diff = score1 - score2; // dương: đội 1 dẫn, âm: đội 2 dẫn

  // Nếu trận kết thúc thật sự (hết cả bù giờ)
  if (minsRemaining <= 0) {
    if (diff > 0) return { w1: 96, draw: 3, w2: 1 };  // dẫn → thắng gần chắc; hòa > thua ngược (vô lý)
    if (diff < 0) return { w1: 1, draw: 3, w2: 96 };
    return { w1: 2, draw: 96, w2: 2 };                  // hòa cuối trận
  }

  // Xác suất đảo ngược bàn thắng dựa vào số bàn chênh lệch và expected goals còn lại
  // Dùng xấp xỉ Poisson: P(scoring k+ goals) từ Poisson distribution
  const poissonCdf = (k: number, lambda: number): number => {
    if (lambda <= 0) return k >= 0 ? 1 : 0;
    let p = 0;
    let term = Math.exp(-lambda);
    for (let i = 0; i <= k; i++) {
      p += term;
      term *= lambda / (i + 1);
    }
    return Math.min(1, p);
  };

  // Xác suất đội đang kém bàn ghi đủ để đảo ngược / bằng
  let w1: number, draw: number, w2: number;

  if (diff === 0) {
    // Đang hòa — ai sẽ ghi bàn trước? Dùng pre-match ratio
    const preRatio1 = preMatchW1 / Math.max(1, preMatchW1 + preMatchW2);
    const pSomeoneScores = 1 - poissonCdf(0, expectedGoalsLeft);
    const pStaysDrawn = poissonCdf(0, expectedGoalsLeft);

    const pEqualized = pStaysDrawn + pSomeoneScores * 0.18;
    draw = Math.round(pEqualized * 100);
    const pGoal = (1 - pEqualized);
    w1 = Math.round(pGoal * preRatio1 * 100);
    w2 = 100 - draw - w1;
  } else {
    const absGap = Math.abs(diff);
    const leadingIsTeam1 = diff > 0;

    const lambdaTrailing = expectedGoalsLeft * 0.48;
    const lambdaLeading  = expectedGoalsLeft * 0.52;

    // P(trailing equalizes): ghi đúng absGap bàn, leading không ghi thêm
    const pTrailingEqualizes = (poissonCdf(absGap, lambdaTrailing) - poissonCdf(absGap - 1, lambdaTrailing)) * poissonCdf(0, lambdaLeading * 0.5);
    // P(trailing wins): ghi >= absGap+1 bàn
    const pTrailingWins = (1 - poissonCdf(absGap, lambdaTrailing)) * (poissonCdf(0, lambdaLeading * 0.4));

    // INVARIANT: draw >= trailing_win (để hòa cần ít bàn hơn để thắng)
    const pDraw = Math.max(pTrailingEqualizes, pTrailingWins * 1.5);
    const pLeadingWins = Math.max(0, 1 - pTrailingWins - pDraw);

    if (leadingIsTeam1) {
      w1   = Math.round(Math.min(98, pLeadingWins * 100));
      draw = Math.round(Math.min(50, pDraw * 100));
      w2   = Math.max(1, 100 - w1 - draw);
      // Đảm bảo draw >= w2 (đội đang kém cần ít bàn hơn để hòa)
      if (draw < w2) { const tmp = draw; draw = w2; w2 = tmp; }
    } else {
      w2   = Math.round(Math.min(98, pLeadingWins * 100));
      draw = Math.round(Math.min(50, pDraw * 100));
      w1   = Math.max(1, 100 - w2 - draw);
      if (draw < w1) { const tmp = draw; draw = w1; w1 = tmp; }
    }
  }

  // Blend nhẹ với pre-match (10% weight) để tránh cực đoan
  const blend = (live: number, pre: number) => Math.round(live * 0.9 + pre * 0.1);
  const result = {
    w1:   Math.max(1, Math.min(98, blend(w1,   preMatchW1))),
    draw: Math.max(1, Math.min(60, blend(draw, preMatchDraw))),
    w2:   Math.max(1, Math.min(98, blend(w2,   preMatchW2))),
  };

  // Cuối cùng: normalize về 100
  const total = result.w1 + result.draw + result.w2;
  if (total !== 100) {
    const diff100 = 100 - total;
    result.w1 = Math.max(1, result.w1 + Math.round(diff100 / 2));
    result.w2 = Math.max(1, result.w2 + (100 - result.w1 - result.draw));
  }

  return result;
}


export function getAiPct(t1: string, t2: string) {
  const key = (t1 + t2).toLowerCase();
  if (key.includes('switzerland') && key.includes('canada')) {
    return 92;
  }
  const hash = (t1 + t2).split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return ((hash * 17 + 43) % 15) + 84;
}

export function isPlaceholderTeam(name: string): boolean {
  if (!name) return true;
  const clean = name.trim().toUpperCase();
  if (/^W\d+$/.test(clean)) return true;
  if (/^RU\d+$/.test(clean)) return true;
  if (clean.includes('WINNER') || clean.includes('RUNNER') || clean.includes('TBD') || clean === 'CHƯA XÁC ĐỊNH') return true;
  if (clean.includes('THẮNG') || clean.includes('THUA') || clean.includes('TRẬN')) return true;
  if (/^[1-4][A-L]$/.test(clean)) return true;
  return false;
}
