import React from 'react';

export function LineupVisualizer({ 
  team1Formation, team2Formation, team1Name, team2Name 
}: { 
  team1Formation: string, team2Formation: string, team1Name: string, team2Name: string 
}) {
  return (
    <div className="bg-white p-5 rounded border border-[#e5e5e5] mb-6 shadow-sm font-client-ui">
      <h3 className="text-[13px] font-black text-[#222222] uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-[#f1f1f1] pb-2.5">
        <div className="w-1.5 h-4 bg-[#16A34A]"></div>
        Đội Hình Dự Kiến
      </h3>
      
      <div className="flex flex-col md:flex-row justify-between gap-5">
        
        {/* Team 1 Pitch */}
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
            
            {/* Dots representation for Team 1 (Bottom to Top) */}
            <div className="absolute inset-0 flex flex-col justify-end py-4 px-2">
               <div className="flex justify-center mb-6">
                 <div className="w-4 h-4 bg-[#16A34A] border border-white rounded-full shadow-lg"></div>
               </div>
               <div className="flex justify-between px-4 mb-6">
                 {[1,2,3,4].map(i => (
                   <div key={i} className="w-4 h-4 bg-[#16A34A] border border-white rounded-full shadow-lg"></div>
                 ))}
               </div>
               <div className="flex justify-around px-8 mb-6">
                 {[1,2,3].map(i => (
                   <div key={i} className="w-4 h-4 bg-[#16A34A] border border-white rounded-full shadow-lg"></div>
                 ))}
               </div>
               <div className="flex justify-around px-6 mb-2">
                 {[1,2,3].map(i => (
                   <div key={i} className="w-4 h-4 bg-[#16A34A] border border-white rounded-full shadow-lg"></div>
                 ))}
               </div>
            </div>
          </div>
        </div>

        {/* Team 2 Pitch */}
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
            
            {/* Dots representation for Team 2 (Top to Bottom) */}
            <div className="absolute inset-0 flex flex-col justify-start py-4 px-2">
               <div className="flex justify-center mb-6">
                 <div className="w-4 h-4 bg-red-600 border border-white rounded-full shadow-lg"></div>
               </div>
               <div className="flex justify-between px-4 mb-6">
                 {[1,2,3,4].map(i => (
                   <div key={i} className="w-4 h-4 bg-red-600 border border-white rounded-full shadow-lg"></div>
                 ))}
               </div>
               <div className="flex justify-around px-12 mb-6">
                 {[1,2].map(i => (
                   <div key={i} className="w-4 h-4 bg-red-600 border border-white rounded-full shadow-lg"></div>
                 ))}
               </div>
               <div className="flex justify-around px-4 mb-2">
                 {[1,2,3,4].map(i => (
                   <div key={i} className="w-4 h-4 bg-red-600 border border-white rounded-full shadow-lg"></div>
                 ))}
               </div>
            </div>
          </div>
        </div>
      </div>
      
      <p className="text-center text-[10px] text-slate-400 mt-4 italic">* Sơ đồ mang tính chất minh họa dựa trên phân tích đội hình dự đoán từ dữ liệu AI</p>
    </div>
  );
}
