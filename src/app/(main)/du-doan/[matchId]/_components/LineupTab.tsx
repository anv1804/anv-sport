import { Info, Eye } from 'lucide-react';
import Link from 'next/link';
import PlayerListIndicators from './PlayerListIndicators';
import { type MatchInfo, getPlayerEventsSummary } from './helpers';

const POS_MAP: Record<string, string> = { G: 'GK', D: 'Hậu vệ', M: 'Tiền vệ', F: 'Tiền đạo' };

interface PlayerRowProps {
  playerObj: any;
  events: any[];
  isRightAligned: boolean;
  isSubstitute?: boolean;
}

function PlayerRow({ playerObj, events, isRightAligned, isSubstitute = false }: PlayerRowProps) {
  const summary = getPlayerEventsSummary(playerObj.player, events);
  const avatarSize = isSubstitute ? 'w-6 h-6' : 'w-7 h-7';
  const numberStyle = isSubstitute
    ? 'bg-slate-50 text-[10px] font-bold text-slate-500 border border-slate-200'
    : 'bg-slate-800 text-[11px] font-black text-white shadow-sm';
  const nameStyle = isSubstitute
    ? 'text-[13px] font-semibold text-slate-600'
    : 'text-[13px] font-bold text-slate-800';

  return (
    <div className={`flex items-center justify-between w-full py-1.5 border-b border-slate-50 last:border-0 ${isRightAligned ? 'flex-row-reverse' : ''}`}>
      <div className={`flex items-center gap-3 ${isRightAligned ? 'flex-row-reverse' : ''}`}>
        {playerObj.player.avatar ? (
          <div className={`${avatarSize} rounded-full overflow-hidden shrink-0 border border-slate-200 shadow-sm relative group/avatar`}>
            <img src={playerObj.player.avatar} alt={playerObj.player.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity">
              <span className="text-[8px] text-white font-black">{playerObj.player.number}</span>
            </div>
          </div>
        ) : (
          <div className={`${avatarSize} rounded-full flex items-center justify-center shrink-0 ${numberStyle}`}>
            {playerObj.player.number}
          </div>
        )}
        <div className={`flex flex-col ${isRightAligned ? 'items-end' : 'items-start'}`}>
          {playerObj.player.slug ? (
            <Link href={`/entity/${playerObj.player.slug}`} className={`${nameStyle} hover:text-[#16A34A] transition-colors hover:underline`}>
              {playerObj.player.name}
            </Link>
          ) : (
            <span className={nameStyle}>{playerObj.player.name}</span>
          )}
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            {POS_MAP[playerObj.player.pos] || playerObj.player.pos}
          </span>
        </div>
      </div>
      <PlayerListIndicators summary={summary} isAlignRight={isRightAligned} />
    </div>
  );
}

interface Props {
  matchInfo: MatchInfo;
  onOpenPitch: () => void;
}

export default function LineupTab({ matchInfo, onOpenPitch }: Props) {
  const hasLineups = matchInfo.lineups?.length === 2;

  return (
    <div className="p-4 md:p-6 bg-white min-h-[300px] border-b border-slate-100">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
          <div className="w-12">
            <img src={matchInfo.team1.logo} className="w-8 h-8 object-contain shadow-sm border border-slate-100 rounded-sm bg-white" alt="logo" />
          </div>
          <h3 className="text-[16px] font-bold text-slate-800 uppercase tracking-widest text-center flex-1">Đội hình ra sân</h3>
          <div className="w-12 flex justify-end">
            <img src={matchInfo.team2.logo} className="w-8 h-8 object-contain shadow-sm border border-slate-100 rounded-sm bg-white" alt="logo" />
          </div>
        </div>

        <div className="flex md:hidden justify-center mb-8">
          <button
            onClick={onOpenPitch}
            className="flex items-center gap-2.5 bg-gradient-to-b from-[#3B823D] to-[#2C632D] hover:from-[#439645] hover:to-[#337234] text-white px-8 py-3 rounded-full font-bold text-[13px] uppercase tracking-widest shadow-lg shadow-green-600/30 transition-all border border-green-500/30 active:scale-95 group"
          >
            <Eye className="w-5 h-5 text-green-200 group-hover:text-white transition-colors" />
            Xem sơ đồ chiến thuật
          </button>
        </div>

        {hasLineups ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 max-w-3xl mx-auto relative">
            <div className="hidden md:flex absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
              <button
                onClick={onOpenPitch}
                className="w-16 h-16 bg-[#3B823D] hover:bg-[#439645] rounded-full flex items-center justify-center text-white shadow-xl shadow-green-600/40 border-4 border-white hover:scale-110 active:scale-95 transition-all group"
                title="Xem sa bàn chiến thuật"
              >
                <div className="w-6 h-8 border-2 border-white/90 rounded-[2px] relative flex flex-col justify-center items-center">
                  <div className="absolute top-1/2 w-full h-[2px] bg-white/90 -translate-y-1/2" />
                  <div className="w-2 h-2 rounded-full border-[2px] border-white/90 z-10 bg-[#3B823D] group-hover:bg-[#439645] transition-colors" />
                </div>
              </button>
            </div>

            {matchInfo.lineups!.map((lineup: any, i: number) => {
              const isRight = i === 1;
              const events = matchInfo.events || [];
              const sortedSubs = [...lineup.substitutes].sort((a, b) => {
                const sa = getPlayerEventsSummary(a.player, events);
                const sb = getPlayerEventsSummary(b.player, events);
                if (sa.subbedIn && !sb.subbedIn) return -1;
                if (!sa.subbedIn && sb.subbedIn) return 1;
                if (sa.subbedIn && sb.subbedIn) return (sa.subMinute || 0) - (sb.subMinute || 0);
                return 0;
              });

              return (
                <div key={i} className="flex flex-col h-full">
                  <div className={`flex items-center w-full gap-3 mb-6 ${isRight ? 'justify-start flex-row-reverse' : 'justify-start'}`}>
                    <div className={`flex flex-col ${isRight ? 'items-end' : 'items-start'}`}>
                      <h3 className="text-[15px] font-black text-slate-800 uppercase tracking-widest">{lineup.team.name}</h3>
                      <span className="text-[12px] font-bold text-blue-600">{lineup.formation}</span>
                    </div>
                  </div>

                  <div className="mb-8">
                    <h4 className={`text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3 border-b border-slate-100 pb-2 ${isRight ? 'text-right' : 'text-left'}`}>Đội Hình Xuất Phát</h4>
                    <div className="space-y-1">
                      {lineup.startXI.map((p: any, idx: number) => (
                        <PlayerRow key={idx} playerObj={p} events={events} isRightAligned={isRight} />
                      ))}
                    </div>
                  </div>

                  <div className="mb-8">
                    <h4 className={`text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3 border-b border-slate-100 pb-2 ${isRight ? 'text-right' : 'text-left'}`}>Dự bị</h4>
                    <div className="space-y-1">
                      {sortedSubs.map((p: any, idx: number) => (
                        <PlayerRow key={idx} playerObj={p} events={events} isRightAligned={isRight} isSubstitute />
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-4 mt-auto">
                    <h4 className={`text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 ${isRight ? 'text-right' : 'text-left'}`}>Huấn Luyện Viên Trưởng</h4>
                    <div className={`flex items-center w-full ${isRight ? 'justify-start flex-row-reverse' : 'justify-start'}`}>
                      <span className="text-[14px] font-black text-slate-800">{lineup.coach.name}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <Info className="w-10 h-10 mb-3 text-slate-300" />
            <p className="text-[13px] font-bold uppercase tracking-widest">Chưa có dữ liệu đội hình thực tế</p>
          </div>
        )}

        {hasLineups && (
          <div className="mt-12 p-5 bg-slate-900 text-white rounded-xl shadow-inner max-w-3xl mx-auto border border-slate-850">
            <h4 className="text-[12px] font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
              <div className="w-1.5 h-3 bg-green-500 rounded-sm" />
              Chú thích ký hiệu đội hình
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-[13px] text-slate-300">
              <div className="space-y-3">
                {[['⚽', 'Bàn thắng'], ['⚽🔴', 'Bàn phản lưới nhà']].map(([icon, label]) => (
                  <div key={label} className="flex items-center gap-2.5"><span className="text-base shrink-0 w-6 text-center">{icon}</span><span>{label}</span></div>
                ))}
                <div className="flex items-center gap-2.5"><span className="w-2.5 h-3.5 bg-yellow-400 border border-yellow-500 rounded-[1px] inline-block shadow-sm shrink-0" /><span className="ml-1.5">Thẻ vàng</span></div>
                <div className="flex items-center gap-2.5"><span className="w-2.5 h-3.5 bg-red-500 border border-red-600 rounded-[1px] inline-block shadow-sm shrink-0" /><span className="ml-1.5">Thẻ đỏ</span></div>
                <div className="flex items-center gap-2.5"><span className="text-xs shrink-0 w-6 text-center">🟨🟥</span><span>2 thẻ vàng</span></div>
              </div>
              <div className="space-y-3">
                {[
                  ['↑', 'bg-green-600/20 text-green-500', 'Thay người vào sân'],
                  ['↓', 'bg-red-600/20 text-red-500', 'Thay người ra sân'],
                ].map(([icon, cls, label]) => (
                  <div key={label} className="flex items-center gap-2.5">
                    <span className={`w-5 h-5 rounded-full ${cls} flex items-center justify-center font-bold text-xs shrink-0`}>{icon}</span>
                    <span>{label}</span>
                  </div>
                ))}
                <div className="flex items-center gap-2.5"><span className="text-base shrink-0 w-6 text-center">👟</span><span>Kiến tạo</span></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
