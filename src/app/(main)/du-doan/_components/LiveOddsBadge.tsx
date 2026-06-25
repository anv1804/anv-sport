"use client";

import { useState, useEffect } from 'react';
import { getLiveProbability, getWinProbability } from '@/lib/utils';
import { Tv2 } from 'lucide-react';

interface Props {
  matchId: string;
  team1Name: string;
  team2Name: string;
  score1: number;
  score2: number;
  liveClock: string | null | undefined;
  matchDate?: string;
  matchTime?: string;
}

function parseClock(liveClock: string | null | undefined, matchDate?: string, matchTime?: string): number {
  if (liveClock) {
    const parsed = parseInt(liveClock.replace(/[^0-9]/g, ''));
    if (!isNaN(parsed) && parsed >= 0) return Math.min(parsed, 120);
  }
  if (matchDate && matchTime) {
    try {
      let yr: number, mo: number, dy: number;
      if (matchDate.includes('/')) {
        const [d, m, y] = matchDate.split('/').map(Number);
        dy = d; mo = m; yr = y;
      } else {
        const [y, m, d] = matchDate.split('-').map(Number);
        yr = y; mo = m; dy = d;
      }
      const [h, min] = matchTime.split(':').map(Number);
      const kickoff = new Date(yr, mo - 1, dy, h, min, 0, 0);
      const realElapsed = Math.floor((Date.now() - kickoff.getTime()) / 60000);
      if (realElapsed < 0 || realElapsed > 130) return 0;
      if (realElapsed <= 45) return realElapsed;
      if (realElapsed <= 60) return 45;
      return Math.min(45 + (realElapsed - 60), 90);
    } catch { /* ignore */ }
  }
  return 0;
}

export default function LiveOddsBadge({
  matchId, team1Name, team2Name,
  score1, score2, liveClock, matchDate, matchTime,
}: Props) {
  const preMatch = getWinProbability(matchId, team1Name, team2Name);

  const [minutes, setMinutes] = useState(() => parseClock(liveClock, matchDate, matchTime));

  useEffect(() => {
    setMinutes(parseClock(liveClock, matchDate, matchTime));
    const id = setInterval(() => {
      setMinutes(parseClock(liveClock, matchDate, matchTime));
    }, 30_000);
    return () => clearInterval(id);
  }, [liveClock, matchDate, matchTime]);

  const { w1, draw, w2 } = minutes > 0
    ? getLiveProbability(score1, score2, minutes, preMatch.w1, preMatch.draw, preMatch.w2)
    : preMatch;

  const aiPct = Math.max(w1, draw, w2) === w1 ? w1 : Math.max(w1, draw, w2) === w2 ? w2 : draw;

  return (
    <div className="flex-shrink-0 w-[56px] sm:w-[72px] flex flex-col items-center gap-1 pl-2 sm:pl-3 border-l border-slate-100">
      <div className="relative">
        <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center border border-red-200 bg-red-50/40">
          <Tv2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500" />
        </div>
        <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border border-white flex items-center justify-center bg-red-500 animate-pulse">
          <span className="text-[4px] text-white font-black">✦</span>
        </div>
      </div>
      <div className="text-[7px] sm:text-[8px] font-bold tracking-wider text-center leading-tight">
        <span className="text-red-500">LIVE</span><span className="text-slate-500"> ODDS</span>
      </div>
      <div className="text-sm sm:text-base md:text-lg font-black leading-none text-red-500">
        {aiPct}%
      </div>
    </div>
  );
}
