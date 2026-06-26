"use client";

import { useState, useEffect } from 'react';
import { ArrowLeft, Star, Info, ChevronDown, Check, TrendingUp, Code } from 'lucide-react';
import Link from 'next/link';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, Cell,
  LineChart, Line, CartesianGrid
} from 'recharts';

export default function PlayerDetailClient({ playerId }: { playerId: string }) {
  const [player, setPlayer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlayer = async () => {
      try {
        const res = await fetch(`/api/player/${playerId}`);
        const data = await res.json();
        if (data.success) {
          setPlayer(data.data);
        } else {
          setError(data.error || "Không tìm thấy thông tin cầu thủ.");
        }
      } catch (err) {
        console.error("Lỗi tải cầu thủ", err);
        setError("Lỗi kết nối máy chủ API");
      } finally {
        setLoading(false);
      }
    };
    fetchPlayer();
  }, [playerId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f3f4f6]">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-green-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !player) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f3f4f6] text-center px-4">
        <h2 className="text-xl font-black text-slate-900 mb-3 uppercase tracking-wider">Lỗi Truy Xuất</h2>
        <p className="text-slate-500 mb-6">{error}</p>
        <Link href="/" className="px-6 py-2 bg-slate-900 text-white font-bold rounded">Quay lại Trang chủ</Link>
      </div>
    );
  }

  // Bar Chart colors mapping
  const getBarColor = (rating: number) => {
    if (rating >= 8.0) return '#0ea5e9'; // Blue for excellent
    if (rating >= 7.0) return '#22c55e'; // Green for good
    if (rating >= 6.5) return '#eab308'; // Yellow for average
    return '#ef4444'; // Red for poor
  };

  // Tactical pitch position mapping helper
  const getPitchPositionClass = (pos: string) => {
    const p = (pos || '').toUpperCase();
    if (p === 'GK') return 'bottom-2 left-1/2 -translate-x-1/2';
    if (p === 'CB') return 'bottom-8 left-1/2 -translate-x-1/2';
    if (p === 'LB' || p === 'LWB') return 'bottom-10 left-3';
    if (p === 'RB' || p === 'RWB') return 'bottom-10 right-3';
    if (p === 'DM') return 'bottom-16 left-1/2 -translate-x-1/2';
    if (p === 'CM') return 'top-[45%] left-1/2 -translate-x-1/2';
    if (p === 'LM') return 'top-[45%] left-3';
    if (p === 'RM') return 'top-[45%] right-3';
    if (p === 'AM') return 'top-[30%] left-1/2 -translate-x-1/2';
    if (p === 'LW') return 'top-8 left-3';
    if (p === 'RW') return 'top-8 right-3';
    if (p === 'CF' || p === 'ST' || p === 'SS') return 'top-2 left-1/2 -translate-x-1/2';
    return 'top-[45%] left-1/2 -translate-x-1/2'; // default center
  };

  return (
    <div className="w-full bg-[#f4f7fa] bg-[radial-gradient(#d3dfee_1.5px,transparent_1.5px)] [background-size:24px_24px] text-slate-900 pb-16 font-client-ui min-h-screen font-sans">
      {/* HEADER NAV */}
      <div className="bg-white border-b border-slate-200/80 sticky top-0 z-50 shadow-[0_2px_10px_rgba(15,23,42,0.02)]">
        <div className="max-w-[1160px] mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/trung-tam-du-lieu" className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold uppercase tracking-widest text-[11px]">
            <ArrowLeft className="w-4 h-4" /> Quay lại
          </Link>
          <span className="font-black text-slate-800 uppercase tracking-widest text-[12px]">Trung Tâm Dữ Liệu Cầu Thủ</span>
          <div className="w-16"></div>
        </div>
      </div>

      <main className="max-w-[1160px] mx-auto px-4 pt-6 grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
        
        {/* LEFT COLUMN: Main Info & Strengths */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* HEADER CARD - PREMIUM REDESIGN */}
          <div className="rounded-[28px] relative overflow-hidden shadow-[0_30px_80px_rgba(15,23,42,0.18)]">
            {/* Background gradient based on team/player */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#1a2a1a] via-[#0f3d2e] to-[#162b22]" />
            {/* Decorative circles */}
            <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-emerald-400/10 blur-3xl" />
            <div className="absolute -left-10 -bottom-10 w-60 h-60 rounded-full bg-white/5 blur-2xl" />
            {/* Dot pattern overlay */}
            <div className="absolute inset-0 opacity-[0.04]" style={{backgroundImage:'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize:'20px 20px'}} />

            <div className="relative z-10 p-6 md:p-8">
              <div className="flex flex-col md:flex-row items-start gap-6">

                {/* Avatar with glow ring */}
                <div className="relative shrink-0 mx-auto md:mx-0">
                  <div className="absolute inset-0 rounded-full bg-emerald-400/30 blur-xl scale-110" />
                  <div className="relative w-28 h-28 md:w-36 md:h-36 rounded-full border-[3px] border-white/30 overflow-hidden shadow-2xl ring-4 ring-emerald-500/20">
                    <img src={player.image} alt={player.name} className="w-full h-full object-cover" />
                  </div>
                  {/* Nationality flag badge */}
                  <div className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full border-2 border-[#0f3d2e] bg-white flex items-center justify-center shadow-lg overflow-hidden text-lg">
                    {player.personalInfo?.nationality?.name ? (
                      <span title={player.personalInfo.nationality.name}>
                        {/* show flag emoji based on nationality code */}
                        {(() => {
                          const n = player.personalInfo.nationality.name;
                          const flags: Record<string, string> = {
                            'Pháp':'🇫🇷','France':'🇫🇷','Anh':'🏴󠁧󠁢󠁥󠁮󠁧󠁿','England':'🏴󠁧󠁢󠁥󠁮󠁧󠁿',
                            'Đức':'🇩🇪','Germany':'🇩🇪','Tây Ban Nha':'🇪🇸','Spain':'🇪🇸',
                            'Ý':'🇮🇹','Italy':'🇮🇹','Argentina':'🇦🇷','Brazil':'🇧🇷',
                            'Bồ Đào Nha':'🇵🇹','Portugal':'🇵🇹','Netherlands':'🇳🇱','Hà Lan':'🇳🇱',
                            'Belgium':'🇧🇪','Bỉ':'🇧🇪','Croatia':'🇭🇷','Denmark':'🇩🇰',
                            'Đan Mạch':'🇩🇰','Norway':'🇳🇴','Na Uy':'🇳🇴','Sweden':'🇸🇪',
                            'Thụy Điển':'🇸🇪','Switzerland':'🇨🇭','Thụy Sĩ':'🇨🇭',
                            'Poland':'🇵🇱','Ba Lan':'🇵🇱','Uruguay':'🇺🇾','Colombia':'🇨🇴',
                            'Mexico':'🇲🇽','Japan':'🇯🇵','Nhật Bản':'🇯🇵','Hàn Quốc':'🇰🇷',
                            'Morocco':'🇲🇦','Senegal':'🇸🇳','Nigeria':'🇳🇬','Egypt':'🇪🇬',
                            'Scotland':'🏴󠁧󠁢󠁳󠁣󠁴󠁿','Wales':'🏴󠁧󠁢󠁷󠁬󠁳󠁿','Việt Nam':'🇻🇳',
                            'Mali':'🇲🇱','Ghana':'🇬🇭','Côte d\'Ivoire':'🇨🇮','Ivory Coast':'🇨🇮',
                            'USA':'🇺🇸','Mỹ':'🇺🇸','Australia':'🇦🇺','Úc':'🇦🇺',
                            'Ukraine':'🇺🇦','Russia':'🇷🇺','Nga':'🇷🇺',
                          };
                          return flags[n] || '🌐';
                        })()}
                      </span>
                    ) : <span>🌐</span>}
                  </div>
                </div>

                {/* Player Info */}
                <div className="flex-1 min-w-0 text-center md:text-left">
                  {/* Name + favourite */}
                  <div className="flex items-center gap-3 justify-center md:justify-start mb-1">
                    <h1 className="text-[26px] md:text-[34px] font-black text-white tracking-tight leading-none">{player.name}</h1>
                    <Star className="w-5 h-5 text-white/40 hover:text-yellow-400 cursor-pointer transition-all hover:scale-110 shrink-0" />
                  </div>

                  {/* Position + nationality */}
                  <div className="flex items-center gap-2 justify-center md:justify-start mb-5 flex-wrap">
                    <span className="bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                      {player.personalInfo.position || 'Cầu thủ'}
                    </span>
                    {player.personalInfo?.nationality?.name && (
                      <span className="text-white/50 text-[12px] font-medium">
                        {player.personalInfo.nationality.name}
                      </span>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2 justify-center md:justify-start mb-6">
                    <button className="bg-emerald-500 hover:bg-emerald-400 text-white text-[11px] font-bold uppercase tracking-widest px-5 py-2 rounded-full transition-all hover:scale-105 shadow-lg shadow-emerald-500/30 flex items-center gap-1.5">
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M8 7h12M8 12h12M8 17h12M3 7h.01M3 12h.01M3 17h.01"/></svg>
                      So sánh
                    </button>
                    <button className="bg-white/10 hover:bg-white/20 border border-white/20 text-white/80 hover:text-white text-[11px] font-bold uppercase tracking-widest px-5 py-2 rounded-full transition-all flex items-center gap-1.5">
                      <Star className="w-3 h-3" />
                      Yêu thích
                    </button>
                  </div>

                  {/* Club info row */}
                  <div className="inline-flex items-center gap-3 bg-white/8 border border-white/10 rounded-2xl px-4 py-3 backdrop-blur-sm">
                    {player.team.logo ? (
                      <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center overflow-hidden shrink-0 shadow-md">
                        <img src={player.team.logo} alt={player.team.name} className="w-8 h-8 object-contain" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white font-black text-sm shrink-0">{player.team.name?.[0] ?? '?'}</div>
                    )}
                    <div>
                      <p className="font-bold text-white text-[15px] leading-tight">{player.team.name}</p>
                      <p className="text-[11px] text-white/50 font-medium mt-0.5">Hợp đồng đến {player.team.contractUntil}</p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>


           {/* BASIC INFO STRIP */}
           <div className="bg-white border border-slate-200/80 rounded-[24px] shadow-[0_20px_50px_rgba(15,23,42,0.05)] overflow-hidden">
             <div className="grid grid-cols-3 md:grid-cols-6 divide-x divide-y md:divide-y-0 divide-slate-100">
               {/* Quốc tịch */}
               <div className="flex flex-col items-center justify-center gap-1.5 py-5 px-3 text-center">
                 <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center mb-0.5">
                   <svg className="w-4 h-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                 </div>
                 <p className="text-[9px] uppercase text-slate-400 font-bold tracking-widest">Quốc tịch</p>
                 <p className="font-black text-[13px] text-slate-800 leading-tight">{player.personalInfo.nationality.name || 'N/A'}</p>
               </div>
               {/* Ngày sinh / Tuổi */}
               <div className="flex flex-col items-center justify-center gap-1.5 py-5 px-3 text-center">
                 <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center mb-0.5">
                   <svg className="w-4 h-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                 </div>
                 <p className="text-[9px] uppercase text-slate-400 font-bold tracking-widest">Ngày sinh</p>
                 <p className="font-black text-[13px] text-slate-800 leading-tight">{player.personalInfo.birthDate}</p>
                 <p className="text-[11px] text-slate-400 font-semibold">{player.personalInfo.age} tuổi</p>
               </div>
               {/* Chiều cao */}
               <div className="flex flex-col items-center justify-center gap-1.5 py-5 px-3 text-center">
                 <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center mb-0.5">
                   <svg className="w-4 h-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 6H3"/><path d="M21 12H3"/><path d="M21 18H3"/></svg>
                 </div>
                 <p className="text-[9px] uppercase text-slate-400 font-bold tracking-widest">Chiều cao</p>
                 <p className="font-black text-[15px] text-slate-800 leading-tight">{player.personalInfo.height}<span className="text-[11px] font-bold text-slate-400 ml-0.5">cm</span></p>
               </div>
               {/* Chân thuận */}
               <div className="flex flex-col items-center justify-center gap-1.5 py-5 px-3 text-center">
                 <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center mb-0.5">
                   <svg className="w-4 h-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
                 </div>
                 <p className="text-[9px] uppercase text-slate-400 font-bold tracking-widest">Chân thuận</p>
                 <p className="font-black text-[14px] text-slate-800 leading-tight">
                   {player.personalInfo.preferredFoot === 'Right' ? 'Phải' :
                    player.personalInfo.preferredFoot === 'Left' ? 'Trái' :
                    player.personalInfo.preferredFoot === 'Both' ? 'Cả hai' :
                    player.personalInfo.preferredFoot || '--'}
                 </p>
               </div>
               {/* Vị trí */}
               <div className="flex flex-col items-center justify-center gap-1.5 py-5 px-3 text-center">
                 <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center mb-0.5">
                   <svg className="w-4 h-4 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="m4.93 4.93 4.24 4.24"/><path d="m14.83 9.17 4.24-4.24"/><path d="m14.83 14.83 4.24 4.24"/><path d="m9.17 14.83-4.24 4.24"/><circle cx="12" cy="12" r="4"/></svg>
                 </div>
                 <p className="text-[9px] uppercase text-slate-400 font-bold tracking-widest">Vị trí</p>
                 <p className="font-black text-[15px] text-emerald-600 leading-tight">{player.personalInfo.position || '--'}</p>
               </div>
               {/* Số áo */}
               <div className="flex flex-col items-center justify-center gap-1.5 py-5 px-3 text-center">
                 <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center mb-0.5">
                   <svg className="w-4 h-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.57a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.57a2 2 0 0 0-1.34-2.23z"/></svg>
                 </div>
                 <p className="text-[9px] uppercase text-slate-400 font-bold tracking-widest">Số áo</p>
                 <p className="font-black text-[22px] text-slate-800 leading-none">{player.personalInfo.shirtNumber || '--'}</p>
               </div>
             </div>
           </div>

           {/* PLAYER VALUE & STRENGTHS ROW */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             
             <div className="space-y-6">
               {/* Player Value */}
               <div className="bg-white border border-slate-200/80 rounded-[24px] p-5 flex items-center justify-between shadow-[0_20px_50px_rgba(15,23,42,0.05)]">
                 <div>
                   <p className="text-[10px] uppercase text-slate-400 font-bold tracking-widest mb-1">Giá trị cầu thủ</p>
                   <p className="text-2xl font-black text-amber-500">{player.personalInfo.playerValue}</p>
                 </div>
                 <div className="text-right">
                   <p className="text-[11px] font-bold text-slate-600 mb-2">Giá trị đang tăng hay giảm?</p>
                   <div className="flex gap-2 justify-end">
                     <button className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center hover:bg-green-50 hover:text-green-600 transition-colors">
                        <TrendingUp className="w-4 h-4" />
                     </button>
                     <button className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center hover:bg-red-50 hover:text-red-600 transition-colors">
                        <TrendingUp className="w-4 h-4 rotate-180" />
                     </button>
                   </div>
                 </div>
               </div>

              {/* Strengths & Weaknesses */}
              <div className="bg-white border border-slate-200/80 rounded-[24px] p-6 flex relative overflow-hidden h-[240px] shadow-[0_20px_50px_rgba(15,23,42,0.05)]">
                <div className="flex-1 z-10 relative">
                  <h3 className="text-green-600 font-black text-[13px] uppercase tracking-widest mb-3">Điểm mạnh</h3>
                  <ul className="space-y-1.5 mb-6">
                    {player.traits.strengths.map((s: string, i: number) => (
                      <li key={i} className="text-[14px] font-semibold text-slate-700">{s}</li>
                    ))}
                  </ul>

                  <h3 className="text-red-500 font-black text-[13px] uppercase tracking-widest mb-3">Điểm yếu</h3>
                  <ul className="space-y-1.5">
                    {player.traits.weaknesses.map((s: string, i: number) => (
                      <li key={i} className="text-[14px] font-semibold text-slate-700">{s}</li>
                    ))}
                  </ul>
                </div>
                
                {/* Mini Pitch */}
                <div className="absolute right-[-20px] top-4 bottom-4 w-[160px] border-2 border-white rounded-lg bg-green-100 overflow-hidden opacity-90 shadow-inner">
                   <div className="absolute top-1/2 left-0 w-full h-0 border-t-2 border-white"></div>
                   <div className="absolute top-1/2 left-1/2 w-12 h-12 rounded-full border-2 border-white -translate-x-1/2 -translate-y-1/2"></div>
                   <div className="absolute top-0 left-1/2 w-16 h-10 border-2 border-t-0 border-white -translate-x-1/2 rounded-b"></div>
                   <div className="absolute bottom-0 left-1/2 w-16 h-10 border-2 border-b-0 border-white -translate-x-1/2 rounded-t"></div>
                   
                   {/* Preferred Position Marker */}
                   <div className={`absolute bg-green-600 text-white text-[10px] font-black px-2 py-0.5 rounded shadow-md border border-white/20 z-10 ${getPitchPositionClass(player.traits.pitchPosition)}`}>
                     {player.traits.pitchPosition}
                   </div>
                </div>
              </div>
            </div>

            {/* SUMMARY BAR CHART */}
            <div className="bg-white border border-slate-200/80 rounded-[24px] p-6 flex flex-col shadow-[0_20px_50px_rgba(15,23,42,0.05)]">
               <div className="flex items-center justify-between mb-4">
                 <h3 className="font-bold text-slate-800 text-[14px] flex items-center gap-2">Tóm tắt phong độ (12 tháng qua) <Info className="w-4 h-4 text-slate-400"/></h3>
                 <span className="bg-green-600 text-white font-black text-[14px] px-2 py-0.5 rounded">{player.performance.overallRating}</span>
               </div>
               
               <div className="h-[180px] w-full mt-2">
                 <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={player.performance.monthlyForm} margin={{ top: 10, right: 0, left: 0, bottom: 0 }} barCategoryGap="20%">
                     <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dy={10} />
                     <RechartsTooltip cursor={{fill: '#f8fafc'}} content={({ active, payload }) => {
                       if (active && payload && payload.length) {
                         return (
                           <div className="bg-slate-900 text-white text-xs p-2 rounded shadow-lg font-bold">
                             {payload[0].payload.month}: {payload[0].value}
                           </div>
                         );
                       }
                       return null;
                     }} />
                     <Bar dataKey="rating" radius={[2, 2, 0, 0]}>
                       {player.performance.monthlyForm.map((entry: any, index: number) => (
                         <Cell key={`cell-${index}`} fill={getBarColor(entry.rating)} />
                       ))}
                     </Bar>
                   </BarChart>
                 </ResponsiveContainer>
               </div>

               <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-3">
                    <img src="https://upload.wikimedia.org/wikipedia/en/thumb/f/f2/Premier_League_Logo.svg/1200px-Premier_League_Logo.svg.png" className="w-6 h-6 object-contain" />
                    <div>
                      <p className="text-[12px] font-bold text-slate-800">Premier League</p>
                      <p className="text-[10px] font-medium text-slate-400">{player.performance.appearances} Trận đấu</p>
                    </div>
                  </div>
                  <span className="bg-green-600 text-white font-black text-[13px] px-2 py-0.5 rounded">{player.performance.leagueRating}</span>
               </div>
            </div>

          </div>

          {/* MATCHES LIST */}
          <div className="bg-white border border-slate-200/80 rounded-[24px] overflow-hidden shadow-[0_20px_50px_rgba(15,23,42,0.05)]">
             <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-800">Trận đấu gần đây</h3>
             </div>
             
             <div className="divide-y divide-slate-100">
                {player.matches.map((match: any) => (
                   <div key={match.id} className="p-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-2 mb-3 px-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{match.tournament}</span>
                      </div>
                      
                      <div className="flex items-center justify-between px-2">
                         <div className="text-[10px] text-slate-400 font-bold text-center w-16 leading-tight">
                           {match.date} <br/> {match.status}
                         </div>
                         
                         <div className="flex-1 flex items-center justify-center gap-4">
                            <div className="flex items-center gap-3 w-32 justify-end">
                              <span className="text-[13px] font-bold text-slate-700">{match.team1.name}</span>
                              {match.team1.logo ? (
                                <img src={match.team1.logo} alt={match.team1.name} className="w-5 h-5 object-contain" />
                              ) : (
                                <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-black text-[9px]">{match.team1.name?.[0] ?? '?'}</div>
                              )}
                            </div>
                            
                            <div className="text-[18px] font-black text-slate-900 w-12 text-center">
                              {match.score1} - {match.score2}
                           </div>
                           
                           <div className="flex items-center gap-3 w-32 justify-start">
                              {match.team2.logo ? (
                                <img src={match.team2.logo} alt={match.team2.name} className="w-5 h-5 object-contain" />
                              ) : (
                                <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-black text-[9px]">{match.team2.name?.[0] ?? '?'}</div>
                              )}
                              <span className="text-[13px] font-bold text-slate-700">{match.team2.name}</span>
                            </div>
                         </div>
                         
                         <div className="w-12 text-right">
                           <span className="bg-green-500 text-white font-black text-[12px] px-2 py-1 rounded shadow-sm">{match.playerRating}</span>
                         </div>
                      </div>
                   </div>
                ))}
             </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Attributes & Average Rating */}
        <div className="space-y-6 font-sans">
           
           {/* RADAR CHART - ATTRIBUTE OVERVIEW */}
           <div className="bg-white border border-slate-200/80 rounded-[24px] p-6 flex flex-col items-center relative shadow-[0_20px_50px_rgba(15,23,42,0.05)]">
              <div className="absolute top-4 right-4"><Info className="w-4 h-4 text-slate-400" /></div>
              <h3 className="font-bold text-slate-800 mb-6">Tổng quan chỉ số</h3>
              
              <div className="w-full h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={player.attributes}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 'bold' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar name="Cầu thủ" dataKey="A" stroke="#22c55e" strokeWidth={2} fill="#22c55e" fillOpacity={0.2} />
                    <RechartsTooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* Small timeline labels like the screenshot */}
              <div className="w-full flex justify-between text-[10px] font-bold text-slate-400 mt-2 px-4 border-t border-slate-100 pt-4">
                 <span>Th12 2021</span>
                 <span>Th12 2022</span>
                 <span>Th12 2023</span>
                 <span className="text-green-600 flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500"></div> Th12 2024</span>
              </div>
           </div>

           {/* SEARCH COMPARE */}
           <div className="bg-white border border-slate-200/80 rounded-[24px] p-4 shadow-[0_20px_50px_rgba(15,23,42,0.05)]">
              <div className="relative">
                 <input type="text" placeholder="Tìm kiếm để so sánh cầu thủ" className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[13px] font-medium outline-none focus:border-green-500 transition-colors" />
                 <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 bg-slate-200 rounded text-slate-400 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>
                 </div>
              </div>
              <p className="text-[10px] text-slate-400 mt-3 flex gap-1.5 items-start">
                 <Info className="w-3 h-3 shrink-0 mt-0.5" />
                 Nhấp vào biểu đồ để xem giá trị trung bình cho vị trí này
              </p>
           </div>

           {/* AVERAGE RATING LINE CHART */}
           {player.ratingHistory && (
             <div className="bg-white border border-slate-200/80 rounded-[24px] p-6 flex flex-col relative shadow-[0_20px_50px_rgba(15,23,42,0.05)]">
                <h3 className="font-bold text-slate-800 text-center mb-6">Thống kê cầu thủ</h3>
                
                <div className="flex items-center justify-center gap-4 mb-8">
                   <div className="flex items-center gap-2 cursor-pointer group">
                     <img src="https://upload.wikimedia.org/wikipedia/en/thumb/b/bf/UEFA_Champions_League_logo_2.svg/1200px-UEFA_Champions_League_logo_2.svg.png" className="w-4 h-4 object-contain opacity-70 group-hover:opacity-100" />
                     <span className="text-[12px] font-bold text-slate-600 group-hover:text-slate-900">UEFA Champions League <ChevronDown className="w-3 h-3 inline" /></span>
                   </div>
                   <div className="flex items-center gap-2 cursor-pointer">
                     <span className="text-[12px] font-bold text-slate-600">24/25 <ChevronDown className="w-3 h-3 inline" /></span>
                   </div>
                </div>

                <div className="flex items-center justify-between mb-4">
                   <h4 className="font-bold text-slate-800 text-[13px] flex items-center gap-1.5">Điểm Sofascore trung bình <Info className="w-3.5 h-3.5 text-slate-400"/></h4>
                   <span className="bg-green-600 text-white font-black text-[14px] px-2 py-0.5 rounded">{player.ratingHistory.average || player.ratingHistory.averageRating || 'N/A'}</span>
                </div>

                <div className="w-full h-[140px] relative">
                   <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={player.ratingHistory.history || []} margin={{ top: 20, right: 10, left: 10, bottom: 0 }}>
                         <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                         <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} dy={10} />
                         <YAxis hide domain={['dataMin - 1', 'dataMax + 1']} />
                         <RechartsTooltip content={({ active, payload }) => {
                           if (active && payload && payload.length) {
                             return (
                               <div className="bg-slate-900 text-white text-xs px-2 py-1 rounded shadow-lg font-bold">
                                 {payload[0].value}
                               </div>
                             );
                           }
                           return null;
                         }} />
                         <Line type="monotone" dataKey="rating" stroke="#22c55e" strokeWidth={3} dot={{ r: 4, fill: '#22c55e', stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                      </LineChart>
                   </ResponsiveContainer>
                </div>

                <div className="mt-4 p-3 bg-slate-50 rounded text-[10px] text-slate-500 font-medium flex items-start gap-2 border border-slate-100">
                   <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                   Hiển thị điểm đánh giá trung bình của cầu thủ trong giải đấu mùa giải này.
                </div>
             </div>
           )}

        </div>

      </main>
    </div>
  );
}
