"use client";

import { useState, useEffect } from 'react';
import { Calendar, AlertCircle, ChevronRight, Search, Trophy, Bot, Activity, BarChart3, TrendingUp, Cpu, Filter } from 'lucide-react';
import Link from 'next/link';
import { createArticleUrl } from '@/lib/utils';

// ... (API types and fetching logic remains the same, I will recreate the whole file but preserve the logic)
export default function PredictionClientPage() {
  const [fixtures, setFixtures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Grouping & Filtering State
  const [groupedFixtures, setGroupedFixtures] = useState<Record<string, any[]>>({});
  const [filterType, setFilterType] = useState<'all' | 'upcoming' | 'finished'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');

  // New Tab State for Sports
  const [activeSport, setActiveSport] = useState<'bongda' | 'vothuat'>('bongda');

  useEffect(() => {
    const fetchFixtures = async () => {
      try {
        const res = await fetch('/api/fixtures');
        const data = await res.json();
        
        if (data.success) {
          // Add a dummy sport type for UI purposes if missing
          const withSport = data.data.map((f: any) => ({
            ...f,
            sportType: f.category?.toLowerCase().includes('ufc') || f.category?.toLowerCase().includes('championship') ? 'vothuat' : 'bongda'
          }));
          setFixtures(withSport);
        } else {
          setError(data.error);
        }
      } catch (err) {
        console.error("Lỗi khi fetch lịch thi đấu", err);
        setError("Lỗi kết nối máy chủ API lịch thi đấu");
      } finally {
        setLoading(false);
      }
    };
    fetchFixtures();
  }, []);

  useEffect(() => {
    // 1. Filter by Sport
    let filtered = fixtures.filter(f => f.sportType === activeSport);

    // 2. Filter by Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(f => 
        f.team1.name.toLowerCase().includes(q) || 
        f.team2.name.toLowerCase().includes(q) ||
        f.category?.toLowerCase().includes(q)
      );
    }

    // 3. Filter by Status
    if (filterType === 'upcoming') {
      filtered = filtered.filter(f => !f.status || f.status.toLowerCase().includes('upcoming') || f.status === 'Chưa diễn ra');
    } else if (filterType === 'finished') {
      filtered = filtered.filter(f => f.status && !f.status.toLowerCase().includes('upcoming') && f.status !== 'Chưa diễn ra');
    }

    // 4. Filter by Category
    if (selectedCategory !== 'all') {
      if (selectedCategory === 'FIFA World Cup 2026') {
        filtered = filtered.filter(f => f.category?.startsWith('FIFA World Cup 2026'));
        if (selectedGroup !== 'all') {
          filtered = filtered.filter(f => f.category === `FIFA World Cup 2026 - ${selectedGroup}`);
        }
      } else {
        filtered = filtered.filter(f => f.category === selectedCategory);
      }
    }

    // Group by Date (ngày thi đấu)
    const grouped = filtered.reduce((acc, curr) => {
      const dateKey = curr.matchDate || 'Chưa xác định';
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(curr);
      return acc;
    }, {} as Record<string, any[]>);

    // Sort dates prioritizing upcoming matches
    const sortedGrouped: Record<string, any[]> = {};
    
    // Sort all date keys chronologically first
    const allDates = Object.keys(grouped).sort();
    
    // Separate into upcoming dates and past dates
    const upcomingDates = allDates.filter(date => grouped[date].some(match => match.status === 'Chưa đá'));
    const pastDates = allDates.filter(date => !grouped[date].some(match => match.status === 'Chưa đá'));

    // Past dates usually look better reverse chronological (latest past matches first)
    pastDates.reverse();

    // Reconstruct the object: Upcoming first, then Past
    [...upcomingDates, ...pastDates].forEach(key => {
      sortedGrouped[key] = grouped[key];
    });

    setGroupedFixtures(sortedGrouped);
  }, [fixtures, activeSport, filterType, searchQuery, selectedCategory, selectedGroup]);

  const rawCategories = Array.from(new Set(fixtures.filter(f => f.sportType === activeSport).map(f => f.category || 'Giải đấu khác')));
  const categories = Array.from(new Set(rawCategories.map(cat => {
    if (cat.startsWith('FIFA World Cup 2026')) {
      return 'FIFA World Cup 2026';
    }
    return cat;
  })));

  return (
    <div className="w-full font-client-ui bg-[#f3f4f6]">
      {/* HEADER HERO SECTION */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-[1160px] mx-auto px-4 py-8 md:py-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-green-600 text-white px-2 py-0.5 rounded text-[10px] font-black tracking-widest flex items-center gap-1.5 uppercase shadow-sm">
                <Cpu className="w-3 h-3" /> ANV AI Center
              </span>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Hệ thống phân tích & nhận định</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase flex items-center gap-3">
              Trung Tâm <span className="text-green-600">Dữ Liệu Thể Thao</span>
            </h1>
          </div>
          <div className="shrink-0 flex items-center gap-2 bg-slate-50 border border-slate-200 px-4 py-2 rounded-lg shadow-sm">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
            </span>
            <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest">Live Data Feed</span>
          </div>
        </div>
      </div>

      <div className="max-w-[1160px] mx-auto px-4 py-8 flex flex-col lg:flex-row gap-8">
        
        {/* MAIN CONTENT AREA */}
        <div className="flex-1 min-w-0">
          
          {/* SPORTS TABS */}
          <div className="flex items-center gap-3 mb-8">
            <button 
              onClick={() => setActiveSport('bongda')}
              className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-black uppercase tracking-widest text-[12px] transition-all duration-300 shadow-sm
                ${activeSport === 'bongda' 
                  ? 'bg-slate-900 text-white border border-slate-900 scale-[1.02]' 
                  : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50 hover:text-slate-700'}`}
            >
              <Trophy className="w-4 h-4" /> Bóng Đá
            </button>
            <button 
              onClick={() => setActiveSport('vothuat')}
              className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-black uppercase tracking-widest text-[12px] transition-all duration-300 shadow-sm
                ${activeSport === 'vothuat' 
                  ? 'bg-slate-900 text-white border border-slate-900 scale-[1.02]' 
                  : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50 hover:text-slate-700'}`}
            >
              <Activity className="w-4 h-4" /> Võ Thuật
            </button>
          </div>

          {/* FILTERS & SEARCH */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 mb-8 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center relative z-10">
            <div className="flex items-center w-full md:w-auto flex-1 gap-4">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Tìm kiếm đội bóng, giải đấu..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all font-medium"
                />
              </div>
              <div className="relative w-full max-w-[200px] hidden md:block">
                <Trophy className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select 
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setSelectedGroup('all');
                  }}
                  className="w-full pl-9 pr-8 py-2 border border-slate-200 rounded text-sm text-slate-700 appearance-none bg-white focus:outline-none focus:border-green-500 font-bold"
                >
                  <option value="all">Tất cả các giải ({categories.length})</option>
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
                <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rotate-90 pointer-events-none" />
              </div>

              {selectedCategory === 'FIFA World Cup 2026' && (
                <div className="relative w-full max-w-[180px] hidden md:block">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select 
                    value={selectedGroup}
                    onChange={(e) => setSelectedGroup(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 border border-slate-200 rounded text-sm text-slate-700 appearance-none bg-white focus:outline-none focus:border-green-500 font-bold"
                  >
                    <option value="all">Tất cả các bảng</option>
                    <option value="Group A">Bảng A</option>
                    <option value="Group B">Bảng B</option>
                    <option value="Group C">Bảng C</option>
                    <option value="Group D">Bảng D</option>
                    <option value="Group E">Bảng E</option>
                    <option value="Group F">Bảng F</option>
                    <option value="Group G">Bảng G</option>
                    <option value="Group H">Bảng H</option>
                    <option value="Group I">Bảng I</option>
                    <option value="Group J">Bảng J</option>
                    <option value="Group K">Bảng K</option>
                    <option value="Group L">Bảng L</option>
                  </select>
                  <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rotate-90 pointer-events-none" />
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <Filter className="w-4 h-4 text-slate-400 hidden md:block" />
              <span className="text-slate-400 text-xs font-bold uppercase mr-2 hidden md:block">Lọc:</span>
              <div className="flex bg-slate-100 p-1 rounded w-full md:w-auto">
                <button 
                  onClick={() => setFilterType('all')}
                  className={`flex-1 md:flex-none px-4 py-1.5 rounded text-[11px] font-black uppercase tracking-wider transition-colors ${filterType === 'all' ? 'bg-white text-green-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >Tất cả</button>
                <button 
                  onClick={() => setFilterType('upcoming')}
                  className={`flex-1 md:flex-none px-4 py-1.5 rounded text-[11px] font-black uppercase tracking-wider transition-colors ${filterType === 'upcoming' ? 'bg-white text-green-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >Chưa đá</button>
                <button 
                  onClick={() => setFilterType('finished')}
                  className={`flex-1 md:flex-none px-4 py-1.5 rounded text-[11px] font-black uppercase tracking-wider transition-colors ${filterType === 'finished' ? 'bg-white text-green-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >Đã kết thúc</button>
              </div>
            </div>
          </div>

          {/* LIST */}
          {loading ? (
             <div className="bg-white border border-slate-200 rounded-xl p-16 flex flex-col items-center justify-center min-h-[400px]">
               <div className="w-10 h-10 border-4 border-slate-200 border-t-green-500 rounded-full animate-spin mb-4"></div>
               <p className="text-slate-500 font-bold uppercase tracking-wider text-[12px]">Đang đồng bộ dữ liệu...</p>
             </div>
          ) : error ? (
            <div className="bg-white border border-slate-200 rounded-xl p-16 flex flex-col items-center justify-center min-h-[400px]">
              <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
              <p className="text-slate-800 font-black text-lg mb-2">Lỗi truy xuất</p>
              <p className="text-slate-500 font-medium">{error}</p>
            </div>
          ) : Object.keys(groupedFixtures).length === 0 ? (
             <div className="bg-white border border-slate-200 rounded-xl p-16 flex flex-col items-center justify-center min-h-[400px]">
               <Trophy className="w-12 h-12 text-slate-300 mb-4" />
               <p className="text-slate-600 font-bold text-[14px]">Không tìm thấy trận đấu nào phù hợp với bộ lọc.</p>
             </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedFixtures).map(([dateStr, matches]) => {
                const dateObj = new Date(dateStr);
                const formattedDate = isNaN(dateObj.getTime()) ? dateStr : dateObj.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });

                return (
                <div key={dateStr} className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                  
                  {/* Date Header */}
                  <div className="bg-slate-900 border-b-4 border-green-600 px-5 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-green-500" />
                      <h3 className="text-white font-black uppercase tracking-wider text-[14px] md:text-[15px]">{formattedDate}</h3>
                    </div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest bg-slate-800 px-3 py-1 rounded">{matches.length} trận</span>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {matches.map((match: any) => {
                       const isFinished = match.status === 'Kết thúc';
                       const matchTimeStr = match.matchTime || '00:00';
                       const score1Num = isFinished && match.score1 !== null ? parseInt(match.score1) : null;
                       const score2Num = isFinished && match.score2 !== null ? parseInt(match.score2) : null;

                       return (
                          <div key={match.id} className="flex hover:bg-slate-50 transition-colors group">
                            
                            {/* Left Col: Time & Status */}
                            <div className="w-[80px] md:w-[100px] shrink-0 border-r border-slate-100 flex flex-col items-center justify-center py-4 px-2 gap-1 bg-slate-50/50">
                              <span className={`text-[12px] md:text-[13px] font-black uppercase tracking-widest ${isFinished ? 'text-slate-400' : 'text-slate-900'}`}>
                                {isFinished ? 'KT' : matchTimeStr}
                              </span>
                              <span className="text-[9px] md:text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded text-center leading-tight truncate w-full" title={match.category}>
                                {match.category.replace('FIFA World Cup 2026 - ', '')}
                              </span>
                              {match.ground && match.ground !== "Chưa xác định" && (
                                <span className="text-[8px] md:text-[9px] font-medium text-slate-500 text-center leading-tight mt-0.5 px-1 truncate w-full" title={match.ground}>
                                  🏟 {match.ground}
                                </span>
                              )}
                            </div>

                            {/* Middle Col: PERFECT HORIZONTAL ALIGNMENT */}
                            <div className="flex-1 flex items-center justify-center py-3 px-2 md:px-4">
                              <div className="w-full max-w-[500px] flex items-center justify-center relative">
                                
                                {/* Team 1 */}
                                <div className="flex-1 flex items-center justify-end gap-3 min-w-0 pr-4">
                                  <span className={`text-[13px] md:text-[15px] truncate text-right ${isFinished && score1Num !== null && score2Num !== null && score1Num > score2Num ? 'font-black text-slate-900' : 'font-bold text-slate-700'}`}>
                                    {match.team1.name}
                                  </span>
                                  <img src={match.team1.logo} alt={match.team1.name} className="w-7 h-7 object-contain shrink-0" />
                                </div>
                                
                                {/* Score / VS */}
                                <div className="w-[80px] shrink-0 flex items-center justify-center border-x border-slate-100/50 bg-slate-50 py-2 rounded">
                                  {score1Num !== null && score2Num !== null ? (
                                    <div className="flex items-center gap-2">
                                      <span className="text-[20px] font-black text-slate-900">{match.score1}</span>
                                      <span className="text-[13px] font-bold text-slate-300">-</span>
                                      <span className="text-[20px] font-black text-slate-900">{match.score2}</span>
                                    </div>
                                  ) : (
                                    <span className="text-[13px] font-black text-slate-300 italic">VS</span>
                                  )}
                                </div>

                                {/* Team 2 */}
                                <div className="flex-1 flex items-center justify-start gap-3 min-w-0 pl-4">
                                  <img src={match.team2.logo} alt={match.team2.name} className="w-7 h-7 object-contain shrink-0" />
                                  <span className={`text-[13px] md:text-[15px] truncate text-left ${isFinished && score1Num !== null && score2Num !== null && score2Num > score1Num ? 'font-black text-slate-900' : 'font-bold text-slate-700'}`}>
                                    {match.team2.name}
                                  </span>
                                </div>

                              </div>
                            </div>

                            {/* Right Col: Clean Premium Button */}
                            <div className="w-[80px] md:w-[110px] shrink-0 border-l border-slate-100 flex items-center justify-center px-3 py-3">
                              <Link 
                                href={`/du-doan/${match.id}`} 
                                className="w-full flex flex-col items-center justify-center py-2 px-1 rounded-md border border-slate-200 text-slate-500 hover:border-green-600 hover:text-green-600 hover:bg-green-50 transition-all duration-200 group/btn bg-white"
                              >
                                <Bot className="w-4 h-4 mb-1 group-hover/btn:scale-110 transition-transform" />
                                <span className="text-[9px] font-black uppercase tracking-widest text-center leading-tight">Phân<br/>Tích</span>
                              </Link>
                            </div>

                          </div>
                       )
                    })}
                  </div>
                </div>
              )})}
            </div>
          )}
        </div>
        
        {/* RIGHT SIDEBAR (Widgets) */}
        <div className="w-full lg:w-[320px] shrink-0 space-y-6">
          
          {/* AI Banner Widget */}
          <div className="bg-slate-900 rounded-xl p-6 relative overflow-hidden shadow-lg border border-slate-800">
            <div className="absolute -right-10 -bottom-10 opacity-10">
              <Activity className="w-48 h-48 text-white" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4 bg-white/10 w-max px-3 py-1.5 rounded text-green-400">
                <Bot className="w-4 h-4" />
                <span className="text-[11px] font-black uppercase tracking-widest">Siêu Máy Tính AI</span>
              </div>
              <p className="text-[13px] text-slate-300 font-medium leading-relaxed mb-6">
                Hệ thống tự động tham chiếu dữ liệu từ TheSportsDB, kết hợp với các thuật toán học máy nâng cao để phân tích phong độ đối đầu và dự đoán xác suất trận đấu.
              </p>
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest border-t border-white/10 pt-4 text-slate-400">
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> Real-time</span>
                <span className="text-green-500/80 border border-green-500/30 px-2 py-0.5 rounded">API Official</span>
              </div>
            </div>
          </div>

          {/* Warning Widget */}
          <div className="bg-yellow-50 rounded-xl p-5 border border-yellow-200 shadow-sm relative overflow-hidden">
            <div className="flex items-center gap-2 mb-3 text-yellow-800">
              <AlertCircle className="w-4 h-4" />
              <span className="text-[12px] font-black uppercase tracking-widest">Khuyến Cáo Vận Hành</span>
            </div>
            <p className="text-[12px] text-yellow-700/80 font-medium leading-relaxed">
              Các phân tích và dự đoán từ Siêu máy tính AI chỉ mang tính chất tham khảo tin tức thể thao giải trí. ANVSport tuyệt đối không cung cấp dịch vụ hoặc khuyến khích người dùng tham gia cá cược dưới mọi hình thức.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
