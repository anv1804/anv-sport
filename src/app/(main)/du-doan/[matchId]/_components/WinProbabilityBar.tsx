import { getWinProbability } from '@/lib/utils';
import { type MatchInfo } from './helpers';
import LiveOddsBar from '@/app/(main)/du-doan/_components/LiveOddsBar';

interface Props { matchInfo: MatchInfo; }

export default function WinProbabilityBar({ matchInfo }: Props) {
  const isLive     = matchInfo.status === 'Đang đấu';
  const isFinished = matchInfo.status === 'Kết thúc';

  // Không hiển thị tỉ lệ cho trận đã kết thúc
  if (isFinished) return null;

  // Khi đang live: dùng LiveOddsBar (client component) tự cập nhật mỗi 30s
  if (isLive) {
    return (
      <LiveOddsBar
        matchId={matchInfo.id}
        team1Name={matchInfo.team1.name}
        team2Name={matchInfo.team2.name}
        score1={Number(matchInfo.score1 ?? 0)}
        score2={Number(matchInfo.score2 ?? 0)}
        liveClock={matchInfo.liveClock as string | null}
        matchDate={matchInfo.matchDate}
        matchTime={matchInfo.matchTime}
        compact={false}
      />
    );
  }

  // Chưa đá: hiển thị tỉ lệ pre-match tĩnh
  const { w1, draw, w2 } = getWinProbability(matchInfo.id, matchInfo.team1.name, matchInfo.team2.name);

  return (
    <div className="bg-slate-950 border-b border-slate-800">
      <div className="flex items-center justify-between px-4 md:px-6 pt-2 pb-1">
        <span className="text-[9px] md:text-[10px] font-black tracking-wider text-emerald-400">
          {w1}% {matchInfo.team1.name.toUpperCase()} WIN
        </span>
        <span className="text-[9px] md:text-[10px] font-bold text-slate-400 tracking-wider">
          {draw}% HÒA
        </span>
        <span className="text-[9px] md:text-[10px] font-black text-blue-400 tracking-wider">
          {w2}% {matchInfo.team2.name.toUpperCase()} WIN
        </span>
      </div>
      <div className="flex h-1">
        <div className="h-full bg-emerald-500 transition-all duration-700" style={{ width: `${w1}%` }} />
        <div className="h-full bg-slate-700 transition-all duration-700" style={{ width: `${draw}%` }} />
        <div className="h-full bg-blue-500 transition-all duration-700" style={{ width: `${w2}%` }} />
      </div>
    </div>
  );
}
