import PlayerIcon from './PlayerIcon';

interface Props {
  team1: any;
  team2: any;
  formationsData: any;
  events: any[];
}

function getPlayersWithPositions(teamInfo: any, isTopTeam: boolean, formationsData: any) {
  if (!teamInfo?.startXI?.length || !teamInfo.formation) return [];

  const dbCoords = formationsData?.[teamInfo.formation];
  if (dbCoords && dbCoords.length === teamInfo.startXI.length) {
    return teamInfo.startXI.map((p: any, i: number) => {
      const c = dbCoords[i];
      return {
        player: p.player,
        x: isTopTeam ? (100 - c.x) : c.x,
        y: isTopTeam ? (c.y / 2) : (100 - (c.y / 2)),
      };
    });
  }

  const parts = teamInfo.formation.split('-').map(Number);
  const N = parts.length;
  const result = [{ player: teamInfo.startXI[0].player, x: 50, y: isTopTeam ? 4 : 96 }];
  let idx = 1;
  for (let i = 0; i < N; i++) {
    const count = parts[i];
    const yHalf = N > 1 ? 25 + (60 / (N - 1)) * i : 50;
    const absY = isTopTeam ? (yHalf / 2) : (100 - (yHalf / 2));
    for (let j = 0; j < count; j++) {
      const rawX = (100 / (count + 1)) * (j + 1);
      if (teamInfo.startXI[idx]) {
        result.push({ player: teamInfo.startXI[idx].player, x: isTopTeam ? (100 - rawX) : rawX, y: absY });
      }
      idx++;
    }
  }
  return result;
}

export default function PitchLineup({ team1, team2, formationsData, events }: Props) {
  const t1Players = getPlayersWithPositions(team1, false, formationsData);
  const t2Players = getPlayersWithPositions(team2, true, formationsData);

  return (
    <div
      className="relative w-full mx-auto bg-[#4B6B4A] rounded-lg sm:rounded-xl overflow-hidden shadow-2xl border border-slate-800 font-sans flex-shrink-0"
      style={{
        aspectRatio: '2/3',
        maxHeight: '75vh',
        maxWidth: 'calc(75vh * 0.666)',
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 10%, rgba(255,255,255,0.025) 10%, rgba(255,255,255,0.025) 20%)',
      }}
    >
      <div className="absolute top-0 left-0 w-full p-2 sm:p-3 flex items-center justify-between z-20 pointer-events-none">
        <div className="flex items-center gap-2">
          <img src={team2?.team?.logo} className="w-6 h-6 sm:w-8 sm:h-8 rounded-sm shadow-sm" alt="logo" />
          <span className="text-white font-bold text-[11px] sm:text-[13px]">{team2?.team?.name}</span>
        </div>
        <div className="bg-black/30 px-2 py-1 rounded text-white/80 font-bold text-[10px] sm:text-[11px]">{team2?.formation}</div>
      </div>

      <div className="absolute bottom-0 left-0 w-full p-2 sm:p-3 flex items-center justify-between z-20 pointer-events-none">
        <div className="flex items-center gap-2">
          <img src={team1?.team?.logo} className="w-5 h-5 sm:w-7 sm:h-7 rounded-sm shadow-sm" alt="logo" />
          <span className="text-white font-bold text-[10px] sm:text-[12px]">{team1?.team?.name}</span>
        </div>
        <div className="bg-black/30 px-2 py-1 rounded text-white/80 font-bold text-[9px] sm:text-[10px]">{team1?.formation}</div>
      </div>

      <div className="absolute inset-0 pointer-events-none border-[1.5px] border-white/20 m-2 sm:m-4">
        <div className="absolute top-1/2 left-0 w-full h-[1.5px] bg-white/20 -translate-y-1/2" />
        <div className="absolute top-1/2 left-1/2 w-[60px] h-[60px] sm:w-[90px] sm:h-[90px] rounded-full border-[1.5px] border-white/20 -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute top-1/2 left-1/2 w-1.5 h-1.5 bg-white/30 rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute top-0 left-1/2 w-[140px] sm:w-[180px] h-[45px] sm:h-[60px] border-[1.5px] border-t-0 border-white/20 -translate-x-1/2" />
        <div className="absolute top-0 left-1/2 w-[60px] sm:w-[80px] h-[15px] sm:h-[20px] border-[1.5px] border-t-0 border-white/20 -translate-x-1/2" />
        <div className="absolute top-[45px] sm:top-[60px] left-1/2 w-[40px] sm:w-[60px] h-[20px] sm:h-[30px] border-[1.5px] border-white/20 rounded-b-full border-t-0 -translate-x-1/2" />
        <div className="absolute bottom-0 left-1/2 w-[140px] sm:w-[180px] h-[45px] sm:h-[60px] border-[1.5px] border-b-0 border-white/20 -translate-x-1/2" />
        <div className="absolute bottom-0 left-1/2 w-[60px] sm:w-[80px] h-[15px] sm:h-[20px] border-[1.5px] border-b-0 border-white/20 -translate-x-1/2" />
        <div className="absolute bottom-[45px] sm:bottom-[60px] left-1/2 w-[40px] sm:w-[60px] h-[20px] sm:h-[30px] border-[1.5px] border-white/20 rounded-t-full border-b-0 -translate-x-1/2" />
      </div>

      <div className="absolute inset-0 m-2 sm:m-4">
        {t2Players.map((p: any, i: number) => (
          <div key={`t2-${i}`} className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-500" style={{ left: `${p.x}%`, top: `${p.y}%` }}>
            <PlayerIcon player={p.player} events={events} />
          </div>
        ))}
        {t1Players.map((p: any, i: number) => (
          <div key={`t1-${i}`} className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-500" style={{ left: `${p.x}%`, top: `${p.y}%` }}>
            <PlayerIcon player={p.player} events={events} />
          </div>
        ))}
      </div>
    </div>
  );
}
