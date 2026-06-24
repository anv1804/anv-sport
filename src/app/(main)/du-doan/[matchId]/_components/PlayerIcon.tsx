import { getPlayerEventsSummary } from './helpers';

interface Props {
  player: any;
  events: any[];
}

export default function PlayerIcon({ player, events }: Props) {
  const avatarUrl = player.avatar || `https://i.pravatar.cc/150?u=${encodeURIComponent(player.name)}`;
  const s = getPlayerEventsSummary(player, events);

  return (
    <div className="flex flex-col items-center group relative z-10 w-[44px] sm:w-[56px]">
      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-200 overflow-hidden relative transition-transform group-hover:scale-110 group-hover:z-20 shadow-[0_2px_6px_rgba(0,0,0,0.3)] border-[1.5px] border-white/20">
        <img src={avatarUrl} alt={player.name} className="w-full h-full object-cover" />
        {s.subbedOut && <div className="absolute bottom-0 right-0 bg-red-600 rounded-full w-3.5 h-3.5 flex items-center justify-center border border-white text-[8px] text-white font-bold" title={`Thay ra phút ${s.subMinute}'`}>↓</div>}
        {s.subbedIn && <div className="absolute bottom-0 right-0 bg-green-600 rounded-full w-3.5 h-3.5 flex items-center justify-center border border-white text-[8px] text-white font-bold" title={`Vào sân phút ${s.subMinute}'`}>↑</div>}
        {s.goals > 0 && <div className="absolute top-0 left-0 bg-white rounded-full w-3.5 h-3.5 flex items-center justify-center border border-slate-300 text-[8px] shadow" title={`Ghi ${s.goals} bàn`}>⚽{s.goals > 1 ? s.goals : ''}</div>}
        {s.ownGoals > 0 && <div className="absolute top-0 left-0 bg-red-100 rounded-full w-3.5 h-3.5 flex items-center justify-center border border-red-300 text-[8px] shadow animate-pulse" title="Phản lưới nhà">⚽🔴</div>}
        {s.yellowCards > 0 && !s.secondYellow && <div className="absolute top-0 right-0 bg-yellow-400 rounded-[1px] w-2.5 h-3.5 border border-yellow-500 shadow" title="Thẻ vàng" />}
        {s.secondYellow && <div className="absolute top-0 right-0 bg-yellow-500 rounded-[1px] w-3.5 h-3.5 flex items-center justify-center border border-yellow-600 shadow" title="2 thẻ vàng">🟨🟥</div>}
        {s.redCard && !s.secondYellow && <div className="absolute top-0 right-0 bg-red-500 rounded-[1px] w-2.5 h-3.5 border border-red-600 shadow animate-pulse" title="Thẻ đỏ" />}
        {s.assists > 0 && <div className="absolute bottom-0 left-0 bg-blue-100 rounded-full w-3.5 h-3.5 flex items-center justify-center border border-blue-300 text-[8px] shadow" title={`Kiến tạo ${s.assists} bàn`}>👟</div>}
      </div>
      <div className="mt-1 text-[8px] sm:text-[9.5px] text-white/95 text-center truncate w-[160%] max-w-[80px] tracking-tight font-medium" style={{ textShadow: '0px 1px 2px rgba(0,0,0,0.9)' }}>
        <span className="font-normal opacity-80 mr-0.5">{player.number}</span> {player.name}
      </div>
    </div>
  );
}
