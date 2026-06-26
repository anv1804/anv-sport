"use client";

import { useState, useEffect } from 'react';
import { ArrowLeft, Star, Info, ChevronDown, Check, X, TrendingUp, TrendingDown, Search, Trophy, Activity } from 'lucide-react';
import Link from 'next/link';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, Tooltip as RechartsTooltip, Cell,
  LineChart, Line, CartesianGrid, YAxis
} from 'recharts';

interface TeamInfo { name: string; logo?: string }
interface PlayerMatch {
  id: string; tournament: string; date: string; status: string;
  score1: number | string; score2: number | string;
  team1: TeamInfo; team2: TeamInfo; playerRating: string | number;
}
interface MonthlyEntry { month: string; rating: number }

export default function PlayerDetailClient({ playerId }: { playerId: string }) {
  const [player, setPlayer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlayer = async () => {
      try {
        const res = await fetch(`/api/player/${playerId}`);
        const data = await res.json();
        if (data.success) setPlayer(data.data);
        else setError(data.error || "Không tìm thấy thông tin cầu thủ.");
      } catch {
        setError("Lỗi kết nối máy chủ API");
      } finally {
        setLoading(false);
      }
    };
    fetchPlayer();
  }, [playerId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f0f4f8]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-[3px] border-slate-200 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (error || !player) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f0f4f8] text-center px-4">
        <h2 className="text-xl font-black text-slate-900 mb-3 uppercase tracking-wider">Lỗi Truy Xuất</h2>
        <p className="text-slate-500 mb-6">{error}</p>
        <Link href="/" className="px-6 py-2 bg-slate-900 text-white font-bold rounded-xl">Quay lại Trang chủ</Link>
      </div>
    );
  }

  /* ─── helpers ─── */
  const getBarColor = (r: number) => r >= 8 ? '#3b82f6' : r >= 7 ? '#22c55e' : r >= 6.5 ? '#eab308' : '#ef4444';

  const getRatingClass = (rating: number | string) => {
    const r = parseFloat(String(rating));
    if (r >= 8.0) return 'bg-blue-500 text-white';
    if (r >= 7.0) return 'bg-emerald-600 text-white';
    if (r >= 6.5) return 'bg-amber-500 text-white';
    return 'bg-red-500 text-white';
  };

  const getMatchResult = (match: PlayerMatch): 'W' | 'D' | 'L' => {
    const isT1 = match.team1.name === player.team.name;
    const s1 = Number(match.score1), s2 = Number(match.score2);
    if (s1 === s2) return 'D';
    if (isT1) return s1 > s2 ? 'W' : 'L';
    return s2 > s1 ? 'W' : 'L';
  };

  const resultCfg = {
    W: { pill: 'bg-emerald-500 text-white', border: 'border-l-emerald-400', label: 'T' },
    D: { pill: 'bg-slate-400 text-white',   border: 'border-l-slate-300',   label: 'H' },
    L: { pill: 'bg-red-500 text-white',     border: 'border-l-red-400',     label: 'B' },
  };

  const getPitchPos = (pos: string) => {
    const p = (pos || '').toUpperCase();
    if (p === 'GK') return 'bottom-1.5 left-1/2 -translate-x-1/2';
    if (p === 'CB') return 'bottom-7 left-1/2 -translate-x-1/2';
    if (p === 'LB' || p === 'LWB') return 'bottom-8 left-1.5';
    if (p === 'RB' || p === 'RWB') return 'bottom-8 right-1.5';
    if (p === 'DM') return 'bottom-14 left-1/2 -translate-x-1/2';
    if (p === 'CM') return 'top-[45%] left-1/2 -translate-x-1/2';
    if (p === 'LM') return 'top-[45%] left-1.5';
    if (p === 'RM') return 'top-[45%] right-1.5';
    if (p === 'AM') return 'top-[28%] left-1/2 -translate-x-1/2';
    if (p === 'LW') return 'top-7 left-1.5';
    if (p === 'RW') return 'top-7 right-1.5';
    if (p === 'CF' || p === 'ST' || p === 'SS') return 'top-1.5 left-1/2 -translate-x-1/2';
    return 'top-[45%] left-1/2 -translate-x-1/2';
  };

  const flagMap: Record<string, string> = {
    'Pháp':'🇫🇷','France':'🇫🇷','Anh':'🏴󠁧󠁢󠁥󠁮󠁧󠁿','England':'🏴󠁧󠁢󠁥󠁮󠁧󠁿','Đức':'🇩🇪','Germany':'🇩🇪',
    'Tây Ban Nha':'🇪🇸','Spain':'🇪🇸','Ý':'🇮🇹','Italy':'🇮🇹','Argentina':'🇦🇷','Brazil':'🇧🇷',
    'Bồ Đào Nha':'🇵🇹','Portugal':'🇵🇹','Netherlands':'🇳🇱','Hà Lan':'🇳🇱','Belgium':'🇧🇪','Bỉ':'🇧🇪',
    'Croatia':'🇭🇷','Denmark':'🇩🇰','Đan Mạch':'🇩🇰','Norway':'🇳🇴','Na Uy':'🇳🇴',
    'Sweden':'🇸🇪','Thụy Điển':'🇸🇪','Switzerland':'🇨🇭','Thụy Sĩ':'🇨🇭',
    'Poland':'🇵🇱','Ba Lan':'🇵🇱','Uruguay':'🇺🇾','Colombia':'🇨🇴','Mexico':'🇲🇽',
    'Japan':'🇯🇵','Nhật Bản':'🇯🇵','Hàn Quốc':'🇰🇷','Morocco':'🇲🇦','Senegal':'🇸🇳',
    'Nigeria':'🇳🇬','Egypt':'🇪🇬','Scotland':'🏴󠁧󠁢󠁳󠁣󠁴󠁿','Wales':'🏴󠁧󠁢󠁷󠁬󠁳󠁿','Việt Nam':'🇻🇳',
    'Mali':'🇲🇱','Ghana':'🇬🇭','Côte d\'Ivoire':'🇨🇮','Ivory Coast':'🇨🇮',
    'USA':'🇺🇸','Mỹ':'🇺🇸','Australia':'🇦🇺','Úc':'🇦🇺','Ukraine':'🇺🇦',
    'Russia':'🇷🇺','Nga':'🇷🇺',
  };

  const matchGroups: Record<string, PlayerMatch[]> = player.matches.reduce(
    (acc: Record<string, PlayerMatch[]>, m: PlayerMatch) => {
      if (!acc[m.tournament]) acc[m.tournament] = [];
      acc[m.tournament].push(m);
      return acc;
    }, {}
  );

  const footLabel = (f: string) =>
    f === 'Right' ? 'Phải' : f === 'Left' ? 'Trái' : f === 'Both' ? 'Cả hai' : f || '--';

  return (
    <div className="w-full bg-[#eef2f7] text-slate-900 pb-16 min-h-screen font-sans">

      {/* ── NAV ── */}
      <div className="bg-white/95 backdrop-blur-sm border-b border-slate-200/70 sticky top-0 z-50 shadow-sm">
        <div className="max-w-[1160px] mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/trung-tam-du-lieu" className="flex items-center gap-1.5 text-slate-500 hover:text-slate-900 font-bold uppercase tracking-widest text-[10px] transition-colors group">
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Quay lại
          </Link>
          <span className="font-black text-slate-700 uppercase tracking-[0.12em] text-[11px]">Trung Tâm Dữ Liệu Cầu Thủ</span>
          <div className="w-16" />
        </div>
      </div>

      <main className="max-w-[1160px] mx-auto px-4 pt-5 grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* ══ LEFT COLUMN ══ */}
        <div className="lg:col-span-2 space-y-4">

          {/* ── HERO CARD ── */}
          <div className="rounded-[22px] relative overflow-hidden" style={{boxShadow:'0 20px 60px rgba(10,30,15,0.28)'}}>
            {/* layered background */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#19291a] via-[#0d3828] to-[#142519]" />
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMS41IiBjeT0iMS41IiByPSIxLjUiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNCkiLz48L3N2Zz4=')] opacity-100" />
            <div className="absolute -right-24 -top-24 w-80 h-80 rounded-full bg-emerald-500/8 blur-3xl" />
            <div className="absolute left-1/2 -bottom-12 w-96 h-40 bg-emerald-900/30 blur-3xl" />

            <div className="relative z-10 p-5 md:p-6">
              <div className="flex items-center gap-5">

                {/* Avatar with glow */}
                <div className="relative shrink-0">
                  <div className="absolute inset-0 rounded-full bg-emerald-500/15 blur-2xl scale-125" />
                  <div className="relative w-[84px] h-[84px] md:w-[100px] md:h-[100px] rounded-full overflow-hidden shadow-2xl"
                       style={{border:'2.5px solid rgba(255,255,255,0.18)', boxShadow:'0 0 0 4px rgba(52,211,153,0.12), 0 8px 32px rgba(0,0,0,0.4)'}}>
                    <img src={player.image} alt={player.name} className="w-full h-full object-cover object-top" />
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-7 h-7 rounded-full border-2 border-[#0d3828] bg-white flex items-center justify-center text-[15px] select-none shadow-lg">
                    {flagMap[player.personalInfo?.nationality?.name] ?? '🌐'}
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  {/* Name row */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2 min-w-0 flex-wrap">
                      <h1 className="text-[22px] md:text-[28px] font-black text-white tracking-tight leading-none">{player.name}</h1>
                      <button className="w-6 h-6 rounded-full border border-white/15 hover:border-amber-400/70 hover:bg-amber-400/15 flex items-center justify-center transition-all shrink-0 mt-0.5">
                        <Star className="w-3 h-3 text-white/35 hover:text-amber-400" />
                      </button>
                    </div>
                    {/* Big rating */}
                    {player.performance?.overallRating && (
                      <div className="shrink-0 flex flex-col items-end">
                        <span className="text-[34px] md:text-[40px] font-black leading-none tabular-nums"
                              style={{background:'linear-gradient(135deg, #6ee7b7, #10b981)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent'}}>
                          {player.performance.overallRating}
                        </span>
                        <span className="text-[8px] text-emerald-400/50 font-bold uppercase tracking-[0.15em] -mt-0.5">Sofascore</span>
                      </div>
                    )}
                  </div>

                  {/* Meta chips */}
                  <div className="flex items-center gap-2 flex-wrap mb-3.5">
                    <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/25 text-[10px] font-black uppercase tracking-widest px-2.5 py-[3px] rounded-full">
                      {player.personalInfo.position || 'Cầu thủ'}
                    </span>
                    {player.personalInfo?.nationality?.name && (
                      <span className="text-white/45 text-[11px] font-semibold">{player.personalInfo.nationality.name}</span>
                    )}
                    {player.personalInfo.age && (
                      <><span className="text-white/20">·</span><span className="text-white/45 text-[11px] font-semibold">{player.personalInfo.age} tuổi</span></>
                    )}
                    {player.personalInfo.height && (
                      <><span className="text-white/20">·</span><span className="text-white/45 text-[11px] font-semibold">{player.personalInfo.height} cm</span></>
                    )}
                    {player.personalInfo.playerValue && (
                      <><span className="text-white/20">·</span>
                        <span className="text-amber-400 text-[11px] font-bold">{player.personalInfo.playerValue}</span>
                      </>
                    )}
                  </div>

                  {/* Actions + club */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <button className="bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-white text-[10px] font-black uppercase tracking-widest px-4 py-[7px] rounded-full transition-all flex items-center gap-1.5 shadow-lg shadow-emerald-900/30">
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                      So sánh
                    </button>
                    <button className="border border-white/15 hover:bg-white/10 text-white/65 hover:text-white text-[10px] font-black uppercase tracking-widest px-4 py-[7px] rounded-full transition-all flex items-center gap-1.5">
                      <Star className="w-3 h-3" />
                      Yêu thích
                    </button>

                    {/* Club — flush right */}
                    <div className="ml-auto flex items-center gap-2.5 bg-white/7 border border-white/8 rounded-[14px] px-3.5 py-2 hover:bg-white/10 transition-colors cursor-pointer">
                      {player.team.logo
                        ? <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center overflow-hidden shrink-0">
                            <img src={player.team.logo} alt={player.team.name} className="w-5 h-5 object-contain" />
                          </div>
                        : <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center text-white font-black text-xs shrink-0">{player.team.name?.[0]}</div>
                      }
                      <div>
                        <p className="font-bold text-white text-[13px] leading-none mb-0.5">{player.team.name}</p>
                        <p className="text-[10px] text-white/35 font-medium">Đến {player.team.contractUntil}</p>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* ── STAT CHIPS STRIP ── */}
          <div className="bg-white rounded-[18px] shadow-[0_4px_20px_rgba(15,23,42,0.06)] overflow-hidden">
            <div className="grid grid-cols-3 md:grid-cols-6">
              {[
                { label: 'Quốc tịch', value: player.personalInfo.nationality.name || '—', sub: null, accent: false,
                  icon: <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg> },
                { label: 'Ngày sinh', value: player.personalInfo.birthDate, sub: `${player.personalInfo.age} tuổi`, accent: false,
                  icon: <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
                { label: 'Chiều cao', value: player.personalInfo.height ? `${player.personalInfo.height} cm` : '—', sub: null, accent: false,
                  icon: <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3"/><path d="M16 3h3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-3"/><line x1="12" y1="20" x2="12" y2="4"/></svg> },
                { label: 'Chân thuận', value: footLabel(player.personalInfo.preferredFoot), sub: null, accent: false,
                  icon: <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="m4.93 4.93 4.24 4.24"/><path d="m14.83 9.17 4.24-4.24"/><path d="m14.83 14.83 4.24 4.24"/><path d="m9.17 14.83-4.24 4.24"/><circle cx="12" cy="12" r="4"/></svg> },
                { label: 'Vị trí', value: player.personalInfo.position || '—', sub: null, accent: true,
                  icon: <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="12" y1="3" x2="12" y2="21"/><circle cx="12" cy="12" r="3"/></svg> },
                { label: 'Số áo', value: String(player.personalInfo.shirtNumber || '—'), sub: null, accent: false,
                  icon: <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.57a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.57a2 2 0 0 0-1.34-2.23z"/></svg> },
              ].map((item, i) => (
                <div key={i}
                     className={`relative flex flex-col items-center justify-center gap-0.5 py-4 px-2 text-center transition-colors hover:bg-slate-50 cursor-default
                       ${i < 3 ? 'border-b md:border-b-0' : ''} ${i % 3 !== 2 ? 'border-r' : ''} md:border-r border-slate-100
                       ${item.accent ? 'bg-emerald-50/60 hover:bg-emerald-50' : ''}`}>
                  {item.accent && <div className="absolute top-0 left-0 right-0 h-[2px] bg-emerald-400/60 rounded-t" />}
                  <div className={`mb-1 ${item.accent ? 'text-emerald-500' : 'text-slate-400'}`}>{item.icon}</div>
                  <p className="text-[8.5px] uppercase text-slate-400 font-bold tracking-widest leading-none mb-1">{item.label}</p>
                  <p className={`font-black text-[13px] leading-tight ${item.accent ? 'text-emerald-600' : 'text-slate-800'}`}>{item.value}</p>
                  {item.sub && <p className="text-[10px] text-slate-400 font-medium mt-0.5">{item.sub}</p>}
                </div>
              ))}
            </div>
          </div>

          {/* ── VALUE + STRENGTHS / BAR CHART ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div className="space-y-4">

              {/* Market Value card */}
              <div className="rounded-[18px] overflow-hidden shadow-[0_4px_20px_rgba(15,23,42,0.07)] relative">
                <div className="absolute inset-0 bg-white" />
                <div className="absolute bottom-0 right-0 w-40 h-20 bg-amber-100/60 blur-2xl rounded-full" />
                <div className="relative p-4 flex items-center gap-4">
                  {/* Icon */}
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
                    <svg className="w-6 h-6 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/><path d="M9 12h6"/><path d="M12 9v3"/></svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[9.5px] uppercase text-slate-400 font-bold tracking-widest mb-0.5">Giá trị thị trường</p>
                    <p className="text-[26px] font-black text-amber-500 leading-none">{player.personalInfo.playerValue}</p>
                  </div>
                  <div className="flex flex-col gap-1.5 shrink-0">
                    <button className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center hover:bg-emerald-100 transition-colors">
                      <TrendingUp className="w-3.5 h-3.5" />
                    </button>
                    <button className="w-8 h-8 rounded-xl bg-red-50 border border-red-100 text-red-400 flex items-center justify-center hover:bg-red-100 transition-colors">
                      <TrendingDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                {/* Quick career stats */}
                {(player.personalInfo.careerGoals || player.personalInfo.careerApps) && (
                  <div className="relative border-t border-slate-100 grid grid-cols-2 divide-x divide-slate-100">
                    {player.personalInfo.careerGoals != null && (
                      <div className="px-4 py-2.5 flex items-center gap-2">
                        <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <div>
                          <p className="text-[10px] text-slate-400 font-semibold leading-none">Bàn thắng</p>
                          <p className="text-[15px] font-black text-slate-800">{player.personalInfo.careerGoals}</p>
                        </div>
                      </div>
                    )}
                    {player.personalInfo.careerApps != null && (
                      <div className="px-4 py-2.5 flex items-center gap-2">
                        <Activity className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <div>
                          <p className="text-[10px] text-slate-400 font-semibold leading-none">Trận đấu</p>
                          <p className="text-[15px] font-black text-slate-800">{player.personalInfo.careerApps}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Strengths & Weaknesses */}
              <div className="bg-white rounded-[18px] p-4 shadow-[0_4px_20px_rgba(15,23,42,0.06)]">
                <div className="flex gap-4">
                  <div className="flex-1 min-w-0 space-y-3">
                    <div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <div className="w-1 h-3.5 rounded-full bg-emerald-500" />
                        <h3 className="text-emerald-600 font-black text-[10px] uppercase tracking-widest">Điểm mạnh</h3>
                      </div>
                      <ul className="space-y-1.5">
                        {player.traits.strengths.map((s: string, i: number) => (
                          <li key={i} className="flex items-center gap-2 group">
                            <span className="w-[18px] h-[18px] rounded-md bg-emerald-100 flex items-center justify-center shrink-0 group-hover:bg-emerald-200 transition-colors">
                              <Check className="w-2.5 h-2.5 text-emerald-600 stroke-[3]" />
                            </span>
                            <span className="text-[12.5px] font-semibold text-slate-700 leading-snug">{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <div className="w-1 h-3.5 rounded-full bg-red-400" />
                        <h3 className="text-red-500 font-black text-[10px] uppercase tracking-widest">Điểm yếu</h3>
                      </div>
                      <ul className="space-y-1.5">
                        {player.traits.weaknesses.map((s: string, i: number) => (
                          <li key={i} className="flex items-center gap-2 group">
                            <span className="w-[18px] h-[18px] rounded-md bg-red-50 flex items-center justify-center shrink-0 group-hover:bg-red-100 transition-colors">
                              <X className="w-2.5 h-2.5 text-red-500 stroke-[3]" />
                            </span>
                            <span className="text-[12.5px] font-semibold text-slate-700 leading-snug">{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Mini pitch */}
                  <div className="w-[100px] shrink-0 self-stretch relative rounded-xl overflow-hidden min-h-[150px]"
                       style={{background:'linear-gradient(170deg,#3aa34f,#277a36)', boxShadow:'inset 0 2px 12px rgba(0,0,0,0.15)'}}>
                    {/* Lines */}
                    <div className="absolute inset-x-0 top-0 h-full">
                      {/* border */}
                      <div className="absolute inset-[5px] border border-white/30 rounded" />
                      {/* halfway */}
                      <div className="absolute top-1/2 left-[5px] right-[5px] h-px bg-white/30" />
                      {/* center circle */}
                      <div className="absolute top-1/2 left-1/2 w-8 h-8 rounded-full border border-white/30 -translate-x-1/2 -translate-y-1/2" />
                      <div className="absolute top-1/2 left-1/2 w-1 h-1 rounded-full bg-white/50 -translate-x-1/2 -translate-y-1/2" />
                      {/* penalty boxes */}
                      <div className="absolute top-[5px] left-1/2 w-10 h-6 border border-t-0 border-white/30 -translate-x-1/2" />
                      <div className="absolute bottom-[5px] left-1/2 w-10 h-6 border border-b-0 border-white/30 -translate-x-1/2" />
                    </div>
                    {/* grass stripes */}
                    <div className="absolute inset-0 opacity-10"
                         style={{backgroundImage:'repeating-linear-gradient(0deg,transparent,transparent 12px,rgba(0,0,0,0.15) 12px,rgba(0,0,0,0.15) 24px)'}} />
                    {/* Position badge */}
                    <div className={`absolute bg-[#1a4a1a] text-emerald-300 text-[9px] font-black px-1.5 py-[3px] rounded shadow-md border border-white/15 z-10 ${getPitchPos(player.traits.pitchPosition)}`}>
                      {player.traits.pitchPosition}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bar chart */}
            <div className="bg-white rounded-[18px] p-4 flex flex-col shadow-[0_4px_20px_rgba(15,23,42,0.06)]">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-bold text-slate-800 text-[13px] leading-none mb-0.5">Tóm tắt phong độ</h3>
                  <p className="text-[10px] text-slate-400 font-medium">12 tháng gần nhất</p>
                </div>
                <span className={`font-black text-[13px] px-2.5 py-1 rounded-xl ${getRatingClass(player.performance.overallRating)}`}>
                  {player.performance.overallRating}
                </span>
              </div>

              <div className="h-[150px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={player.performance.monthlyForm} margin={{ top: 6, right: 0, left: 0, bottom: 0 }} barCategoryGap="24%">
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 9.5, fill: '#94a3b8', fontWeight: 600 }} dy={7} />
                    <RechartsTooltip cursor={{ fill: '#f8fafc', radius: 4 }} content={({ active, payload }) => {
                      if (active && payload?.length) {
                        return (
                          <div className="bg-slate-900 text-white text-[11px] px-2.5 py-1.5 rounded-xl shadow-2xl font-bold border border-white/10">
                            {payload[0].payload.month} — <span className="text-emerald-400">{payload[0].value}</span>
                          </div>
                        );
                      }
                      return null;
                    }} />
                    <Bar dataKey="rating" radius={[4, 4, 0, 0]} maxBarSize={28}>
                      {player.performance.monthlyForm.map((e: MonthlyEntry, i: number) => (
                        <Cell key={i} fill={getBarColor(e.rating)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Color legend */}
              <div className="flex items-center gap-3 mt-2 mb-3 flex-wrap">
                {[['#3b82f6','≥8.0 Xuất sắc'],['#22c55e','≥7.0 Tốt'],['#eab308','≥6.5 Trung bình'],['#ef4444','Kém']].map(([c,l]) => (
                  <div key={l} className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-sm" style={{background:c}} />
                    <span className="text-[9px] text-slate-400 font-semibold">{l}</span>
                  </div>
                ))}
              </div>

              <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden">
                    <img src="https://upload.wikimedia.org/wikipedia/en/thumb/f/f2/Premier_League_Logo.svg/1200px-Premier_League_Logo.svg.png" className="w-4 h-4 object-contain" alt="PL" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-800 leading-none">Premier League</p>
                    <p className="text-[9.5px] text-slate-400 font-medium mt-0.5">{player.performance.appearances} trận</p>
                  </div>
                </div>
                <span className={`font-black text-[12px] px-2.5 py-1 rounded-xl ${getRatingClass(player.performance.leagueRating)}`}>
                  {player.performance.leagueRating}
                </span>
              </div>
            </div>

          </div>

          {/* ── MATCH LIST ── */}
          <div className="bg-white rounded-[18px] overflow-hidden shadow-[0_4px_20px_rgba(15,23,42,0.06)]">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-black text-slate-800 text-[13px]">Trận đấu gần đây</h3>
              <span className="text-[10px] text-slate-400 font-semibold">{player.matches.length} trận</span>
            </div>

            {Object.entries(matchGroups).map(([tournament, matches]) => (
              <div key={tournament}>
                {/* Tournament header */}
                <div className="px-5 py-2 bg-slate-50/80 border-b border-slate-100 flex items-center gap-2">
                  <div className="w-1 h-3 rounded-full bg-emerald-400" />
                  <span className="text-[9.5px] font-black uppercase tracking-[0.12em] text-slate-500">{tournament}</span>
                </div>

                {matches.map((match: PlayerMatch) => {
                  const res = getMatchResult(match);
                  const rc = resultCfg[res];
                  return (
                    <div key={match.id}
                         className={`border-l-[3px] ${rc.border} px-4 py-3 hover:bg-slate-50/60 border-b border-slate-100/60 last:border-b-0 transition-colors`}>
                      <div className="flex items-center gap-3">

                        {/* Result badge + meta */}
                        <div className="flex flex-col items-center gap-0.5 w-9 shrink-0">
                          <span className={`text-[9.5px] font-black w-5 h-5 rounded-full flex items-center justify-center ${rc.pill}`}>
                            {rc.label}
                          </span>
                          <span className="text-[8.5px] font-bold text-slate-400 text-center leading-tight mt-0.5">{match.date}</span>
                          <span className="text-[8px] text-slate-300 font-semibold">{match.status}</span>
                        </div>

                        {/* Teams & score */}
                        <div className="flex-1 flex items-center min-w-0">
                          {/* Home team */}
                          <div className="flex items-center gap-1.5 justify-end flex-1 min-w-0">
                            <span className={`text-[12px] font-bold truncate ${match.team1.name === player.team.name ? 'text-slate-900' : 'text-slate-400'}`}>
                              {match.team1.name}
                            </span>
                            {match.team1.logo
                              ? <img src={match.team1.logo} alt="" className="w-5 h-5 object-contain shrink-0" />
                              : <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-black text-[8px] shrink-0">{match.team1.name?.[0]}</div>
                            }
                          </div>

                          {/* Score */}
                          <div className="mx-3 shrink-0">
                            <div className="bg-slate-900 text-white font-black text-[13px] px-2.5 py-1 rounded-lg tabular-nums">
                              {match.score1} – {match.score2}
                            </div>
                          </div>

                          {/* Away team */}
                          <div className="flex items-center gap-1.5 justify-start flex-1 min-w-0">
                            {match.team2.logo
                              ? <img src={match.team2.logo} alt="" className="w-5 h-5 object-contain shrink-0" />
                              : <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-black text-[8px] shrink-0">{match.team2.name?.[0]}</div>
                            }
                            <span className={`text-[12px] font-bold truncate ${match.team2.name === player.team.name ? 'text-slate-900' : 'text-slate-400'}`}>
                              {match.team2.name}
                            </span>
                          </div>
                        </div>

                        {/* Rating */}
                        <span className={`font-black text-[11.5px] px-2 py-1 rounded-lg shrink-0 ${getRatingClass(parseFloat(String(match.playerRating)))}`}>
                          {match.playerRating}
                        </span>

                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

        </div>

        {/* ══ RIGHT COLUMN ══ */}
        <div className="space-y-4">

          {/* Radar */}
          <div className="bg-white rounded-[18px] p-5 shadow-[0_4px_20px_rgba(15,23,42,0.06)] relative">
            <div className="absolute top-4 right-4"><Info className="w-3.5 h-3.5 text-slate-300" /></div>
            <div className="mb-4">
              <h3 className="font-black text-slate-800 text-[13px] leading-none mb-0.5">Tổng quan chỉ số</h3>
              <p className="text-[10px] text-slate-400 font-medium">Mùa giải 2024/25</p>
            </div>

            <div className="w-full h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="72%" data={player.attributes}>
                  <PolarGrid stroke="#e8edf2" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9.5, fill: '#94a3b8', fontWeight: 700 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name={player.name} dataKey="A" stroke="#10b981" fill="#10b981" fillOpacity={0.15} strokeWidth={2} dot={{ r: 2.5, fill: '#10b981', stroke: '#fff', strokeWidth: 1.5 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div className="flex justify-between text-[9.5px] font-bold text-slate-400 border-t border-slate-100 pt-3 px-1 mt-1">
              <span>Th12 2021</span><span>Th12 2022</span><span>Th12 2023</span>
              <span className="text-emerald-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />Th12 2024
              </span>
            </div>
          </div>

          {/* Search compare */}
          <div className="bg-white rounded-[18px] p-4 shadow-[0_4px_20px_rgba(15,23,42,0.06)]">
            <div className="relative">
              <input type="text" placeholder="Tìm kiếm để so sánh cầu thủ"
                     className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[12.5px] font-medium outline-none focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/15 transition-all" />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            </div>
            <p className="text-[9.5px] text-slate-400 mt-2.5 flex gap-1.5 items-start leading-relaxed">
              <Info className="w-3 h-3 shrink-0 mt-px" />
              Nhấp vào biểu đồ để xem giá trị trung bình cho vị trí này
            </p>
          </div>

          {/* Rating history */}
          {player.ratingHistory && (
            <div className="bg-white rounded-[18px] p-4 shadow-[0_4px_20px_rgba(15,23,42,0.06)]">
              <div className="mb-4">
                <h3 className="font-black text-slate-800 text-[13px] leading-none mb-0.5">Thống kê cầu thủ</h3>
              </div>

              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors text-slate-600 text-[10px] font-bold">
                  <img src="https://upload.wikimedia.org/wikipedia/en/thumb/b/bf/UEFA_Champions_League_logo_2.svg/1200px-UEFA_Champions_League_logo_2.svg.png" className="w-3.5 h-3.5 object-contain" alt="UCL" />
                  UEFA Champions League
                  <ChevronDown className="w-2.5 h-2.5 text-slate-400" />
                </button>
                <button className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors text-slate-600 text-[10px] font-bold">
                  24/25 <ChevronDown className="w-2.5 h-2.5 text-slate-400" />
                </button>
              </div>

              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-slate-600 text-[11px] flex items-center gap-1">
                  Điểm Sofascore TB
                  <Info className="w-3 h-3 text-slate-300" />
                </h4>
                <span className={`font-black text-[13px] px-2.5 py-1 rounded-xl ${getRatingClass(parseFloat(player.ratingHistory.average || player.ratingHistory.averageRating || '0'))}`}>
                  {player.ratingHistory.average || player.ratingHistory.averageRating || 'N/A'}
                </span>
              </div>

              <div className="w-full h-[120px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={player.ratingHistory.history || []} margin={{ top: 8, right: 6, left: 6, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f4f8" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} dy={7} />
                    <YAxis hide domain={['dataMin - 0.5', 'dataMax + 0.5']} />
                    <RechartsTooltip content={({ active, payload }) => {
                      if (active && payload?.length) {
                        return (
                          <div className="bg-slate-900 text-white text-[11px] px-2 py-1.5 rounded-xl shadow-xl font-bold border border-white/10">
                            <span className="text-emerald-400">{payload[0].value}</span>
                          </div>
                        );
                      }
                      return null;
                    }} />
                    <Line type="monotone" dataKey="rating" stroke="#10b981" strokeWidth={2.5}
                          dot={{ r: 3, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 5, fill: '#10b981' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-3 p-2.5 bg-slate-50 rounded-xl text-[9.5px] text-slate-400 font-medium flex items-start gap-1.5 border border-slate-100 leading-relaxed">
                <Info className="w-3 h-3 shrink-0 mt-px text-slate-400" />
                Hiển thị điểm đánh giá trung bình trong giải đấu mùa giải này.
              </div>
            </div>
          )}

        </div>

      </main>
    </div>
  );
}
