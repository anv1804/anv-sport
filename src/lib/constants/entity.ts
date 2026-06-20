/**
 * entity.ts — Constants liên quan đến Entity (cầu thủ/VĐV)
 */
import { SelectOption } from '@/types/common';
import { StatField } from '@/types/entity';

export const FOOT_OPTIONS: SelectOption[] = [
  { value: 'Left',  label: 'Chân trái', icon: '🦶' },
  { value: 'Right', label: 'Chân phải', icon: '🦶' },
  { value: 'Both',  label: 'Hai chân',  icon: '⚡' },
];

export const ENTITY_TYPE_OPTIONS: SelectOption[] = [
  { value: 'FOOTBALL_PLAYER',  label: 'Cầu thủ Bóng đá' },
  { value: 'BILLIARDS_PLAYER', label: 'Cơ thủ Billiards' },
  { value: 'TENNIS_PLAYER',    label: 'VĐV Tennis' },
];

export const SPORT_SELECT_OPTIONS: SelectOption[] = [
  { value: 'Bóng đá',   label: 'Bóng đá' },
  { value: 'Billiards', label: 'Billiards' },
  { value: 'Tennis',    label: 'Tennis' },
  { value: 'E-Sports',  label: 'E-Sports' },
  { value: 'Khác',      label: 'Khác' },
];

/** Chỉ số thể thao cho cầu thủ bóng đá */
export const FOOTBALL_STAT_FIELDS: StatField[] = [
  { key: 'ATT', label: 'Tấn công',    color: 'bg-red-500',     desc: 'Khả năng ghi bàn và dứt điểm' },
  { key: 'TEC', label: 'Kỹ thuật',    color: 'bg-blue-500',    desc: 'Kiểm soát bóng, rê dắt, chuyền' },
  { key: 'TAC', label: 'Chiến thuật', color: 'bg-indigo-500',  desc: 'Đọc trận, di chuyển chiến lược' },
  { key: 'DEF', label: 'Phòng ngự',   color: 'bg-emerald-500', desc: 'Cướp bóng, phá bóng, truy pressing' },
  { key: 'CRE', label: 'Sáng tạo',    color: 'bg-purple-500',  desc: 'Tầm nhìn, đường chuyền key pass' },
  { key: 'STA', label: 'Thể lực',     color: 'bg-orange-500',  desc: 'Sức bền, tốc độ, khả năng sprint' },
  { key: 'PHY', label: 'Thể hình',    color: 'bg-teal-500',    desc: 'Sức mạnh thể chất, không chiến' },
];

/** Color mapping cho position groups */
export type PositionColorKey = 'yellow' | 'blue' | 'green' | 'red';

export const POSITION_COLOR_MAP: Record<PositionColorKey, { bg: string; text: string; border: string; dot: string }> = {
  yellow: { bg: 'bg-amber-100',   text: 'text-amber-800',   border: 'border-amber-300',   dot: 'bg-amber-500' },
  blue:   { bg: 'bg-blue-100',    text: 'text-blue-800',    border: 'border-blue-300',    dot: 'bg-blue-500'  },
  green:  { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-300', dot: 'bg-emerald-500' },
  red:    { bg: 'bg-rose-100',    text: 'text-rose-800',    border: 'border-rose-300',    dot: 'bg-rose-500'  },
};
