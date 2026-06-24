import { getRank } from '../../_components/helpers';
import { type MatchInfo, isNeutralVenue } from './helpers';

interface Props {
  matchInfo: MatchInfo;
  isFinished: boolean;
  isLive: boolean;
}

export default function ScoreBoard({ matchInfo, isFinished, isLive }: Props) {
  const neutral = isNeutralVenue(matchInfo);

  return (
    <div className="px-4 md:px-6 py-6 md:py-8 grid grid-cols-3 items-center border-b border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white gap-2 relative overflow-hidden">
      <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-green-500/50 to-transparent" />

      <TeamColumn name={matchInfo.team1.name} logo={matchInfo.team1.logo} color="emerald" label={neutral ? undefined : 'Đội nhà'} />

      <div className="flex flex-col items-center justify-center min-w-0">
        {matchInfo.score1 !== null && matchInfo.score1 !== undefined ? (
          <div className="flex flex-col items-center justify-center w-full">
            <div className="flex items-center justify-center gap-3 md:gap-8">
              <span className={`text-3xl md:text-5xl font-black tracking-tight ${isFinished && (matchInfo.score1 ?? 0) > (matchInfo.score2 ?? 0) ? 'text-green-400' : 'text-white'}`}>{matchInfo.score1}</span>
              <span className="text-xl md:text-3xl text-slate-600 font-light">-</span>
              <span className={`text-3xl md:text-5xl font-black tracking-tight ${isFinished && (matchInfo.score2 ?? 0) > (matchInfo.score1 ?? 0) ? 'text-green-400' : 'text-white'}`}>{matchInfo.score2}</span>
            </div>
            {isLive && matchInfo.liveClock && (
              <div className="mt-2.5 text-[8px] md:text-[11px] font-black text-red-500 bg-red-950/40 border border-red-500/20 rounded-full px-2 py-0.5 md:px-3 md:py-1 flex items-center gap-1 shadow-sm animate-pulse tracking-wide uppercase">
                <span className="w-1 h-1 rounded-full bg-red-500 animate-ping shrink-0" />
                <span className="truncate">{matchInfo.livePeriod} {matchInfo.liveClock}</span>
              </div>
            )}
            {matchInfo.penScore1 != null && matchInfo.penScore2 != null && (
              <div className="mt-1.5 text-[8px] md:text-[10px] font-bold text-red-400 bg-red-950/30 px-2 py-0.5 rounded border border-red-900/30 uppercase tracking-wider text-center">
                Luân lưu: {matchInfo.penScore1}-{matchInfo.penScore2}
              </div>
            )}
          </div>
        ) : (
          <div className="text-2xl md:text-4xl text-slate-600 font-black px-4 py-2 italic text-center">VS</div>
        )}
      </div>

      <TeamColumn name={matchInfo.team2.name} logo={matchInfo.team2.logo} color="blue" label={neutral ? undefined : 'Đội khách'} />
    </div>
  );
}

function TeamColumn({ name, logo, color, label }: { name: string; logo: string; color: 'emerald' | 'blue'; label?: string }) {
  const rankColor = color === 'emerald' ? 'text-emerald-400' : 'text-blue-400';
  return (
    <div className="flex flex-col items-center text-center min-w-0">
      <div className="w-14 h-14 md:w-20 md:h-20 flex items-center justify-center mb-2 filter drop-shadow-[0_2px_8px_rgba(255,255,255,0.1)]">
        <img src={logo} alt={name} className="w-full h-full object-contain" />
      </div>
      <h2 className="text-[13px] md:text-xl font-black text-white mb-1 leading-tight truncate w-full" title={name}>{name}</h2>
      <span className={`${rankColor} text-[9px] md:text-[10px] font-black uppercase tracking-widest`}>
        RANK #{getRank(name)}
      </span>
      {label && (
        <span className="mt-1 text-slate-400 text-[8px] md:text-[10px] font-bold uppercase tracking-widest bg-slate-800/85 px-2.5 py-0.5 rounded-full border border-slate-700/50">{label}</span>
      )}
    </div>
  );
}
