import { isPlaceholderTeam } from '@/lib/utils';
import { FIFA_RANKS } from './constants';

export function extractGroup(category: string): string {
  const m = category.match(/Group ([A-L])/i);
  return m ? `GROUP ${m[1].toUpperCase()}` : '';
}

export function formatViDate(dateStr: string): string {
  const days = ['CHỦ NHẬT', 'THỨ HAI', 'THỨ BA', 'THỨ TƯ', 'THỨ NĂM', 'THỨ SÁU', 'THỨ BẢY'];
  const d = new Date(dateStr + 'T00:00:00');
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${days[d.getDay()]}, ${dd}/${mm}/${yyyy}`;
}

export function shortDate(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function hash(s: string) { return s.split('').reduce((a, c) => a + c.charCodeAt(0), 0); }

export function getProbabilities(t1: string, t2: string) {
  if (isPlaceholderTeam(t1) || isPlaceholderTeam(t2)) {
    return { win: 50, draw: 0, lose: 50 };
  }
  const h1 = hash(t1), h2 = hash(t2);
  const r1 = ((h1 * 37 + 13) % 55) + 15;
  const r2 = ((h2 * 29 + 7) % 30) + 10;
  const rd = ((h1 + h2) * 11 % 25) + 10;
  const total = r1 + r2 + rd;
  const win = Math.round((r1 / total) * 100);
  const draw = Math.round((rd / total) * 100);
  return { win, draw, lose: 100 - win - draw };
}

export function getAiPct(t1: string, t2: string) {
  return ((hash(t1 + t2) * 17 + 43) % 15) + 84;
}

export function getRank(name: string) {
  const h = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return FIFA_RANKS[name] ?? ((h * 7 + 1) % 80 + 20);
}
