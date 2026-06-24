import { type PlayerEventSummary } from './helpers';

interface Props {
  summary: PlayerEventSummary;
  isAlignRight?: boolean;
}

export default function PlayerListIndicators({ summary: s, isAlignRight }: Props) {
  return (
    <div className={`flex items-center gap-1.5 ${isAlignRight ? 'flex-row-reverse' : ''}`}>
      {s.goals > 0 && (
        <span className="text-[11px]" title={`Ghi bàn: ${s.goals}`}>⚽{s.goals > 1 ? s.goals : ''}</span>
      )}
      {s.ownGoals > 0 && (
        <span className="text-[11px] text-red-500 animate-pulse" title="Phản lưới nhà">⚽🔴</span>
      )}
      {s.yellowCards > 0 && !s.secondYellow && (
        <span className="w-2 h-3 bg-yellow-400 border border-yellow-500 rounded-[1px] inline-block shadow-sm" title="Thẻ vàng" />
      )}
      {s.secondYellow && (
        <span className="text-[10px] inline-block" title="2 thẻ vàng">🟨🟥</span>
      )}
      {s.redCard && !s.secondYellow && (
        <span className="w-2 h-3 bg-red-500 border border-red-600 rounded-[1px] inline-block shadow-sm animate-pulse" title="Thẻ đỏ" />
      )}
      {s.assists > 0 && (
        <span className="text-[11px]" title={`Kiến tạo: ${s.assists}`}>👟{s.assists > 1 ? s.assists : ''}</span>
      )}
      {s.subbedOut && (
        <span className="text-[10px] text-red-500 font-black inline-flex items-center gap-0.5" title={`Thay ra phút ${s.subMinute}'`}>
          {isAlignRight ? `${s.subMinute}' ↓` : `↓ ${s.subMinute}'`}
        </span>
      )}
      {s.subbedIn && (
        <span className="text-[10px] text-green-600 font-black inline-flex items-center gap-0.5" title={`Vào sân phút ${s.subMinute}'`}>
          {isAlignRight ? `${s.subMinute}' ↑` : `↑ ${s.subMinute}'`}
        </span>
      )}
    </div>
  );
}
