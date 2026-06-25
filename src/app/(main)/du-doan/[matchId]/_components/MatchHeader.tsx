import Link from 'next/link';
import { ArrowLeft, Calendar } from 'lucide-react';
import { type MatchInfo, parseMatchDate } from './helpers';

interface Props {
  matchInfo: MatchInfo;
  isFinished: boolean;
  isLive: boolean;
}

export default function MatchHeader({ matchInfo, isFinished, isLive }: Props) {
  const statusLabel = isFinished
    ? 'Kết thúc'
    : isLive
      ? (matchInfo.livePeriod && matchInfo.liveClock
          ? `${matchInfo.livePeriod} - ${matchInfo.liveClock}`
          : (matchInfo.status || 'Đang đấu'))
      : 'Chưa đá';

  const statusClass = isFinished
    ? 'bg-slate-200 text-slate-600'
    : isLive
      ? 'bg-red-100 text-red-700 animate-pulse font-extrabold'
      : 'bg-green-100 text-green-700';

  return (
    <>
      <div className="px-4 md:px-6 py-3 md:py-4 flex items-center justify-between text-slate-500 text-[13px] border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-2">
          <Link href="/du-doan" className="hover:text-green-600 transition-colors flex items-center gap-1.5 font-bold uppercase tracking-widest text-[11px]">
            <ArrowLeft className="w-4 h-4" /> Quay lại
          </Link>
          <span className="text-slate-300">|</span>
          <div className="flex items-center gap-1.5">
            <span className="font-semibold">{matchInfo.category}</span>
            {matchInfo.round && (
              <>
                <span className="text-slate-300">·</span>
                <span className="text-slate-600 font-bold bg-slate-200/60 px-2 py-0.5 rounded text-[11px] uppercase tracking-wider">{matchInfo.round}</span>
              </>
            )}
          </div>
        </div>
        <span className={`font-bold px-2 py-0.5 rounded text-[11px] uppercase tracking-wider ${statusClass}`}>
          {statusLabel}
        </span>
      </div>

      <div className="bg-white border-b border-slate-100 px-4 md:px-6 py-2 md:py-3 flex flex-wrap items-center justify-center gap-4 md:gap-8 text-[12px] font-bold text-slate-500 uppercase tracking-widest shadow-sm relative z-10">
        <span className="flex items-center gap-1.5 text-slate-700">
          <Calendar className="w-4 h-4 text-green-600" />
          {parseMatchDate(matchInfo.matchDate).toLocaleDateString('vi-VN', {
            weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric',
          })}
        </span>
        <span className="flex items-center gap-1.5 text-slate-700">
          <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
          {matchInfo.matchTime}
        </span>
        {matchInfo.ground && matchInfo.ground !== 'Chưa xác định' && (
          <span className="flex items-center gap-1.5 text-slate-700">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
            🏟 {matchInfo.ground}
          </span>
        )}
      </div>
    </>
  );
}
