import { getWinProbability } from '@/lib/utils';
import { type MatchInfo } from './helpers';

interface Props { matchInfo: MatchInfo; }

export default function WinProbabilityBar({ matchInfo }: Props) {
  const prob = getWinProbability(matchInfo.id, matchInfo.team1.name, matchInfo.team2.name);
  return (
    <div className="bg-slate-950 border-b border-slate-800">
      <div className="flex items-center justify-between px-4 md:px-6 pt-2 pb-1">
        <span className="text-[9px] md:text-[10px] font-black text-emerald-400 tracking-wider">
          {prob.w1}% {matchInfo.team1.name.toUpperCase()} WIN
        </span>
        <span className="text-[9px] md:text-[10px] font-bold text-slate-400 tracking-wider">
          {prob.draw}% HÒA
        </span>
        <span className="text-[9px] md:text-[10px] font-black text-blue-400 tracking-wider">
          {prob.w2}% {matchInfo.team2.name.toUpperCase()} WIN
        </span>
      </div>
      <div className="flex h-1">
        <div className="h-full bg-emerald-500" style={{ width: `${prob.w1}%` }} />
        <div className="h-full bg-slate-700" style={{ width: `${prob.draw}%` }} />
        <div className="h-full bg-blue-500" style={{ width: `${prob.w2}%` }} />
      </div>
    </div>
  );
}
