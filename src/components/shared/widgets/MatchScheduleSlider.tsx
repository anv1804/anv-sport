"use client";

import React, { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Trophy } from "lucide-react";
import { useMatchSchedule } from "@/hooks/useMatchSchedule";
import Link from "next/link";

export function MatchScheduleSlider() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { matches, isLoading, error } = useMatchSchedule();
  const [activeIndex, setActiveIndex] = useState(0);

  // Only display World Cup or FIFA matches in this dedicated World Cup slider
  const worldCupMatches = matches.filter(
    (match) => 
      match.league?.toLowerCase().includes("world cup") || 
      match.league?.toLowerCase().includes("fifa")
  );

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 350;
      scrollRef.current.scrollBy({ left: direction === "left" ? -scrollAmount : scrollAmount, behavior: "smooth" });
    }
  };

  const scrollToCard = (index: number) => {
    if (scrollRef.current && worldCupMatches.length > 1) {
      const container = scrollRef.current;
      const maxScrollLeft = container.scrollWidth - container.clientWidth;
      if (maxScrollLeft > 0) {
        const scrollPosition = (index / (worldCupMatches.length - 1)) * maxScrollLeft;
        container.scrollTo({
          left: scrollPosition,
          behavior: "smooth"
        });
      }
    }
  };

  const handleScroll = () => {
    if (scrollRef.current && worldCupMatches.length > 1) {
      const container = scrollRef.current;
      const scrollLeft = container.scrollLeft;
      const maxScrollLeft = container.scrollWidth - container.clientWidth;
      
      if (maxScrollLeft <= 0) {
        setActiveIndex(0);
        return;
      }

      // Calculate progress ratio (0 to 1) and map to dot index
      const progress = scrollLeft / maxScrollLeft;
      const newIndex = Math.min(
        worldCupMatches.length - 1,
        Math.round(progress * (worldCupMatches.length - 1))
      );

      if (newIndex !== activeIndex) {
        setActiveIndex(newIndex);
      }
    }
  };

  return (
    <div className="w-full relative group/slider my-4 md:my-6">
      {/* Floating Navigation Buttons (Desktop, outside overflow-hidden wrapper to prevent clipping) */}
      <button onClick={() => scroll('left')} className="absolute left-[170px] top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-slate-900/90 flex items-center justify-center shadow-[0_4px_15px_rgba(0,0,0,0.5)] border border-white/10 text-white/70 hover:text-emerald-400 hover:border-emerald-500/50 hover:scale-110 hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all opacity-0 md:group-hover/slider:opacity-100 -translate-x-1/2 hidden md:flex">
        <ChevronLeft className="w-6 h-6 mr-1" />
      </button>
      <button onClick={() => scroll('right')} className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-slate-900/90 flex items-center justify-center shadow-[0_4px_15px_rgba(0,0,0,0.5)] border border-white/10 text-white/70 hover:text-emerald-400 hover:border-emerald-500/50 hover:scale-110 hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all opacity-0 md:group-hover/slider:opacity-100 translate-x-1/2 hidden md:flex">
        <ChevronRight className="w-6 h-6 mr-1" />
      </button>

      {/* Main Content Box */}
      <div className="w-full h-auto md:h-[290px] rounded-2xl flex flex-col md:flex-row relative overflow-hidden border border-slate-200/80 shadow-[0_15px_35px_rgba(0,0,0,0.06)] bg-gradient-to-r from-emerald-950 to-slate-950">
        
        {/* Title Block - Brand Signature Gradient (Not covered by banner) */}
        <div className="bg-gradient-to-br from-[#16A34A] to-[#15803D] md:w-[170px] flex-shrink-0 flex flex-row md:flex-col items-center justify-between md:justify-center px-4 py-3 md:p-4 z-10 shadow-[4px_0_20px_rgba(0,0,0,0.3)] relative overflow-hidden rounded-t-2xl md:rounded-tr-none md:rounded-l-2xl border-r border-white/5">
          {/* Decorative subtle element */}
          <div className="absolute top-[-20px] right-[-20px] opacity-10">
            <Trophy className="w-24 h-24 text-white" />
          </div>
          
          {/* Left/Top Content: Icon & Text */}
          <div className="flex flex-row md:flex-col items-center relative z-10">
            <div className="bg-white/20 p-2 md:p-3 rounded-full mb-0 md:mb-3 mr-3 md:mr-0 border border-white/30 flex-shrink-0">
              <Trophy className="w-5 h-5 md:w-6 md:h-6 text-yellow-400" />
            </div>
            <h3 className="text-white font-black text-[14px] md:text-[15px] md:text-center uppercase tracking-widest leading-tight drop-shadow-md">
              WORLD CUP 2026
              <span className="text-yellow-400 text-[11px] opacity-90 tracking-normal font-bold block mt-0.5 md:mt-1">3 NGÀY TỚI</span>
            </h3>
          </div>
          
          {/* Right/Bottom Content: Button */}
          <Link href="/lich-thi-dau" className="mt-0 md:mt-6 bg-white/20 hover:bg-white/30 transition-all border border-white/30 text-white text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 md:px-4 md:py-2 rounded-full backdrop-blur-sm flex items-center space-x-1 group relative z-10 flex-shrink-0">
            <span>XEM TẤT CẢ</span>
            <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

      {/* Wrapper containing the static Background and Overlay */}
      <div 
        className="flex-1 relative overflow-hidden h-full bg-cover"
        style={{ 
          backgroundImage: "url('/backgrounds/banner-wc-26.png')",
          backgroundPosition: "center 36%"
        }}
      >
        {/* Light static glassmorphic overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-emerald-950/15 to-black/55 z-0 pointer-events-none" />

        {/* Scrollable Slider Area */}
        <div 
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory w-full h-full py-4 md:py-6 px-6 md:px-8 gap-4 md:gap-6 items-center scroll-pl-6 md:scroll-pl-8 relative z-10"
        >
        {isLoading && (
           <>
             {[1, 2, 3, 4, 5].map((skeleton) => (
                <div key={skeleton} className="flex-shrink-0 w-[250px] h-[156px] bg-slate-900/40 rounded-2xl p-4 shadow-[0_10px_30px_rgba(0,0,0,0.2)] border border-white/5 animate-pulse">
                  <div className="h-5 w-24 bg-white/10 rounded mb-3"></div>
                  <div className="h-3 w-32 bg-white/10 rounded mb-4"></div>
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="h-6 w-6 bg-white/10 rounded-full"></div>
                      <div className="h-4 w-20 bg-white/10 rounded"></div>
                    </div>
                    <div className="h-5 w-5 bg-white/10 rounded"></div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                      <div className="h-6 w-6 bg-white/10 rounded-full"></div>
                      <div className="h-4 w-20 bg-white/10 rounded"></div>
                    </div>
                    <div className="h-5 w-5 bg-white/10 rounded"></div>
                  </div>
                </div>
             ))}
           </>
        )}

        {!isLoading && error && (
           <div className="w-full flex items-center justify-center p-4 text-white/50 font-medium">
             Không thể tải dữ liệu: {error}
           </div>
        )}

        {!isLoading && !error && worldCupMatches.length === 0 && (
           <div className="w-full flex items-center justify-center p-4 text-white/50 font-medium">
             Không có trận đấu nào trong 3 ngày tới.
           </div>
        )}

        {!isLoading && !error && worldCupMatches.map((match) => {
          const isLive = match.status === "Đang đấu";
          const isFinished = match.status === "Kết thúc";
          return (
            <div key={match.id} className="flex-shrink-0 w-[250px] h-[156px] snap-start bg-slate-950/20 hover:bg-slate-950/70 backdrop-blur-[6px] rounded-2xl p-4 shadow-[0_15px_35px_rgba(0,0,0,0.4)] border border-white/10 hover:border-emerald-500/40 hover:shadow-[0_0_25px_rgba(16,185,129,0.2)] hover:-translate-y-1 transition-all duration-300 cursor-pointer group">
              
              <div className="flex items-center justify-between mb-3">
                 <span className="inline-block px-2 py-0.5 bg-white/5 text-white/70 group-hover:bg-emerald-500/10 group-hover:text-emerald-300 border border-white/5 rounded text-[10px] font-bold tracking-wider uppercase transition-colors">
                   {match.date}
                 </span>
                 {isLive ? (
                   <span className="flex items-center gap-1.5 text-[9px] font-black text-red-400 bg-red-950/50 px-2 py-0.5 rounded-full animate-pulse border border-red-500/30">
                     <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                     LIVE
                   </span>
                 ) : isFinished ? (
                   <span className="text-[9px] font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/20">
                     KẾT THÚC
                   </span>
                 ) : (
                   <span className="text-[11px] font-mono font-bold text-white/60">{match.time}</span>
                 )}
              </div>

              <div className="text-[11px] text-white/40 font-medium mb-4 truncate flex items-center">
                 <span className="truncate max-w-[140px] text-white/60 font-semibold" title={match.league}>{match.league}</span>
                 {match.round && <span className="mx-1 opacity-50">•</span>}
                 {match.round && <span className="truncate max-w-[80px]" title={match.round}>{match.round}</span>}
              </div>

              <div className="flex justify-between items-center mb-3">
                 <div className="flex items-center space-x-3">
                   {match.flagA.startsWith('http') ? (
                     <div className="w-6 h-6 bg-cover bg-center bg-no-repeat rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.5)] flex-shrink-0 border border-white/10" style={{ backgroundImage: `url(${match.flagA})` }}></div>
                   ) : (
                     <span className="text-[20px] leading-none flex-shrink-0 drop-shadow-sm">{match.flagA}</span>
                   )}
                   <span className="font-bold text-[14px] text-white/80 truncate max-w-[120px] group-hover:text-white transition-colors" title={match.teamA}>{match.teamA}</span>
                 </div>
                 <span className={`font-black text-[16px] flex-shrink-0 ${isFinished ? 'text-white' : 'text-emerald-400'}`}>{match.scoreA}</span>
              </div>

              <div className="flex justify-between items-center">
                 <div className="flex items-center space-x-3">
                   {match.flagB.startsWith('http') ? (
                     <div className="w-6 h-6 bg-cover bg-center bg-no-repeat rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.5)] flex-shrink-0 border border-white/10" style={{ backgroundImage: `url(${match.flagB})` }}></div>
                   ) : (
                     <span className="text-[20px] leading-none flex-shrink-0 drop-shadow-sm">{match.flagB}</span>
                   )}
                   <span className="font-bold text-[14px] text-white/80 truncate max-w-[120px] group-hover:text-white transition-colors" title={match.teamB}>{match.teamB}</span>
                 </div>
                 <span className={`font-black text-[16px] flex-shrink-0 ${isFinished ? 'text-white' : 'text-emerald-400'}`}>{match.scoreB}</span>
              </div>
            
            </div>
          );
        })}
      </div>

      {/* Navigation Dots */}
      {!isLoading && !error && worldCupMatches.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex space-x-2 z-20">
          {worldCupMatches.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollToCard(index)}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                activeIndex === index 
                  ? "bg-emerald-400 w-3.5 shadow-[0_0_8px_rgba(52,211,153,0.8)]" 
                  : "bg-white/40 hover:bg-white/60"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  </div>
</div>
  );
}
