'use client';

import { useState } from 'react';
import { Search, Shield, ArrowLeft, Database, Trophy, Activity, AlertCircle, TrendingUp, Filter, Users, ChevronRight, CheckCircle2 } from 'lucide-react';
import { PlayerCard } from '@/components/domain/data-center/PlayerCard';
import Link from 'next/link';

interface DataCenterClientProps {
  players: any[];
  clubs: any[];
}

export function DataCenterClient({ players, clubs }: DataCenterClientProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'players' | 'clubs'>('players');

  const filteredPlayers = players.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredClubs = clubs.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="w-full font-client-ui bg-[#f3f4f6] min-h-screen pb-12">
      {/* HEADER HERO SECTION */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-[1160px] mx-auto px-4 py-8 md:py-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-green-600 text-white px-2 py-0.5 rounded text-[10px] font-black tracking-widest flex items-center gap-1.5 uppercase shadow-sm">
                <Database className="w-3 h-3" /> Hệ thống phân tích
              </span>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Cập nhật 24/7</span>
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
          
          {/* TABS */}
          <div className="flex flex-wrap items-center gap-3 mb-8">
            <button 
              onClick={() => setActiveTab('players')}
              className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-black uppercase tracking-widest text-[12px] transition-all duration-300 shadow-sm
                ${activeTab === 'players' 
                  ? 'bg-slate-900 text-white border border-slate-900 scale-[1.02]' 
                  : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50 hover:text-slate-700'}`}
            >
              <Users className="w-4 h-4" /> Cầu Thủ ({players.length})
            </button>
            <button 
              onClick={() => setActiveTab('clubs')}
              className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-black uppercase tracking-widest text-[12px] transition-all duration-300 shadow-sm
                ${activeTab === 'clubs' 
                  ? 'bg-slate-900 text-white border border-slate-900 scale-[1.02]' 
                  : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50 hover:text-slate-700'}`}
            >
              <Shield className="w-4 h-4" /> Câu Lạc Bộ ({clubs.length})
            </button>
          </div>

          {/* FILTERS & SEARCH */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 mb-8 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center relative z-10">
            <div className="flex items-center w-full gap-4">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder={activeTab === 'players' ? "Tìm kiếm tên cầu thủ..." : "Tìm kiếm câu lạc bộ..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all font-medium"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
              <Filter className="w-4 h-4 text-slate-400 hidden md:block" />
              <span className="text-slate-400 text-xs font-bold uppercase mr-2 hidden md:block">Lọc:</span>
              <div className="flex bg-slate-100 p-1 rounded w-full md:w-auto">
                <button className="flex-1 md:flex-none px-4 py-1.5 rounded text-[11px] font-black uppercase tracking-wider transition-colors bg-white text-green-600 shadow-sm">
                  Tất cả
                </button>
              </div>
            </div>
          </div>

          {/* LIST */}
          {activeTab === 'players' && (
            <div>
              {filteredPlayers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredPlayers.map(player => (
                    <PlayerCard key={player.id} player={player} />
                  ))}
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-xl p-16 flex flex-col items-center justify-center min-h-[400px]">
                  <Users className="w-12 h-12 text-slate-300 mb-4" />
                  <p className="text-slate-600 font-bold text-[14px]">Không tìm thấy cầu thủ phù hợp.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'clubs' && (
            <div>
              {filteredClubs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredClubs.map(club => (
                    <div key={club.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-green-500 transition-colors flex items-center gap-4 group cursor-pointer">
                      <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center p-2 border border-slate-100 shrink-0">
                        {club.logo ? (
                          <img src={club.logo} alt={club.name} className="max-w-full max-h-full object-contain" />
                        ) : (
                          <Shield className="text-slate-300" size={24} />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-black text-[14px] text-slate-800 group-hover:text-green-600 transition-colors">{club.name}</h3>
                        <p className="text-[10px] text-slate-400 mt-1 font-bold uppercase tracking-widest">{club.sportType}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-green-500 transition-colors" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-xl p-16 flex flex-col items-center justify-center min-h-[400px]">
                  <Shield className="w-12 h-12 text-slate-300 mb-4" />
                  <p className="text-slate-600 font-bold text-[14px]">Không tìm thấy câu lạc bộ phù hợp.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT SIDEBAR (Widgets) */}
        <div className="w-full lg:w-[320px] shrink-0 space-y-6">
          
          {/* SAKA DEMO WIDGET */}
          <div className="bg-gradient-to-br from-green-900 to-slate-900 rounded-xl p-6 relative overflow-hidden shadow-lg border border-slate-800">
            <div className="absolute -right-8 -top-8 opacity-10">
              <Trophy className="w-40 h-40 text-white" />
            </div>
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-white rounded-full p-1 mb-4 shadow-md">
                 <img src="https://upload.wikimedia.org/wikipedia/en/thumb/5/53/Arsenal_FC.svg/1200px-Arsenal_FC.svg.png" className="w-full h-full object-contain" />
              </div>
              <h3 className="text-xl font-black text-white uppercase tracking-wider mb-2">Bản Demo <br/><span className="text-green-400">Bukayo Saka</span></h3>
              <p className="text-[12px] text-slate-300 font-medium leading-relaxed mb-6">
                Xem trải nghiệm mẫu chuẩn báo chí Sofascore với đầy đủ biểu đồ Radar, dữ liệu phong độ, và bản đồ nhiệt.
              </p>
              <Link href="/wiki/bukayo-saka" className="w-full block bg-green-600 hover:bg-green-500 text-white font-black text-[13px] uppercase tracking-widest py-3 rounded-lg shadow-sm transition-colors border border-green-400">
                Trải Nghiệm Thử Ngay
              </Link>
            </div>
          </div>

          {/* Info Widget */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="flex items-center gap-2 mb-4 text-slate-800">
              <Database className="w-4 h-4 text-green-600" />
              <span className="text-[12px] font-black uppercase tracking-widest">Nguồn Dữ Liệu Tự Động</span>
            </div>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-[12px] text-slate-600 font-medium leading-relaxed">
                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                Hệ thống API tự động cào dữ liệu thời gian thực từ các giải đấu hàng đầu.
              </li>
              <li className="flex items-start gap-2 text-[12px] text-slate-600 font-medium leading-relaxed">
                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                Dữ liệu tiểu sử, kỹ năng, và điểm số (Rating) được tính toán chính xác sau mỗi vòng đấu.
              </li>
              <li className="flex items-start gap-2 text-[12px] text-slate-600 font-medium leading-relaxed">
                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                Biểu đồ Radar được phân tích qua AI dựa trên màn trình diễn cá nhân.
              </li>
            </ul>
          </div>

        </div>

      </div>
    </div>
  );
}
