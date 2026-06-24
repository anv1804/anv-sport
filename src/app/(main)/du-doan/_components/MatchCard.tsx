import Link from 'next/link';
import { Clock, MapPin, Trophy, Tv2 } from 'lucide-react';
import { getWinProbability, isPlaceholderTeam } from '@/lib/utils';
import { extractGroup, shortDate, getRank, GROUP_COLORS } from './helpers';

interface Props {
  match: any;
}

export default function MatchCard({ match }: Props) {
  const isFinished = match.status === 'Kết thúc';
  const isLive = match.status === 'Đang đá';
  const matchTimeStr = match.matchTime || '00:00';

  const { w1, draw, w2 } = getWinProbability(match.id, match.team1.name, match.team2.name);
  const group = extractGroup(match.category || '');
  const groupColor = group ? (GROUP_COLORS[group] ?? '#64748b') : '#64748b';
  const rank1 = getRank(match.team1.name);
  const rank2 = getRank(match.team2.name);
  const aiPct = Math.max(w1, draw, w2) === w1 ? w1 : Math.max(w1, draw, w2) === w2 ? w2 : draw;

  return (
    <Link
      href={`/du-doan/${match.id}`}
      className="block bg-white border border-slate-200/50 rounded-xl overflow-hidden shadow-sm transition-[border-color,box-shadow] duration-200 hover:border-emerald-500/20 hover:shadow-[0_6px_28px_rgba(0,0,0,0.35)]"
    >
      {/* META ROW */}
      <div className="flex items-center justify-between px-3 py-1.5 sm:px-4 sm:py-2 bg-slate-50/50 border-b border-slate-100 gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {group && (
            <div
              style={{ background: `${groupColor}18`, border: `1px solid ${groupColor}40`, color: groupColor }}
              className="inline-flex items-center gap-1 rounded px-2 py-0.5 shrink-0"
            >
              <Trophy className="w-2.5 h-2.5" style={{ color: groupColor }} />
              <span className="text-[9px] font-black uppercase tracking-wider">{group}</span>
            </div>
          )}
          {match.ground && match.ground !== 'Chưa xác định' && (
            <div className="flex items-center gap-1 min-w-0">
              <MapPin className="w-2.5 h-2.5 text-slate-400 shrink-0" />
              <span className="text-[10px] text-slate-600 font-medium truncate">{match.ground}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {isLive ? (
            <div className="flex items-center gap-1 bg-red-50 border border-red-200 rounded-full px-2 py-0.5 text-[9px] font-extrabold text-red-500">
              <span className="w-1 h-1 rounded-full bg-red-500 animate-pulse" />
              LIVE
            </div>
          ) : (
            <div className="flex items-center gap-1 text-[10px] text-slate-500 font-semibold">
              <Clock className="w-2.5 h-2.5" />
              <span>{matchTimeStr} • {shortDate(match.matchDate)}</span>
            </div>
          )}
        </div>
      </div>

      {/* BODY */}
      <div className="flex items-center p-3 sm:p-4 gap-2 sm:gap-3.5">

        {/* HOME */}
        <div className="flex flex-col sm:flex-row items-center gap-1.5 sm:gap-3.5 flex-1 min-w-0 text-center sm:text-left">
          <img
            src={match.team1.logo}
            alt={match.team1.name}
            className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 object-contain rounded-lg border border-slate-100 bg-slate-50 shrink-0"
          />
          <div className="min-w-0 flex flex-col items-center sm:items-start">
            <div className="font-black text-[11px] sm:text-sm md:text-base text-slate-900 leading-tight max-w-full truncate">
              {match.team1.name}
            </div>
            <div className="mt-0.5 text-[8px] sm:text-[9px] font-bold text-slate-500 uppercase tracking-wider">
              {isPlaceholderTeam(match.team1.name) ? 'RANK: —' : `RANK #${rank1}`}
            </div>
          </div>
        </div>

        {/* CENTER */}
        <div className="flex flex-col items-center justify-center w-[75px] sm:w-[95px] md:w-[110px] shrink-0 gap-0.5">
          {isFinished || isLive ? (
            <>
              <span className="text-[7px] sm:text-[8px] font-bold text-slate-400 tracking-wider uppercase">
                {isFinished ? 'KẾT THÚC' : '⚡ LIVE'}
              </span>
              <div className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 leading-none">
                {match.score1 ?? 0}<span className="text-slate-300 mx-0.5">–</span>{match.score2 ?? 0}
              </div>
            </>
          ) : (
            <>
              <span className="text-[7px] sm:text-[8px] font-bold text-slate-400 tracking-wider uppercase">
                KICK-OFF
              </span>
              <div className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 leading-none">
                {matchTimeStr}
              </div>
              <div className="text-[8px] sm:text-[9px] text-slate-500 font-semibold">
                {shortDate(match.matchDate)}
              </div>
              <div className="mt-1 text-[8px] font-bold text-slate-600 px-2 py-0.5 rounded-full border border-slate-100 bg-slate-50 tracking-wider">
                VS
              </div>
            </>
          )}
        </div>

        {/* AWAY */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-1.5 sm:gap-3.5 flex-1 min-w-0 text-center sm:text-right">
          <div className="min-w-0 flex flex-col items-center sm:items-end order-2 sm:order-1 flex-1">
            <div className="font-black text-[11px] sm:text-sm md:text-base text-slate-900 leading-tight max-w-full truncate">
              {match.team2.name}
            </div>
            <div className="mt-0.5 text-[8px] sm:text-[9px] font-bold text-slate-500 uppercase tracking-wider">
              {isPlaceholderTeam(match.team2.name) ? 'RANK: —' : `RANK #${rank2}`}
            </div>
          </div>
          <img
            src={match.team2.logo}
            alt={match.team2.name}
            className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 object-contain rounded-lg border border-slate-100 bg-slate-50 shrink-0 order-1 sm:order-2"
          />
        </div>

        {/* AI BADGE */}
        <div className="flex-shrink-0 w-[56px] sm:w-[72px] flex flex-col items-center gap-1 pl-2 sm:pl-3 border-l border-slate-100">
          <div className="relative">
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full border border-emerald-200 bg-emerald-50/30 flex items-center justify-center">
              <Tv2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500" />
            </div>
            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border border-white flex items-center justify-center">
              <span className="text-[4px] text-white font-black">✦</span>
            </div>
          </div>
          <div className="text-[7px] sm:text-[8px] text-slate-500 font-bold tracking-wider text-center leading-tight">
            <span className="text-emerald-500">AI</span> DỰ ĐOÁN
          </div>
          <div className="text-sm sm:text-base md:text-lg font-black text-emerald-500 leading-none">
            {isPlaceholderTeam(match.team1.name) || isPlaceholderTeam(match.team2.name) ? '—' : `${aiPct}%`}
          </div>
        </div>
      </div>

      {/* PROBABILITY BAR */}
      <div className="border-t border-slate-100 bg-slate-50/20">
        <div className="flex items-center justify-between px-3 py-1 sm:px-4 sm:py-1.5">
          <span className="text-[8px] sm:text-[9px] font-black text-emerald-600 tracking-wider">
            {w1}% {match.team1.name.toUpperCase()} WIN
          </span>
          <span className="text-[8px] sm:text-[9px] font-bold text-slate-400 tracking-wider">
            {draw}% HÒA
          </span>
          <span className="text-[8px] sm:text-[9px] font-black text-blue-600 tracking-wider">
            {w2}% {match.team2.name.toUpperCase()} WIN
          </span>
        </div>
        <div className="flex h-1 bg-slate-100">
          <div className="h-full bg-emerald-500" style={{ width: `${w1}%` }} />
          <div className="h-full bg-slate-200" style={{ width: `${draw}%` }} />
          <div className="h-full bg-blue-500" style={{ width: `${w2}%` }} />
        </div>
      </div>

    </Link>
  );
}
