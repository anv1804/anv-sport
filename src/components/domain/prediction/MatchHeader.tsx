import React from 'react';

export interface MatchHeaderProps {
  team1: { name: string; logo: string };
  team2: { name: string; logo: string };
  matchTime: string;
  tournament: string;
  probabilities: { team1: number; draw: number; team2: number };
}

export function MatchHeader({ team1, team2, matchTime, tournament, probabilities }: MatchHeaderProps) {
  return (
    <div className="bg-[#1a1a1a] rounded border border-[#333333] p-6 text-white shadow-sm relative overflow-hidden mb-6 font-client-ui">
      {/* Background Subtle Gradient Overlay */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#16A34A]/5 rounded-full mix-blend-multiply filter blur-3xl"></div>
      
      <div className="relative z-10">
        <div className="text-center mb-6">
          <span className="inline-block px-3 py-1 bg-[#16A34A]/25 text-[#16A34A] rounded text-[11px] font-black uppercase tracking-wider border border-[#16A34A]/30">
            {tournament}
          </span>
          <p className="text-slate-400 text-xs mt-3 font-semibold tracking-wide">{matchTime}</p>
        </div>

        <div className="flex items-center justify-between md:justify-center gap-4 md:gap-16 mb-8">
          <div className="flex flex-col items-center flex-1 md:flex-none">
            <img src={team1.logo} alt={team1.name} className="w-16 h-16 md:w-20 md:h-20 object-contain mb-3 drop-shadow-md" />
            <h2 className="font-black text-sm md:text-lg text-center leading-tight tracking-tight max-w-[140px]">{team1.name}</h2>
          </div>
          
          <div className="flex flex-col items-center shrink-0">
            <div className="text-2xl md:text-4xl font-black text-slate-700 italic">VS</div>
          </div>
          
          <div className="flex flex-col items-center flex-1 md:flex-none">
            <img src={team2.logo} alt={team2.name} className="w-16 h-16 md:w-20 md:h-20 object-contain mb-3 drop-shadow-md" />
            <h2 className="font-black text-sm md:text-lg text-center leading-tight tracking-tight max-w-[140px]">{team2.name}</h2>
          </div>
        </div>

        {/* Win Probability Bar - Sleek Design */}
        <div className="max-w-xl mx-auto">
          <div className="flex justify-between text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2 px-1">
            <span className="text-[#16A34A]">{team1.name} {probabilities.team1}%</span>
            <span>Hòa {probabilities.draw}%</span>
            <span className="text-red-500">{team2.name} {probabilities.team2}%</span>
          </div>
          <div className="w-full h-2.5 bg-slate-800 rounded overflow-hidden flex border border-[#333]">
            <div style={{ width: `${probabilities.team1}%` }} className="h-full bg-[#16A34A]" title={`${team1.name}: ${probabilities.team1}%`}></div>
            <div style={{ width: `${probabilities.draw}%` }} className="h-full bg-slate-500" title={`Hòa: ${probabilities.draw}%`}></div>
            <div style={{ width: `${probabilities.team2}%` }} className="h-full bg-red-600" title={`${team2.name}: ${probabilities.team2}%`}></div>
          </div>
        </div>
      </div>
    </div>
  );
}
