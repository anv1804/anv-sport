import React from 'react';

function parseFormation(formation: string): number[] {
  if (!formation) return [4, 4, 2];
  // Extract only numbers and hyphens (e.g. "4-3-3 Atk" -> "4-3-3", "4-2-3-1" -> "4-2-3-1")
  const clean = formation.replace(/[^0-9-]/g, '');
  const parts = clean.split('-').map(Number);
  const isValid = parts.length >= 2 && parts.every(num => !isNaN(num) && num > 0);
  return isValid ? parts : [4, 4, 2];
}

export function LineupVisualizer({ 
  team1Formation, team2Formation, team1Name, team2Name 
}: { 
  team1Formation: string, team2Formation: string, team1Name: string, team2Name: string 
}) {
  const f1Rows = parseFormation(team1Formation);
  const f2Rows = parseFormation(team2Formation);

  return (
    <div className="bg-white p-5 rounded border border-[#e5e5e5] mb-6 shadow-sm font-client-ui">
      <h3 className="text-[13px] font-black text-[#222222] uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-[#f1f1f1] pb-2.5">
        <div className="w-1.5 h-4 bg-[#16A34A]"></div>
        Đội Hình Dự Kiến
      </h3>
      
      <div className="flex flex-col md:flex-row justify-between gap-5">
        
        {/* Team 1 Pitch (Bottom to Top) */}
        <div className="flex-1 bg-[#fcfcfc] p-4 rounded border border-slate-200 text-center">
          <h4 className="font-black text-[#16A34A] text-sm mb-1 uppercase tracking-wide">{team1Name}</h4>
          <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-black rounded mb-4 uppercase tracking-wider">
            Sơ đồ: {team1Formation}
          </span>
          <div className="aspect-[4/5] bg-[#14532d] rounded relative overflow-hidden border-2 border-[#166534] mx-auto max-w-[280px]">
            {/* Field lines */}
            <div className="absolute top-1/2 left-0 w-full h-px bg-white/30"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 border border-white/30 rounded-full"></div>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-28 h-12 border border-white/30 border-b-0 rounded-t"></div>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-12 border border-white/30 border-t-0 rounded-b"></div>
            
            {/* Goalkeeper (Bottom) */}
            <div 
              className="absolute w-4 h-4 bg-[#16A34A] border border-white rounded-full shadow-lg -translate-x-1/2 -translate-y-1/2 z-10"
              style={{ left: '50%', top: '92%' }}
            ></div>
            
            {/* Players based on formation */}
            {(() => {
              const N = f1Rows.length;
              const yRangeStart = 76; // defenders Y
              const yRangeEnd = 16;   // forwards Y
              
              return f1Rows.flatMap((count, rowIndex) => {
                const y = N > 1 
                  ? yRangeStart - (rowIndex / (N - 1)) * (yRangeStart - yRangeEnd) 
                  : 46;
                  
                return Array.from({ length: count }).map((_, playerIndex) => {
                  const x = count > 1 
                    ? 14 + (playerIndex / (count - 1)) * 72 
                    : 50;
                    
                  return (
                    <div 
                      key={`t1-${rowIndex}-${playerIndex}`}
                      className="absolute w-4 h-4 bg-[#16A34A] border border-white rounded-full shadow-lg -translate-x-1/2 -translate-y-1/2 z-10"
                      style={{ left: `${x}%`, top: `${y}%` }}
                    ></div>
                  );
                });
              });
            })()}
          </div>
        </div>

        {/* Team 2 Pitch (Top to Bottom) */}
        <div className="flex-1 bg-[#fcfcfc] p-4 rounded border border-slate-200 text-center">
          <h4 className="font-black text-red-600 text-sm mb-1 uppercase tracking-wide">{team2Name}</h4>
          <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-black rounded mb-4 uppercase tracking-wider">
            Sơ đồ: {team2Formation}
          </span>
          <div className="aspect-[4/5] bg-[#14532d] rounded relative overflow-hidden border-2 border-[#166534] mx-auto max-w-[280px]">
            {/* Field lines */}
            <div className="absolute top-1/2 left-0 w-full h-px bg-white/30"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 border border-white/30 rounded-full"></div>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-28 h-12 border border-white/30 border-b-0 rounded-t"></div>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-12 border border-white/30 border-t-0 rounded-b"></div>
            
            {/* Goalkeeper (Top) */}
            <div 
              className="absolute w-4 h-4 bg-red-600 border border-white rounded-full shadow-lg -translate-x-1/2 -translate-y-1/2 z-10"
              style={{ left: '50%', top: '8%' }}
            ></div>
            
            {/* Players based on formation */}
            {(() => {
              const N = f2Rows.length;
              const yRangeStart = 24; // defenders Y
              const yRangeEnd = 84;   // forwards Y
              
              return f2Rows.flatMap((count, rowIndex) => {
                const y = N > 1 
                  ? yRangeStart + (rowIndex / (N - 1)) * (yRangeEnd - yRangeStart) 
                  : 54;
                  
                return Array.from({ length: count }).map((_, playerIndex) => {
                  const x = count > 1 
                    ? 14 + (playerIndex / (count - 1)) * 72 
                    : 50;
                    
                  return (
                    <div 
                      key={`t2-${rowIndex}-${playerIndex}`}
                      className="absolute w-4 h-4 bg-red-600 border border-white rounded-full shadow-lg -translate-x-1/2 -translate-y-1/2 z-10"
                      style={{ left: `${x}%`, top: `${y}%` }}
                    ></div>
                  );
                });
              });
            })()}
          </div>
        </div>
      </div>
      
      <p className="text-center text-[10px] text-slate-400 mt-4 italic">* Sơ đồ mang tính chất minh họa dựa trên phân tích đội hình dự đoán từ dữ liệu AI</p>
    </div>
  );
}
