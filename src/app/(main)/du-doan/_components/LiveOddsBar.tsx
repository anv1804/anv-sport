"use client";

import { useState, useEffect } from 'react';
import { getLiveProbability, getWinProbability } from '@/lib/utils';

interface Props {
  matchId: string;
  team1Name: string;
  team2Name: string;
  score1: number;
  score2: number;
  /** Phút hiện tại từ ESPN (ví dụ "76'" → 76). Dùng làm seed ban đầu. */
  liveClock: string | null | undefined;
  matchDate?: string; // "DD/MM/YYYY" hoặc "YYYY-MM-DD"
  matchTime?: string; // "HH:MM"
  /** Nếu true: hiển thị dạng thanh đơn giản (MatchCard). Nếu false: hiển thị full (WinProbabilityBar). */
  compact?: boolean;
}

/** Parse phút từ liveClock của ESPN (dạng "73'" hoặc "73:00") */
function parseClock(liveClock: string | null | undefined, matchDate?: string, matchTime?: string): number {
  if (liveClock) {
    const parsed = parseInt(liveClock.replace(/[^0-9]/g, ''));
    if (!isNaN(parsed) && parsed >= 0) return Math.min(parsed, 120);
  }
  // Fallback: tính từ giờ bắt đầu
  if (matchDate && matchTime) {
    try {
      // Hỗ trợ cả "DD/MM/YYYY" và "YYYY-MM-DD"
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
      if (realElapsed <= 60) return 45; // half-time break
      return Math.min(45 + (realElapsed - 60), 90);
    } catch { /* ignore */ }
  }
  return 0;
}

export default function LiveOddsBar({
  matchId, team1Name, team2Name,
  score1, score2,
  liveClock, matchDate, matchTime,
  compact = false,
}: Props) {
  const preMatch = getWinProbability(matchId, team1Name, team2Name);

  const [minutes, setMinutes] = useState<number>(() =>
    parseClock(liveClock, matchDate, matchTime)
  );

  // Tự tăng phút mỗi 30s dựa trên đồng hồ thực — không cần API
  useEffect(() => {
    // Sync ngay khi liveClock prop thay đổi (polling parent đã fetch xong)
    setMinutes(parseClock(liveClock, matchDate, matchTime));

    const id = setInterval(() => {
      setMinutes(parseClock(liveClock, matchDate, matchTime));
    }, 30_000); // 30 giây 1 lần

    return () => clearInterval(id);
  }, [liveClock, matchDate, matchTime]);

  const { w1, draw, w2 } = minutes > 0 && (score1 !== null || score2 !== null)
    ? getLiveProbability(score1 ?? 0, score2 ?? 0, minutes, preMatch.w1, preMatch.draw, preMatch.w2)
    : preMatch;

  if (compact) {
    return (
      <div className="border-t border-slate-100 bg-slate-50/20">
        <div className="flex items-center justify-between px-3 py-1 sm:px-4 sm:py-1.5">
          <span className="text-[8px] sm:text-[9px] font-black tracking-wider text-red-500">
            {w1}% {team1Name.toUpperCase()} WIN
          </span>
          <span className="text-[8px] sm:text-[9px] font-bold text-slate-400 tracking-wider">
            {draw}% HÒA
          </span>
          <span className="text-[8px] sm:text-[9px] font-black tracking-wider text-red-400">
            {w2}% {team2Name.toUpperCase()} WIN
          </span>
        </div>
        <div className="flex h-1 bg-slate-100">
          <div className="h-full bg-red-500 transition-all duration-700" style={{ width: `${w1}%` }} />
          <div className="h-full bg-slate-300 transition-all duration-700" style={{ width: `${draw}%` }} />
          <div className="h-full bg-red-300 transition-all duration-700" style={{ width: `${w2}%` }} />
        </div>
      </div>
    );
  }

  // Full bar (dùng trong WinProbabilityBar trang chi tiết)
  return (
    <div className="bg-slate-950 border-b border-slate-800">
      <div className="flex items-center justify-center gap-1.5 pt-1.5 pb-0.5">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
        <span className="text-[8px] font-black text-red-400 tracking-widest uppercase">
          Live Odds — {minutes}&apos; — Cập nhật theo tỉ số thực
        </span>
      </div>
      <div className="flex items-center justify-between px-4 md:px-6 pt-2 pb-1">
        <span className="text-[9px] md:text-[10px] font-black tracking-wider text-red-400">
          {w1}% {team1Name.toUpperCase()} WIN
        </span>
        <span className="text-[9px] md:text-[10px] font-bold text-slate-400 tracking-wider">
          {draw}% HÒA
        </span>
        <span className="text-[9px] md:text-[10px] font-black text-blue-400 tracking-wider">
          {w2}% {team2Name.toUpperCase()} WIN
        </span>
      </div>
      <div className="flex h-1">
        <div className="h-full bg-red-500 transition-all duration-700" style={{ width: `${w1}%` }} />
        <div className="h-full bg-red-300 transition-all duration-700" style={{ width: `${draw}%` }} />
        <div className="h-full bg-blue-400 transition-all duration-700" style={{ width: `${w2}%` }} />
      </div>
    </div>
  );
}
