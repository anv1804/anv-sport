import React from 'react';

export interface FormAndH2HProps {
  team1Form: string[]; // ['W', 'D', 'L', 'W', 'W']
  team2Form: string[];
  h2hData: {
    total: number;
    team1Wins: number;
    draws: number;
    team2Wins: number;
    recentMatches: { date: string; score: string; winner: 1 | 2 | 0 }[];
  };
}

export function FormAndH2H({ team1Form, team2Form, h2hData }: FormAndH2HProps) {
  const renderFormBadge = (result: string, idx: number) => {
    let color = 'bg-slate-200 text-slate-600';
    if (result === 'W') color = 'bg-[#16A34A] text-white';
    if (result === 'D') color = 'bg-amber-400 text-white';
    if (result === 'L') color = 'bg-red-500 text-white';
    
    return (
      <span key={idx} className={`w-6 h-6 md:w-7 md:h-7 flex items-center justify-center rounded font-bold text-xs ${color}`}>
        {result}
      </span>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 font-client-ui">
      {/* Current Form */}
      <div className="bg-white p-5 rounded border border-[#e5e5e5] shadow-sm">
        <h3 className="text-[13px] font-black text-[#222222] uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-[#f1f1f1] pb-2.5">
          <div className="w-1.5 h-4 bg-[#16A34A]"></div>
          Phong Độ Gần Đây
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-700 text-xs uppercase tracking-wide">Đội nhà</span>
            <div className="flex gap-1">
              {team1Form.map((r, i) => renderFormBadge(r, i))}
            </div>
          </div>
          <div className="w-full h-px bg-slate-100"></div>
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-700 text-xs uppercase tracking-wide">Đội khách</span>
            <div className="flex gap-1">
              {team2Form.map((r, i) => renderFormBadge(r, i))}
            </div>
          </div>
        </div>
      </div>

      {/* H2H */}
      <div className="bg-white p-5 rounded border border-[#e5e5e5] shadow-sm">
        <h3 className="text-[13px] font-black text-[#222222] uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-[#f1f1f1] pb-2.5">
          <div className="w-1.5 h-4 bg-red-600"></div>
          Lịch Sử Đối Đầu
        </h3>
        
        {h2hData.total === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-slate-400">
            <span className="text-2xl mb-2">⚔️</span>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Hai đội chưa từng đối đầu trong lịch sử</p>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-5 text-[11px] font-black uppercase text-slate-500 bg-slate-50 p-2.5 rounded border border-slate-100">
              <div className="text-center">
                <div className="text-lg text-[#16A34A] font-black">{h2hData.team1Wins}</div>
                <div>Nhà thắng</div>
              </div>
              <div className="text-center">
                <div className="text-lg text-slate-400 font-black">{h2hData.draws}</div>
                <div>Hòa</div>
              </div>
              <div className="text-center">
                <div className="text-lg text-red-600 font-black">{h2hData.team2Wins}</div>
                <div>Khách thắng</div>
              </div>
            </div>

            <div className="space-y-1.5">
              {h2hData.recentMatches.map((m, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs py-1.5 border-b border-slate-100 last:border-0 font-medium">
                  <span className="text-slate-400">{m.date}</span>
                  <span className={`font-black px-2 py-0.5 rounded text-[11px] ${m.winner === 1 ? 'bg-[#16A34A]/10 text-[#16A34A]' : m.winner === 2 ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-slate-100 text-slate-600'}`}>
                    {m.score}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
