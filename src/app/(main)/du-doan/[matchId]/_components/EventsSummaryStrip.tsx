import { type ReactNode } from 'react';
import { type MatchInfo } from './helpers';

function buildTeamEvents(matchInfo: MatchInfo, teamName: string) {
  const goals: Record<string, string[]> = {};
  const redCards: Record<string, string[]> = {};

  if (matchInfo.events?.length) {
    for (const evt of matchInfo.events) {
      if (!evt.team || evt.team.name !== teamName) continue;
      const name = evt.player?.name || 'Cầu thủ';
      const time = evt.time?.elapsed ? `${evt.time.elapsed}'` : '';
      if (evt.type === 'Goal') {
        (goals[name] ??= []);
        const suffix = evt.detail === 'Penalty' ? ' (P)' : evt.detail === 'Own Goal' ? ' (OG)' : '';
        if (time) goals[name].push(`${time}${suffix}`);
      } else if (evt.type === 'Card' && evt.detail?.toLowerCase().includes('red')) {
        (redCards[name] ??= []);
        if (time) redCards[name].push(time);
      }
    }
  } else {
    const raw = teamName === matchInfo.team1.name ? matchInfo.goals?.home : matchInfo.goals?.away;
    if (raw) {
      raw.replace(/NaN'/g, "90+'").split(';').map((s: string) => s.trim()).filter(Boolean).forEach((part: string) => {
        const idx = part.lastIndexOf(' ');
        if (idx !== -1) {
          (goals[part.substring(0, idx).trim()] ??= []).push(part.substring(idx + 1).trim());
        } else {
          goals[part] ??= [];
        }
      });
    }
  }
  return { goals, redCards };
}

function TeamEvents({ matchInfo, teamName, isAlignRight }: { matchInfo: MatchInfo; teamName: string; isAlignRight: boolean }) {
  const { goals, redCards } = buildTeamEvents(matchInfo, teamName);
  const items: ReactNode[] = [];

  for (const [player, minutes] of Object.entries(goals)) {
    items.push(
      <span key={`g-${player}`} className="flex items-center gap-1.5 text-[12px] leading-tight text-slate-300">
        {!isAlignRight && <span className="text-[10px]">⚽</span>}
        <span className="font-bold">{player}</span>
        <span className="text-slate-400 font-semibold">{minutes.join(', ')}</span>
        {isAlignRight && <span className="text-[10px]">⚽</span>}
      </span>
    );
  }

  for (const [player, minutes] of Object.entries(redCards)) {
    items.push(
      <span key={`r-${player}`} className="flex items-center gap-1.5 text-[12px] leading-tight text-slate-300">
        {!isAlignRight && <span className="text-[10px] inline-block w-2 h-2.5 bg-red-500 rounded-[1px] border border-red-600 flex-shrink-0" />}
        <span className="font-bold text-red-400">{player}</span>
        <span className="text-red-400 font-semibold">{minutes.join(', ')}</span>
        {isAlignRight && <span className="text-[10px] inline-block w-2 h-2.5 bg-red-500 rounded-[1px] border border-red-600 flex-shrink-0" />}
      </span>
    );
  }

  if (!items.length) return null;
  return <div className={`flex flex-col gap-1.5 ${isAlignRight ? 'items-end' : 'items-start'}`}>{items}</div>;
}

interface Props { matchInfo: MatchInfo; }

export default function EventsSummaryStrip({ matchInfo }: Props) {
  return (
    <div className="px-8 py-4 flex items-start justify-between bg-slate-50 border-b border-slate-100">
      <div className="flex-1 text-left">
        <TeamEvents matchInfo={matchInfo} teamName={matchInfo.team1.name} isAlignRight={false} />
      </div>
      <div className="mx-6 self-center"><div className="w-1.5 h-1.5 rounded-full bg-slate-300" /></div>
      <div className="flex-1 text-right">
        <TeamEvents matchInfo={matchInfo} teamName={matchInfo.team2.name} isAlignRight={true} />
      </div>
    </div>
  );
}
