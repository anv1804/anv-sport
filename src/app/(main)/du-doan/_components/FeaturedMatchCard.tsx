import Link from 'next/link';
import { Clock, MapPin, Sparkles, Users, CloudSun, Tv } from 'lucide-react';
import { getWinProbability } from '@/lib/utils';
import { getDeterministicGameInfo, parseCategory } from './helpers';

interface Props {
  match: any;
}

export default function FeaturedMatchCard({ match }: Props) {
  const { w1, draw, w2 } = getWinProbability(match.id, match.team1.name, match.team2.name);
  const info = getDeterministicGameInfo(match.ground, match.id);
  const categoryInfo = parseCategory(match.category);
  const isLive = match.status === 'Đang đấu';
  const isFinished = match.status === 'Kết thúc';

  // Tính số phút đã thi đấu — ưu tiên liveClock từ ESPN, fallback tự tính (tính cả ~15 phút nghỉ giữa hiệp)
  let elapsedLabel: string | null = match.liveClock ?? null;
  if (isLive && !elapsedLabel && match.matchDate && match.matchTime) {
    try {
      const [h, m] = match.matchTime.split(':').map(Number);
      const [yr, mo, dy] = match.matchDate.split('-').map(Number);
      const kickoff = new Date(yr, mo - 1, dy, h, m, 0, 0);
      const realElapsed = Math.floor((Date.now() - kickoff.getTime()) / 60000);
      let matchClock: number;
      if (realElapsed <= 45) {
        matchClock = realElapsed;
      } else if (realElapsed <= 60) {
        matchClock = 45;
      } else {
        matchClock = Math.min(45 + (realElapsed - 60), 90);
      }
      if (realElapsed >= 0 && realElapsed <= 130) elapsedLabel = `${matchClock}'`;
    } catch {}
  }

  return (
    <div className="relative rounded-[18px] overflow-hidden border border-[#1a3055] bg-[#0c1829] flex flex-col group shadow-[0_20px_60px_rgba(0,0,0,0.55)] transition-all duration-300 hover:border-[#3b82f6]/40 hover:shadow-[0_20px_60px_rgba(0,0,0,0.65),0_0_40px_rgba(59,130,246,0.18)]">

      <div className="absolute inset-0 bg-[url('/images/stadium_background.png')] bg-cover bg-[center_top] pointer-events-none transition-all duration-700 ease-out group-hover:scale-[1.04] group-hover:brightness-110"></div>
      <div className="absolute inset-0 pointer-events-none transition-all duration-750 ease-out group-hover:scale-[1.04]" style={{ background: 'linear-gradient(to right, #0c1829 0%, #0c1829 38%, rgba(12,24,41,0.82) 58%, rgba(12,24,41,0.08) 100%)' }}></div>
      <div className="absolute inset-0 bg-gradient-to-b from-[#0c1829]/70 via-transparent to-[#0c1829]/55 pointer-events-none"></div>

      <div className="relative z-10 p-4 md:p-6 flex flex-col gap-5">

        {/* TOP ROW */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-1.5 bg-[#0d1f3d]/80 backdrop-blur-sm text-[#6b9de8] font-bold px-3 py-1.5 rounded-full border border-[#1e3a6e]/60 text-[10px] tracking-widest uppercase">
              <span className="text-amber-400 text-[11px]">🏆</span>
              {categoryInfo.main}
            </div>
            <span className="text-[#00c8ff] text-[11px] font-black uppercase tracking-widest">
              • {categoryInfo.sub || 'GROUP B'}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="bg-[#0d1f3d]/70 backdrop-blur-sm border border-[#1e3a6e]/50 text-[10px] font-medium text-[#6b9de8] px-3.5 py-1.5 rounded-full flex items-center gap-1.5">
              <MapPin className="w-3 h-3" /> VANCOUVER, CANADA
            </div>
            <Link
              href={`/du-doan/${match.id}`}
              className="bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/50 text-emerald-300 font-bold px-4 py-1.5 rounded-full text-[10px] uppercase tracking-widest flex items-center gap-1.5 transition-all duration-200 active:scale-95"
            >
              <Sparkles className="w-3 h-3 text-emerald-400" /> XEM AI
            </Link>
          </div>
        </div>

        {/* BIG TITLE */}
        <div>
          <h2 className="text-white text-[32px] md:text-[44px] font-black tracking-tight leading-none uppercase">
            {categoryInfo.main}
          </h2>
          <div className="text-[28px] md:text-[36px] font-black leading-none text-[#00c8ff] tracking-wide mt-0.5">
            {categoryInfo.sub || 'GROUP B'}
          </div>
          <p className="text-[#4d6a90] text-[11px] mt-2.5 leading-relaxed max-w-[420px]">
            Phân tích dữ liệu chuyên sâu, dự đoán chính xác<br/>và cập nhật theo thời gian thực.
          </p>
        </div>

        {/* INNER MATCH CARD */}
        <div className="bg-[#081426]/88 backdrop-blur-sm rounded-2xl border border-[#1a3558]/70 overflow-hidden">

          {/* Teams + Time */}
          <div className="flex flex-row items-center justify-between w-full">

            {/* Home Team */}
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 flex-1 px-2.5 py-4 sm:px-6 sm:py-5 min-w-0 text-center sm:text-left">
              <img
                src={match.team1.logo}
                alt={match.team1.name}
                className="w-12 h-12 sm:w-[72px] sm:h-[72px] md:w-[82px] md:h-[82px] object-cover rounded-xl shadow-[0_4px_16px_rgba(0,0,0,0.6)] shrink-0"
              />
              <div className="min-w-0 flex flex-col items-center sm:items-start">
                <div className="font-black text-[11px] sm:text-xl md:text-2xl text-white tracking-tight leading-tight max-w-full sm:truncate">
                  {match.team1.name}
                </div>
                <div className="mt-1 text-[8px] sm:text-[9px] font-bold text-[#3d5c84] bg-[#0d1e38]/80 border border-[#1a3058]/70 px-1.5 py-0.5 sm:px-2.5 sm:py-0.5 rounded-full uppercase tracking-widest inline-block">
                  {match.sportType === 'bongda' ? 'UEFA' : 'LEAGUE'}
                </div>
              </div>
            </div>

            {/* Center */}
            <div className="flex flex-col items-center gap-1.5 px-2 py-4 sm:px-5 sm:py-5 border-x border-[#1a3558]/50 shrink-0 w-[85px] sm:w-auto">
              {isLive ? (
                <div className="flex items-center gap-1 bg-red-500/20 border border-red-500/50 text-red-400 rounded-full px-2 py-0.5 sm:px-3 sm:py-1 text-[7px] sm:text-[9px] font-bold uppercase tracking-widest whitespace-nowrap">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                  {elapsedLabel ? `LIVE ${elapsedLabel}` : 'LIVE'}
                </div>
              ) : (
                <div className="flex items-center gap-1 bg-[#0c1829]/80 border border-[#1e3a6e]/50 text-[#4d88c0] rounded-full px-2 py-0.5 sm:px-3 sm:py-1 text-[7px] sm:text-[9px] font-bold uppercase tracking-widest whitespace-nowrap">
                  <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> {isFinished ? 'KẾT THÚC' : 'KICK-OFF'}
                </div>
              )}
              {isLive || isFinished ? (
                <div className="flex items-center text-white font-black text-lg sm:text-3xl font-mono whitespace-nowrap">
                  <span>{match.score1 ?? 0}</span>
                  <span className="text-[#3b82f6] mx-1 sm:mx-2">:</span>
                  <span>{match.score2 ?? 0}</span>
                </div>
              ) : match.score1 !== null && match.score2 !== null ? (
                <div className="flex items-center text-white font-black text-lg sm:text-3xl font-mono whitespace-nowrap">
                  <span>{match.score1}</span>
                  <span className="text-[#3b82f6] mx-1 sm:mx-2">:</span>
                  <span>{match.score2}</span>
                </div>
              ) : (
                <div className="text-white font-black text-base sm:text-[40px] leading-none whitespace-nowrap font-mono tracking-tight">
                  {match.matchTime}
                </div>
              )}
              <div className="text-[8px] sm:text-[9px] font-bold text-[#3d5c84] uppercase tracking-widest whitespace-nowrap">
                {isLive && elapsedLabel
                  ? match.livePeriod || 'Đang thi đấu'
                  : match.matchDate}
              </div>
            </div>

            {/* Away Team */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-2 sm:gap-4 flex-1 px-2.5 py-4 sm:px-6 sm:py-5 min-w-0 text-center sm:text-right">
              <div className="order-2 sm:order-1 min-w-0 flex flex-col items-center sm:items-end">
                <div className="font-black text-[11px] sm:text-xl md:text-2xl text-white tracking-tight leading-tight max-w-full sm:truncate">
                  {match.team2.name}
                </div>
                <div className="mt-1 text-[8px] sm:text-[9px] font-bold text-[#3d5c84] bg-[#0d1e38]/80 border border-[#1a3058]/70 px-1.5 py-0.5 sm:px-2.5 sm:py-0.5 rounded-full uppercase tracking-widest inline-block">
                  {match.sportType === 'bongda' ? 'CONCACAF' : 'LEAGUE'}
                </div>
              </div>
              <img
                src={match.team2.logo}
                alt={match.team2.name}
                className="order-1 sm:order-2 w-12 h-12 sm:w-[72px] sm:h-[72px] md:w-[82px] md:h-[82px] object-cover rounded-xl shadow-[0_4px_16px_rgba(0,0,0,0.6)] shrink-0"
              />
            </div>
          </div>

          {/* Probability bar */}
          <div className="px-6 pb-4 pt-3 border-t border-[#1a3558]/40">
            <div className="w-full h-1.5 rounded-full overflow-hidden flex">
              <div className="h-full bg-emerald-450" style={{ width: `${w1}%` }}></div>
              <div className="h-full bg-[#1e3050]" style={{ width: `${draw}%` }}></div>
              <div className="h-full bg-[#3b82f6]" style={{ width: `${w2}%` }}></div>
            </div>
            <div className="flex justify-between text-[11px] font-bold mt-1.5">
              <span className="text-emerald-400">{w1}%</span>
              <span className="text-[#3d5c84]">HÒA {draw}%</span>
              <span className="text-[#60a5fa]">{w2}%</span>
            </div>
          </div>

          {/* Bottom metadata row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-0 px-4 py-2.5 sm:px-6 sm:py-4 border-t border-[#1a3558]/40 bg-[#061020]/30">
            <div className="flex items-center gap-2 sm:pr-5 sm:border-r border-[#1a3558]/30">
              <img src="/images/stadium_3d_icon.png" alt="Stadium" className="w-6 h-6 sm:w-8 sm:h-8 object-contain shrink-0" />
              <div>
                <div className="text-[10px] sm:text-[12px] font-semibold text-white leading-tight">{info.stadium}</div>
                <div className="text-[8px] sm:text-[10px] text-[#3d5c84] mt-0.5">Vancouver, Canada</div>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:px-5 sm:border-r border-[#1a3558]/30">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-[#4d88c0] shrink-0" />
              <div>
                <div className="text-[10px] sm:text-[12px] font-semibold text-white leading-tight">{info.capacity}</div>
                <div className="text-[8px] sm:text-[10px] text-[#3d5c84] mt-0.5">Capacity</div>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:px-5 sm:border-r border-[#1a3558]/30">
              <CloudSun className="w-4 h-4 sm:w-5 sm:h-5 text-[#f59e0b] shrink-0" />
              <div>
                <div className="text-[10px] sm:text-[12px] font-semibold text-white leading-tight">{info.temp}</div>
                <div className="text-[8px] sm:text-[10px] text-[#3d5c84] mt-0.5">{info.condition}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:pl-5">
              <Tv className="w-4 h-4 sm:w-5 sm:h-5 text-[#4d88c0] shrink-0" />
              <div>
                <div className="text-[10px] sm:text-[12px] font-semibold text-white leading-tight">{info.broadcaster}</div>
                <div className="text-[8px] sm:text-[10px] text-[#3d5c84] mt-0.5">Official Broadcaster</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
