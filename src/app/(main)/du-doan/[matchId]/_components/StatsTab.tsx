"use client";

import Image from 'next/image';
import { useState } from 'react';
import { Info } from 'lucide-react';
import { type MatchInfo } from './helpers';

const STAT_LABELS: Record<string, string> = {
  'Ball Possession': 'Kiểm soát bóng', 'Total Shots': 'Tổng cú sút',
  'Shots on Goal': 'Sút trúng đích', 'Shots off Goal': 'Sút chệch mục tiêu',
  'Blocked Shots': 'Cú sút bị chặn', 'Corner Kicks': 'Phạt góc',
  'Offsides': 'Việt vị', 'Fouls': 'Phạm lỗi',
  'Yellow Cards': 'Thẻ vàng', 'Red Cards': 'Thẻ đỏ',
  'Total passes': 'Tổng đường chuyền', 'Passes accurate': 'Chuyền chính xác',
  'Passes %': 'Tỷ lệ chuyền chính xác', 'Saves': 'Pha cứu thua',
  'Shots': 'Cú sút', 'On Target %': 'Tỷ lệ sút trúng đích',
  'Accurate Crosses': 'Tạt bóng chính xác', 'Crosses': 'Quả tạt bóng',
  'Long Balls': 'Đường chuyền dài', 'Accurate Long Balls': 'Chuyền dài chính xác',
  'Effective Tackles': 'Tắc bóng thành công', 'Tackles': 'Pha tắc bóng',
  'Interceptions': 'Đánh chặn (Cắt bóng)', 'Effective Clearances': 'Phá bóng giải nguy thành công',
  'Clearances': 'Pha phá bóng giải nguy',
};

const MAIN_STATS = [
  'Ball Possession', 'Total Shots', 'Shots on Goal', 'Corner Kicks',
  'Offsides', 'Fouls', 'Yellow Cards', 'Red Cards', 'Total passes', 'Passes accurate', 'Passes %',
];

function formatStat(val: any, type: string): string {
  if (val === null || val === undefined) return '0';
  const str = String(val);
  if (str.includes('%')) return str;
  const isPct = type.includes('%') || type === 'Ball Possession';
  if (isPct) {
    const n = parseFloat(str);
    if (!isNaN(n)) return `${n <= 1 ? Math.round(n * 100) : Math.round(n)}%`;
  }
  return str;
}

function StatRow({ rawType, t1Stats, t2Stats }: { rawType: string; t1Stats: any[]; t2Stats: any[] }) {
  const label = STAT_LABELS[rawType] || rawType;
  const v1 = formatStat(t1Stats.find((s: any) => s.type === rawType)?.value, rawType);
  const v2 = formatStat(t2Stats.find((s: any) => s.type === rawType)?.value, rawType);
  const n1 = v1.includes('%') ? parseInt(v1) : (parseInt(v1) || 0);
  const n2 = v2.includes('%') ? parseInt(v2) : (parseInt(v2) || 0);
  const isPct = v1.includes('%') || v2.includes('%') || rawType === 'Ball Possession' || rawType.includes('%');
  const total = n1 + n2;
  const w1 = total === 0 ? 0 : isPct ? n1 : (n1 / total) * 100;
  const w2 = total === 0 ? 0 : isPct ? n2 : (n2 / total) * 100;

  return (
    <div className="flex flex-col mb-4">
      <div className="flex justify-between items-center mb-1.5">
        <span className={`font-black text-[13px] w-12 text-left ${n1 >= n2 ? 'text-slate-900' : 'text-slate-500'}`}>{v1}</span>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 text-center flex-1">{label}</span>
        <span className={`font-black text-[13px] w-12 text-right ${n2 >= n1 ? 'text-slate-900' : 'text-slate-500'}`}>{v2}</span>
      </div>
      <div className="flex w-full items-center gap-1.5">
        <div className="flex-1 flex justify-end h-1.5 bg-slate-100 rounded-l-full overflow-hidden">
          <div className={`h-full transition-all duration-1000 ${n1 >= n2 ? 'bg-blue-600' : 'bg-blue-300'}`} style={{ width: `${w1}%` }} />
        </div>
        <div className="flex-1 flex justify-start h-1.5 bg-slate-100 rounded-r-full overflow-hidden">
          <div className={`h-full transition-all duration-1000 ${n2 >= n1 ? 'bg-emerald-500' : 'bg-emerald-300'}`} style={{ width: `${w2}%` }} />
        </div>
      </div>
    </div>
  );
}

interface Props { matchInfo: MatchInfo; isLive: boolean; isFinished: boolean; }

export default function StatsTab({ matchInfo, isLive, isFinished }: Props) {
  const [showAll, setShowAll] = useState(false);
  const hasStats = (isLive || isFinished) && matchInfo.statistics?.length === 2;
  const t1Stats = matchInfo.statistics?.[0]?.statistics || [];
  const t2Stats = matchInfo.statistics?.[1]?.statistics || [];
  const allTypes: string[] = hasStats
    ? Array.from(new Set([...t1Stats.map((s: any) => s.type), ...t2Stats.map((s: any) => s.type)]))
    : [];
  const mainTypes = MAIN_STATS.filter(n => allTypes.includes(n));
  const extraTypes = allTypes.filter(n => !MAIN_STATS.includes(n));

  return (
    <div className="p-4 md:p-6 bg-white min-h-[300px] border-b border-slate-100">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
          <div className="w-12">
            <Image src={matchInfo.team1.logo} width={32} height={32} className="object-contain shadow-sm border border-slate-100 rounded-sm bg-white" alt="logo" />
          </div>
          <h3 className="text-[16px] font-bold text-slate-800 uppercase tracking-widest text-center flex-1">Thống kê trận đấu</h3>
          <div className="w-12 flex justify-end">
            <Image src={matchInfo.team2.logo} width={32} height={32} className="object-contain shadow-sm border border-slate-100 rounded-sm bg-white" alt="logo" />
          </div>
        </div>

        {hasStats ? (
          <div className="space-y-6 max-w-2xl mx-auto">
            {mainTypes.map(name => <StatRow key={name} rawType={name} t1Stats={t1Stats} t2Stats={t2Stats} />)}
            {showAll && extraTypes.map(name => <StatRow key={name} rawType={name} t1Stats={t1Stats} t2Stats={t2Stats} />)}
            {extraTypes.length > 0 && (
              <div className="pt-4 flex justify-center">
                <button
                  onClick={() => setShowAll(v => !v)}
                  className="px-6 py-2 border border-slate-200 hover:border-green-600 text-slate-600 hover:text-green-600 rounded-md font-bold text-xs uppercase tracking-wider transition-colors shadow-sm bg-white"
                >
                  {showAll ? 'Thu gọn số liệu' : `Xem thêm ${extraTypes.length} số liệu khác`}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <Info className="w-10 h-10 mb-3 text-slate-300" />
            <p className="text-[13px] font-bold uppercase tracking-widest">Chưa có dữ liệu thống kê thực tế</p>
          </div>
        )}
      </div>
    </div>
  );
}
