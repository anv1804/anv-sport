export interface Fixture {
  id: string;
  category: string;
  sportType: string;
  matchDate: string;
  matchTime: string;
  status: string;
  score1: number | null;
  score2: number | null;
  ground: string;
  team1: { name: string; logo: string };
  team2: { name: string; logo: string };
}

export function readStored<T extends string>(key: string, valid: readonly T[], fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  const v = localStorage.getItem(key);
  return valid.includes(v as T) ? (v as T) : fallback;
}

export function readStoredString(key: string, fallback = ''): string {
  if (typeof window === 'undefined') return fallback;
  return localStorage.getItem(key) ?? fallback;
}

export function getLocalDateString(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export const GROUP_COLORS: Record<string, string> = {
  'GROUP A': '#f59e0b',
  'GROUP B': '#3b82f6',
  'GROUP C': '#a855f7',
  'GROUP D': '#ef4444',
  'GROUP E': '#06b6d4',
  'GROUP F': '#10b981',
  'GROUP G': '#f97316',
  'GROUP H': '#ec4899',
};

export const FIFA_RANKS: Record<string, number> = {
  'Argentina': 1, 'France': 2, 'England': 3, 'Brazil': 4, 'Belgium': 5,
  'Portugal': 6, 'Netherlands': 7, 'Spain': 8, 'Germany': 9, 'Uruguay': 10,
  'Colombia': 11, 'Croatia': 12, 'Morocco': 13, 'Mexico': 14, 'USA': 15,
  'Switzerland': 40,
  'Japan': 17, 'South Korea': 18,
  'Canada': 20,
  'Senegal': 20,
  'Denmark': 21, 'Austria': 22, 'Turkey': 23, 'Ecuador': 24, 'Chile': 25,
  'Italy': 26, 'Australia': 27, 'Iran': 28, 'Poland': 29, 'Czech Republic': 30,
  'Scotland': 31, 'Norway': 32, 'Wales': 33, 'Hungary': 34, 'Paraguay': 35,
  'Serbia': 36, 'Costa Rica': 37, 'Saudi Arabia': 38, 'Tunisia': 39, 'Egypt': 40,
  'Romania': 41, 'Algeria': 42, 'Slovakia': 43, 'Ivory Coast': 44, 'Cameroon': 45,
  'Ghana': 46, 'South Africa': 47, 'Panama': 49, 'DR Congo': 55,
  'Bosnia & Herzegovina': 57, 'Qatar': 60, 'Iraq': 63, 'Uzbekistan': 64,
  'Cape Verde': 65, 'Curaçao': 76, 'Haiti': 83, 'Jordan': 87, 'New Zealand': 96,
};

export const TAB_TO_ROUND_KEY: Record<string, string> = {
  'Vòng 32 đội': 'Round of 32',
  'Vòng 16 đội': 'Round of 16',
  'Tứ kết': 'Quarter-final',
  'Bán kết': 'Semi-final',
  'Tranh hạng ba': 'Match for third place',
  'Chung kết': 'Final',
};

export function getRank(name: string): number {
  const h = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return FIFA_RANKS[name] ?? ((h * 7 + 1) % 80 + 20);
}

export function extractGroup(category: string): string {
  const m = category.match(/Group ([A-L])/i);
  return m ? `GROUP ${m[1].toUpperCase()}` : '';
}

export function shortDate(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

export function parseDateToTimestamp(dateStr: string): number {
  if (!dateStr) return 0;
  if (dateStr.includes('-')) {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])).getTime();
    }
  } else if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0])).getTime();
    }
  }
  const parsed = Date.parse(dateStr);
  return isNaN(parsed) ? 0 : parsed;
}

export function getDeterministicGameInfo(groundName: string, id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const absHash = Math.abs(hash);
  const stadium = groundName && groundName !== 'Chưa xác định' ? groundName : 'BC Place Stadium';
  const capacities = ['54,500', '68,014', '72,400', '45,500', '80,000'];
  const temps = ['18°C', '20°C', '22°C', '16°C', '24°C'];
  const conditions = ['Partly Cloudy', 'Sunny', 'Clear Sky', 'Light Rain', 'Mostly Sunny'];
  const broadcasters = ['FIFA+', 'VTV5 / VTV6', 'HTV Thể Thao', 'FPT Play'];
  return {
    stadium,
    capacity: capacities[absHash % capacities.length],
    temp: temps[absHash % temps.length],
    condition: conditions[(absHash >> 2) % conditions.length],
    broadcaster: broadcasters[absHash % broadcasters.length],
  };
}

export function parseCategory(category: string): { main: string; sub: string } {
  if (!category) return { main: 'FIFA WORLD CUP 2026™', sub: '' };
  if (category.toLowerCase().includes('fifa world cup 2026')) {
    const group = category.split('-')?.[1]?.trim() || 'GROUP STAGE';
    return { main: 'FIFA WORLD CUP 2026™', sub: group.toUpperCase() };
  }
  if (category.includes(' - ')) {
    const parts = category.split(' - ');
    return { main: parts[0].toUpperCase(), sub: parts[1].toUpperCase() };
  }
  return { main: category.toUpperCase(), sub: '' };
}

export function getTeamStyles(name: string): { glow: string; border: string; bg: string } {
  const n = name.toLowerCase();
  if (n.includes('switzerland') || n.includes('thụy sĩ')) return { glow: '0 0 20px rgba(239, 68, 68, 0.8)', border: '2px solid #e5c158', bg: '#ef4444' };
  if (n.includes('canada')) return { glow: '0 0 20px rgba(255, 255, 255, 0.65)', border: '2px solid #ffffff', bg: '#ffffff' };
  if (n.includes('argentina')) return { glow: '0 0 16px rgba(116, 189, 241, 0.65)', border: '2.5px solid #74bdf1', bg: '#74bdf1' };
  if (n.includes('brazil')) return { glow: '0 0 16px rgba(253, 224, 71, 0.65)', border: '2.5px solid #fde047', bg: '#fde047' };
  if (n.includes('france') || n.includes('pháp')) return { glow: '0 0 16px rgba(37, 99, 235, 0.65)', border: '2.5px solid #2563eb', bg: '#2563eb' };
  if (n.includes('portugal') || n.includes('bồ đào nha')) return { glow: '0 0 16px rgba(220, 38, 38, 0.65)', border: '2.5px solid #dc2626', bg: '#dc2626' };
  if (n.includes('spain') || n.includes('tây ban nha')) return { glow: '0 0 16px rgba(234, 179, 8, 0.65)', border: '2.5px solid #eab308', bg: '#eab308' };
  if (n.includes('germany') || n.includes('đức')) return { glow: '0 0 16px rgba(255, 255, 255, 0.45)', border: '2.5px solid #ffffff', bg: '#ffffff' };
  if (n.includes('netherlands') || n.includes('hà lan')) return { glow: '0 0 16px rgba(249, 115, 22, 0.65)', border: '2.5px solid #f97316', bg: '#f97316' };
  if (n.includes('england') || n.includes('anh')) return { glow: '0 0 16px rgba(255, 255, 255, 0.45)', border: '2.5px solid #ffffff', bg: '#ffffff' };
  if (n.includes('italy') || n.includes('ý')) return { glow: '0 0 16px rgba(29, 78, 216, 0.65)', border: '2.5px solid #1d4ed8', bg: '#1d4ed8' };

  let hashVal = 0;
  for (let i = 0; i < name.length; i++) {
    hashVal = name.charCodeAt(i) + ((hashVal << 5) - hashVal);
  }
  const colors = [
    { border: '#3b82f6', glow: 'rgba(59, 130, 246, 0.4)', bg: '#3b82f6' },
    { border: '#10b981', glow: 'rgba(16, 185, 129, 0.4)', bg: '#10b981' },
    { border: '#f59e0b', glow: 'rgba(245, 158, 11, 0.4)', bg: '#f59e0b' },
    { border: '#ec4899', glow: 'rgba(236, 72, 153, 0.4)', bg: '#ec4899' },
    { border: '#8b5cf6', glow: 'rgba(139, 92, 246, 0.4)', bg: '#8b5cf6' },
    { border: '#06b6d4', glow: 'rgba(6, 182, 212, 0.4)', bg: '#06b6d4' },
  ];
  const choice = colors[Math.abs(hashVal) % colors.length];
  return { glow: `0 0 10px ${choice.glow}`, border: `2.5px solid ${choice.border}`, bg: choice.bg };
}
