"use client";

import { useState, useEffect } from 'react';
import { ArrowLeft, Star, Info, ChevronDown, Check, TrendingUp } from 'lucide-react';
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

  return (
    <div className="w-full bg-[#f3f4f6] min-h-screen pb-12 font-client-ui">
      {/* HEADER NAV */}
      <div className="bg-white border-b border-slate-200 px-4 md:px-8 py-3 flex items-center justify-between sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold uppercase tracking-widest text-[11px]">
          <ArrowLeft className="w-4 h-4" /> Quay lại
        </Link>
        <span className="font-black text-slate-800 uppercase tracking-widest text-[12px]">Trung Tâm Dữ Liệu Cầu Thủ</span>
        <div className="w-16"></div>
      </div>

      <main className="max-w-[1200px] mx-auto px-4 md:px-6 pt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: Main Info & Strengths */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* HEADER CARD - SOFASCORE STYLE */}
          <div className="bg-gradient-to-br from-[#8a5a5a] to-[#593939] rounded-2xl p-6 text-white relative overflow-hidden shadow-md">
             {/* Background decorative elements */}
             <div className="absolute right-0 top-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
             
             <div className="flex flex-col md:flex-row items-center md:items-start gap-6 relative z-10">
               <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white overflow-hidden bg-white shrink-0">
                 <img src={player.image} alt={player.name} className="w-full h-full object-cover" />
               </div>
               
               <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left w-full">
                 <div className="flex items-center gap-3 mb-2">
                   <h1 className="text-2xl md:text-3xl font-black">{player.name}</h1>
                   <Star className="w-5 h-5 text-white/70" />
                 </div>
                 
                 <div className="flex gap-2 mb-6">
                   <button className="bg-white/20 hover:bg-white/30 text-[11px] font-bold uppercase tracking-widest px-4 py-1.5 rounded transition-colors flex items-center gap-2">
                     COMPARE <ArrowLeft className="w-3 h-3 rotate-180 inline -ml-1"/><ArrowLeft className="w-3 h-3 inline -ml-2"/>
                   </button>
                 </div>
                 
                 {/* Club info */}
                 <div className="flex items-center gap-3 mb-4 w-full justify-center md:justify-start">
                   <img src={player.team.logo} className="w-8 h-8 object-contain bg-white rounded-full p-0.5" />
                   <div>
                     <p className="font-bold text-[15px] leading-tight">{player.team.name}</p>
                     <p className="text-[11px] text-white/70 font-medium tracking-wide">Contract until {player.team.contractUntil}</p>
                   </div>
                 </div>
               </div>

               {/* Right side Add widget */}
               <div className="hidden md:flex flex-col items-end pt-2">
                 <button className="flex items-center gap-2 text-white/90 hover:text-white font-bold text-[12px]">
                   Add {player.name}'s info to your website! <ChevronDown className="w-4 h-4" />
                 </button>
               </div>
             </div>
          </div>

          {/* BASIC INFO STRIP */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-wrap gap-8 justify-between md:justify-start">
             <div>
               <p className="text-[10px] uppercase text-slate-400 font-bold tracking-widest mb-1">Nationality</p>
               <p className="font-bold flex items-center gap-1.5"><span className="text-slate-400">+</span> {player.personalInfo.nationality.name}</p>
             </div>
             <div>
               <p className="text-[10px] uppercase text-slate-400 font-bold tracking-widest mb-1">{player.personalInfo.birthDate}</p>
               <p className="font-bold">{player.personalInfo.age} yrs</p>
             </div>
             <div>
               <p className="text-[10px] uppercase text-slate-400 font-bold tracking-widest mb-1">Height</p>
               <p className="font-bold">{player.personalInfo.height} cm</p>
             </div>
             <div>
               <p className="text-[10px] uppercase text-slate-400 font-bold tracking-widest mb-1">Preferred Foot</p>
               <p className="font-bold">{player.personalInfo.preferredFoot}</p>
             </div>
             <div>
               <p className="text-[10px] uppercase text-slate-400 font-bold tracking-widest mb-1">Position</p>
               <p className="font-bold text-lg">{player.personalInfo.position}</p>
             </div>
             <div>
               <p className="text-[10px] uppercase text-slate-400 font-bold tracking-widest mb-1">Shirt Number</p>
               <p className="font-black text-xl">{player.personalInfo.shirtNumber}</p>
             </div>
          </div>

          {/* PLAYER VALUE & STRENGTHS ROW */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="space-y-6">
              {/* Player Value */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase text-slate-400 font-bold tracking-widest mb-1">Player Value</p>
                  <p className="text-2xl font-black text-amber-500">{player.personalInfo.playerValue}</p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] font-bold text-slate-600 mb-2">Is player value higher or lower?</p>
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
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex relative overflow-hidden h-[240px]">
                <div className="flex-1 z-10 relative">
                  <h3 className="text-green-600 font-black text-[13px] uppercase tracking-widest mb-3">Strengths</h3>
                  <ul className="space-y-1.5 mb-6">
                    {player.traits.strengths.map((s: string, i: number) => (
                      <li key={i} className="text-[14px] font-semibold text-slate-700">{s}</li>
                    ))}
                  </ul>

                  <h3 className="text-red-500 font-black text-[13px] uppercase tracking-widest mb-3">Weaknesses</h3>
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
                   <div className="absolute top-1/4 right-4 bg-green-500 text-white text-[10px] font-black px-2 py-0.5 rounded shadow-sm border border-green-600 z-10">
                     {player.traits.pitchPosition}
                   </div>
                </div>
              </div>
            </div>

            {/* SUMMARY BAR CHART */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col">
               <div className="flex items-center justify-between mb-4">
                 <h3 className="font-bold text-slate-800 text-[14px] flex items-center gap-2">Summary (last 12 months) <Info className="w-4 h-4 text-slate-400"/></h3>
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
                      <p className="text-[10px] font-medium text-slate-400">{player.performance.appearances} Appearances</p>
                    </div>
                  </div>
                  <span className="bg-green-600 text-white font-black text-[13px] px-2 py-0.5 rounded">{player.performance.leagueRating}</span>
               </div>
            </div>

          </div>

          {/* MATCHES LIST */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
             <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-800">Matches</h3>
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
                              <img src={match.team1.logo} className="w-5 h-5 object-contain" />
                            </div>
                            
                            <div className="text-[18px] font-black text-slate-900 w-12 text-center">
                              {match.score1} - {match.score2}
                           </div>
                           
                           <div className="flex items-center gap-3 w-32 justify-start">
                              <img src={match.team2.logo} className="w-5 h-5 object-contain" />
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
        <div className="space-y-6">
           
           {/* RADAR CHART - ATTRIBUTE OVERVIEW */}
           <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col items-center relative">
              <div className="absolute top-4 right-4"><Info className="w-4 h-4 text-slate-400" /></div>
              <h3 className="font-bold text-slate-800 mb-6">Attribute Overview</h3>
              
              <div className="w-full h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={player.attributes}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 'bold' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar name="Player" dataKey="A" stroke="#22c55e" strokeWidth={2} fill="#22c55e" fillOpacity={0.2} />
                    <RechartsTooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* Small timeline labels like the screenshot */}
              <div className="w-full flex justify-between text-[10px] font-bold text-slate-400 mt-2 px-4 border-t border-slate-100 pt-4">
                 <span>Dec 2021</span>
                 <span>Dec 2022</span>
                 <span>Dec 2023</span>
                 <span className="text-green-600 flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500"></div> Dec 2024</span>
              </div>
           </div>

           {/* SEARCH COMPARE */}
           <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <div className="relative">
                 <input type="text" placeholder="Search to compare players" className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[13px] font-medium outline-none focus:border-green-500 transition-colors" />
                 <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 bg-slate-200 rounded text-slate-400 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>
                 </div>
              </div>
              <p className="text-[10px] text-slate-400 mt-3 flex gap-1.5 items-start">
                 <Info className="w-3 h-3 shrink-0 mt-0.5" />
                 Click on the graph to see the average values for this position
              </p>
           </div>

           {/* AVERAGE RATING LINE CHART */}
           <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col relative">
              <h3 className="font-bold text-slate-800 text-center mb-6">Player statistics</h3>
              
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
                 <h4 className="font-bold text-slate-800 text-[13px] flex items-center gap-1.5">Average Sofascore Rating <Info className="w-3.5 h-3.5 text-slate-400"/></h4>
                 <span className="bg-green-600 text-white font-black text-[14px] px-2 py-0.5 rounded">{player.ratingHistory.average}</span>
              </div>

              <div className="w-full h-[140px] relative">
                 <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={player.ratingHistory.history} margin={{ top: 20, right: 10, left: 10, bottom: 0 }}>
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
                 Displaying average player rating for this season's competition.
              </div>
           </div>

        </div>

      </main>
    </div>
  );
}
