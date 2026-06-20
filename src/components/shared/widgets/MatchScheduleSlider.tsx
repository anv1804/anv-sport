"use client";

import React, { useRef } from "react";
import { ChevronLeft, ChevronRight, Trophy } from "lucide-react";
import { useMatchSchedule } from "@/hooks/useMatchSchedule";

export function MatchScheduleSlider() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { matches, isLoading, error } = useMatchSchedule();

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 350;
      scrollRef.current.scrollBy({ left: direction === "left" ? -scrollAmount : scrollAmount, behavior: "smooth" });
    }
  };

  return (
    <div className="w-full bg-[#f4f7f6] rounded-xl my-4 md:my-6 flex flex-col md:flex-row relative shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] border border-[#e2e8f0] group/slider">
      
      {/* Title Block - Premium Gradient matching brand color */}
      <div className="bg-gradient-to-br from-[#16A34A] to-[#15803D] md:w-[170px] flex-shrink-0 flex flex-row md:flex-col items-center justify-between md:justify-center px-4 py-3 md:p-4 z-10 shadow-[4px_0_12px_rgba(0,0,0,0.15)] relative overflow-hidden rounded-t-xl md:rounded-tr-none md:rounded-l-xl">
        {/* Decorative subtle element */}
        <div className="absolute top-[-20px] right-[-20px] opacity-10">
          <Trophy className="w-24 h-24 text-white" />
        </div>
        
        {/* Left/Top Content: Icon & Text */}
        <div className="flex flex-row md:flex-col items-center relative z-10">
          <div className="bg-white/20 p-2 md:p-3 rounded-full mb-0 md:mb-3 mr-3 md:mr-0 backdrop-blur-sm border border-white/10 flex-shrink-0">
            <Trophy className="w-5 h-5 md:w-6 md:h-6 text-yellow-400" />
          </div>
          <h3 className="text-white font-black text-[14px] md:text-[15px] md:text-center uppercase tracking-widest leading-tight drop-shadow-md">
            LỊCH THI ĐẤU
            <span className="text-yellow-400 text-[11px] opacity-90 tracking-normal font-medium block mt-0.5 md:mt-1">3 NGÀY TỚI</span>
          </h3>
        </div>
        
        {/* Right/Bottom Content: Button */}
        <a href="#" className="mt-0 md:mt-6 bg-white/20 hover:bg-white/30 transition-colors border border-white/30 text-white text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 md:px-4 md:py-2 rounded-full backdrop-blur-sm flex items-center space-x-1 group relative z-10 flex-shrink-0">
          <span>XEM TẤT CẢ</span>
          <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
        </a>
      </div>

      {/* Floating Navigation Buttons (Desktop) */}
      <button onClick={() => scroll('left')} className="absolute left-[170px] top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white flex items-center justify-center shadow-[0_4px_10px_rgba(0,0,0,0.15)] border border-gray-100 text-gray-500 hover:text-[#16A34A] hover:scale-110 hover:shadow-[0_6px_15px_rgba(0,0,0,0.2)] transition-all opacity-0 md:group-hover/slider:opacity-100 -translate-x-1/2 hidden md:flex">
        <ChevronLeft className="w-6 h-6 mr-1" />
      </button>
      <button onClick={() => scroll('right')} className="absolute right-[-43px] top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white flex items-center justify-center shadow-[0_4px_10px_rgba(0,0,0,0.15)] border border-gray-100 text-gray-500 hover:text-[#16A34A] hover:scale-110 hover:shadow-[0_6px_15px_rgba(0,0,0,0.2)] transition-all opacity-0 md:group-hover/slider:opacity-100 -translate-x-1/2 hidden md:flex">
        <ChevronRight className="w-6 h-6 ml-1" />
      </button>

      {/* Slider Area */}
      <div 
        ref={scrollRef}
        className="flex overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory flex-1 py-4 md:py-6 px-6 md:px-8 gap-4 md:gap-6 items-center scroll-pl-6 md:scroll-pl-8"
      >
        {isLoading && (
           <>
             {[1, 2, 3, 4, 5].map((skeleton) => (
               <div key={skeleton} className="flex-shrink-0 w-[240px] bg-white rounded-xl p-4 shadow-sm border border-gray-100 animate-pulse">
                 <div className="h-5 w-24 bg-gray-200 rounded-full mb-3"></div>
                 <div className="h-3 w-32 bg-gray-200 rounded mb-4"></div>
                 <div className="flex justify-between items-center mb-4">
                   <div className="flex items-center space-x-3">
                     <div className="h-6 w-6 bg-gray-200 rounded-full"></div>
                     <div className="h-4 w-20 bg-gray-200 rounded"></div>
                   </div>
                   <div className="h-5 w-5 bg-gray-200 rounded"></div>
                 </div>
                 <div className="flex justify-between items-center">
                   <div className="flex items-center space-x-3">
                     <div className="h-6 w-6 bg-gray-200 rounded-full"></div>
                     <div className="h-4 w-20 bg-gray-200 rounded"></div>
                   </div>
                   <div className="h-5 w-5 bg-gray-200 rounded"></div>
                 </div>
               </div>
             ))}
           </>
        )}

        {!isLoading && error && (
           <div className="w-full flex items-center justify-center p-4 text-[#757575] font-medium">
             Không thể tải dữ liệu: {error}
           </div>
        )}

        {!isLoading && !error && matches.length === 0 && (
           <div className="w-full flex items-center justify-center p-4 text-[#757575] font-medium">
             Không có trận đấu nào trong 3 ngày tới.
           </div>
        )}

        {!isLoading && !error && matches.map((match) => (
          <div key={match.id} className="flex-shrink-0 w-[250px] snap-start bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-1 hover:border-[#16A34A]/30 transition-all duration-300 cursor-pointer group">
            
            <div className="flex items-center justify-between mb-2">
               <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-[10px] font-bold tracking-wider uppercase group-hover:bg-[#16A34A]/10 group-hover:text-[#16A34A] transition-colors">
                 {match.date}
               </span>
               <span className="text-[11px] font-mono font-semibold text-gray-400">{match.time}</span>
            </div>

            <div className="text-[11px] text-gray-400 font-medium mb-3 truncate flex items-center">
               <span className="truncate max-w-[140px] text-gray-500" title={match.league}>{match.league}</span>
               {match.round && <span className="mx-1">•</span>}
               {match.round && <span className="truncate max-w-[80px]" title={match.round}>{match.round}</span>}
            </div>

            <div className="flex justify-between items-center mb-3">
               <div className="flex items-center space-x-3">
                 {match.flagA.startsWith('http') ? (
                   <div className="w-6 h-6 bg-cover bg-center bg-no-repeat rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.1)] flex-shrink-0 border border-gray-50" style={{ backgroundImage: `url(${match.flagA})` }}></div>
                 ) : (
                   <span className="text-[20px] leading-none flex-shrink-0 drop-shadow-sm">{match.flagA}</span>
                 )}
                 <span className="font-bold text-[14px] text-gray-800 truncate max-w-[120px] group-hover:text-black transition-colors" title={match.teamA}>{match.teamA}</span>
               </div>
               <span className="font-black text-[16px] text-gray-800 flex-shrink-0">{match.scoreA}</span>
            </div>

            <div className="flex justify-between items-center">
               <div className="flex items-center space-x-3">
                 {match.flagB.startsWith('http') ? (
                   <div className="w-6 h-6 bg-cover bg-center bg-no-repeat rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.1)] flex-shrink-0 border border-gray-50" style={{ backgroundImage: `url(${match.flagB})` }}></div>
                 ) : (
                   <span className="text-[20px] leading-none flex-shrink-0 drop-shadow-sm">{match.flagB}</span>
                 )}
                 <span className="font-bold text-[14px] text-gray-800 truncate max-w-[120px] group-hover:text-black transition-colors" title={match.teamB}>{match.teamB}</span>
               </div>
               <span className="font-black text-[16px] text-gray-800 flex-shrink-0">{match.scoreB}</span>
            </div>
            
          </div>
        ))}
      </div>
    </div>
  );
}
