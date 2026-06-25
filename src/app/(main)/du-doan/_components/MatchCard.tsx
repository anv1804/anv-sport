import Link from 'next/link';
import { Clock, MapPin, Trophy, Tv2 } from 'lucide-react';
import { getWinProbability, getLiveProbability, isPlaceholderTeam } from '@/lib/utils';
import { extractGroup, shortDate, getRank, GROUP_COLORS } from './helpers';
import LiveOddsBar from './LiveOddsBar';
import LiveOddsBadge from './LiveOddsBadge';

interface Props {
  match: any;
}

export default function MatchCard({ match }: Props) {
  const isFinished = match.status === 'Kết thúc';
  const isLive = match.status === 'Đang đấu';
  const matchTimeStr = match.matchTime || '00:00';

  // Tính số phút đã thi đấu — ưu tiên liveClock từ ESPN, fallback tự tính
  let elapsedLabel: string | null = match.liveClock ?? null;
  let minutesElapsed = 0;
  if (isLive) {
    // Parse phút từ liveClock (ESPN trả "73'" hoặc "73:00")
    if (elapsedLabel) {
      const parsed = parseInt(elapsedLabel.replace(/[^0-9]/g, ''));
      if (!isNaN(parsed)) minutesElapsed = parsed;
    } else if (match.matchDate && match.matchTime) {
      try {
        const [h, m] = match.matchTime.split(':').map(Number);
        const [yr, mo, dy] = match.matchDate.split('-').map(Number);
        const kickoff = new Date(yr, mo - 1, dy, h, m, 0, 0);
        const realElapsed = Math.floor((Date.now() - kickoff.getTime()) / 60000);
        let matchClock: number;
        if (realElapsed <= 45) matchClock = realElapsed;
        else if (realElapsed <= 60) matchClock = 45;
        else matchClock = Math.min(45 + (realElapsed - 60), 90);
        if (realElapsed >= 0 && realElapsed <= 130) {
          elapsedLabel = `${matchClock}'`;
          minutesElapsed = matchClock;
        }
      } catch {}
    }
  }

  // Tính xác suất: pre-match baseline
  const preMatch = getWinProbability(match.id, match.team1.name, match.team2.name);
  // Nếu đang live và có tỉ số thực, tính lại live odds
  let { w1, draw, w2 } = preMatch;
  if (isLive && minutesElapsed > 0 && match.score1 !== null && match.score2 !== null) {
    const live = getLiveProbability(
      Number(match.score1), Number(match.score2),
      minutesElapsed,
      preMatch.w1, preMatch.draw, preMatch.w2
    );
    w1 = live.w1; draw = live.draw; w2 = live.w2;
  }
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
              {elapsedLabel ? `LIVE ${elapsedLabel}` : 'LIVE'}
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
                {isFinished ? 'KẾT THÚC' : elapsedLabel ? `⚡ ${elapsedLabel}` : '⚡ LIVE'}
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

        {/* AI / LIVE ODDS BADGE — ẩn khi kết thúc */}
        {!isFinished && (
          isLive && !isPlaceholderTeam(match.team1.name) && !isPlaceholderTeam(match.team2.name) ? (
            <LiveOddsBadge
              matchId={match.id}
              team1Name={match.team1.name}
              team2Name={match.team2.name}
              score1={Number(match.score1 ?? 0)}
              score2={Number(match.score2 ?? 0)}
              liveClock={match.liveClock}
              matchDate={match.matchDate}
              matchTime={match.matchTime}
            />
          ) : (
            <div className="flex-shrink-0 w-[56px] sm:w-[72px] flex flex-col items-center gap-1 pl-2 sm:pl-3 border-l border-slate-100">
              <div className="relative">
                <div className={`w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center ${isLive ? 'border border-red-200 bg-red-50/40' : 'border border-emerald-200 bg-emerald-50/30'}`}>
                  <Tv2 className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isLive ? 'text-red-500' : 'text-emerald-500'}`} />
                </div>
                <div className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border border-white flex items-center justify-center ${isLive ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`}>
                  <span className="text-[4px] text-white font-black">✶</span>
                </div>
              </div>
              <div className="text-[7px] sm:text-[8px] font-bold tracking-wider text-center leading-tight">
                {isLive
                  ? <><span className="text-red-500">LIVE</span><span className="text-slate-500"> ODDS</span></>
                  : <><span className="text-emerald-500">AI</span><span className="text-slate-500"> DỰ ĐOÁN</span></>
                }
              </div>
              <div className={`text-sm sm:text-base md:text-lg font-black leading-none ${isLive ? 'text-red-500' : 'text-emerald-500'}`}>
                {isPlaceholderTeam(match.team1.name) || isPlaceholderTeam(match.team2.name) ? '—' : `${aiPct}%`}
              </div>
            </div>
          )
        )}
      </div>

      {/* PROBABILITY BAR — chỉ hiển thị khi chưa kết thúc */}
      {!isFinished && (
        isLive ? (
          <LiveOddsBar
            matchId={match.id}
            team1Name={match.team1.name}
            team2Name={match.team2.name}
            score1={Number(match.score1 ?? 0)}
            score2={Number(match.score2 ?? 0)}
            liveClock={match.liveClock}
            matchDate={match.matchDate}
            matchTime={match.matchTime}
            compact
          />
        ) : (
          <div className="border-t border-slate-100 bg-slate-50/20">
            <div className="flex items-center justify-between px-3 py-1 sm:px-4 sm:py-1.5">
              <span className="text-[8px] sm:text-[9px] font-black tracking-wider text-emerald-600">
                {w1}% {match.team1.name.toUpperCase()} WIN
              </span>
              <span className="text-[8px] sm:text-[9px] font-bold text-slate-400 tracking-wider">
                {draw}% HÒA
              </span>
              <span className="text-[8px] sm:text-[9px] font-black tracking-wider text-blue-600">
                {w2}% {match.team2.name.toUpperCase()} WIN
              </span>
            </div>
            <div className="flex h-1 bg-slate-100">
              <div className="h-full bg-emerald-500" style={{ width: `${w1}%` }} />
              <div className="h-full bg-slate-200" style={{ width: `${draw}%` }} />
              <div className="h-full bg-blue-500" style={{ width: `${w2}%` }} />
            </div>
          </div>
        )
      )}


    </Link>
  );
}
