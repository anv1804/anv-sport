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
