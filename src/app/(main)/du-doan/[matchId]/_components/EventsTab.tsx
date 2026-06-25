import Image from 'next/image';
import { Info } from 'lucide-react';
import { type MatchInfo } from './helpers';

interface Props { matchInfo: MatchInfo; }

function eventStyle(type: string, detail: string, isHome: boolean) {
  const side = isHome
    ? 'border-l-4 border-t-slate-100 border-r-slate-100 border-b-slate-100'
    : 'border-r-4 border-t-slate-100 border-l-slate-100 border-b-slate-100';

  if (type === 'Goal') return `${side} ${isHome ? 'border-l-green-500' : 'border-r-green-500'}`;
  if (type === 'Card') {
    if (detail === 'Yellow Card') return `${side} ${isHome ? 'border-l-yellow-400' : 'border-r-yellow-400'}`;
    if (detail === 'Red Card') return `${side} ${isHome ? 'border-l-red-500' : 'border-r-red-500'}`;
  }
  if (type === 'subst') return `${side} ${isHome ? 'border-l-blue-500' : 'border-r-blue-500'}`;
  return 'border-slate-100';
}

export default function EventsTab({ matchInfo }: Props) {
  return (
    <div className="p-4 md:p-6 bg-white min-h-[300px] border-b border-slate-100">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-10 pb-4 border-b border-slate-100">
          <div className="w-12">
            <Image src={matchInfo.team1.logo} width={32} height={32} className="object-contain shadow-sm border border-slate-100 rounded-sm bg-white" alt="logo" />
          </div>
          <h3 className="text-[16px] font-bold text-slate-800 uppercase tracking-widest text-center flex-1">Diễn biến trận đấu</h3>
          <div className="w-12 flex justify-end">
            <Image src={matchInfo.team2.logo} width={32} height={32} className="object-contain shadow-sm border border-slate-100 rounded-sm bg-white" alt="logo" />
          </div>
        </div>

        {matchInfo.events && matchInfo.events.length > 0 ? (
          <div className="max-w-2xl mx-auto relative before:absolute before:inset-0 before:ml-[50%] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
            {matchInfo.events.map((event: any, idx: number) => {
              const isHome = event.team.name === matchInfo.team1.name;
              let title = event.detail;
              let subtitle = event.player.name;
              let extra = '';

              if (event.type === 'Goal') {
                title = event.detail === 'Penalty' ? 'Phạt đền (Penalty)' : event.detail === 'Own Goal' ? 'Đốt lưới nhà' : 'Bàn thắng';
                if (event.assist?.name) extra = `Kiến tạo: ${event.assist.name}`;
              } else if (event.type === 'Card') {
                title = event.detail === 'Yellow Card' ? 'Thẻ vàng' : 'Thẻ đỏ';
              } else if (event.type === 'subst') {
                title = 'Thay người';
                if (event.assist?.name) extra = `Ra sân: ${event.assist.name}`;
              }

              const borderClass = eventStyle(event.type, event.detail, isHome);

              return (
                <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active mb-6">
                  <div className={`flex items-center justify-end w-full md:w-1/2 ${isHome ? 'md:pr-8 pr-5' : 'md:pl-8 pl-5 flex-row-reverse md:flex-row'}`}>
                    <div className={`p-3 min-w-[180px] bg-white border shadow-sm rounded-xl flex flex-col ${borderClass} ${!isHome && 'md:items-start items-end'} ${isHome && 'items-end'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[13px] font-bold text-slate-800">{subtitle}</span>
                        {event.type === 'Goal' && <span className="text-[13px] drop-shadow-sm">⚽</span>}
                        {event.type === 'Card' && event.detail.includes('Yellow') && <div className="w-3 h-4 bg-[#facc15] rounded-[2px] shadow-sm" />}
                        {event.type === 'Card' && event.detail.includes('Red') && <div className="w-3 h-4 bg-[#ef4444] rounded-[2px] shadow-sm" />}
                        {event.type === 'subst' && <span className="text-[13px] text-blue-500">🔄</span>}
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[11px] font-semibold text-slate-500">{title}</span>
                        {extra && <span className="text-[10px] font-medium text-slate-400">{extra}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="w-7 h-7 absolute left-1/2 -translate-y-4 sm:translate-y-0 transform -translate-x-1/2 flex items-center justify-center">
                    <div className="w-7 h-7 rounded-full bg-white border border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-500 shadow-sm z-10">
                      {event.time.elapsed}'
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <Info className="w-10 h-10 mb-3 text-slate-300" />
            <p className="text-[13px] font-bold uppercase tracking-widest">Chưa có dữ liệu diễn biến thực tế</p>
          </div>
        )}
      </div>
    </div>
  );
}
