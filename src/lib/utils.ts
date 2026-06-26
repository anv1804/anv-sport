import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { getWinProbabilityV2, getLiveProbabilityV2Compat } from '@/lib/matchEngine';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}


/** Backward-compat wrapper — delegates to matchEngine Elo+Poisson model */
export function getWinProbability(id: string, name1: string, name2: string) {
  if (isPlaceholderTeam(name1) || isPlaceholderTeam(name2)) {
    return { w1: 50, draw: 0, w2: 50 };
  }
  return getWinProbabilityV2(id, name1, name2);
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
/** Backward-compat wrapper — delegates to matchEngine bivariate Poisson in-play model */
export function getLiveProbability(
  score1: number,
  score2: number,
  minutesElapsed: number,
  preMatchW1: number,
  preMatchDraw: number,
  preMatchW2: number
): { w1: number; draw: number; w2: number } {
  return getLiveProbabilityV2Compat(score1, score2, minutesElapsed, preMatchW1, preMatchDraw, preMatchW2);
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
