import prisma from "@/lib/prisma";
import { FileText, MonitorPlay, Eye, TrendingUp, Users, Flame, Activity } from "lucide-react";
import { refreshDashboardStats } from "@/lib/cms-redis";

export default async function AdminDashboard() {
  const [postsCount, adsCount, stats] = await Promise.all([
    prisma.post.count(),
    prisma.adPlacement.count(),
    refreshDashboardStats(),
  ]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-10">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Tổng Quan Hệ Thống</h1>
        <p className="text-slate-500 mt-2 font-medium">Theo dõi hiệu suất và số liệu của nền tảng ngày hôm nay.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card 1 — Tổng Bài Viết */}
        <div className="group relative bg-white/60 backdrop-blur-xl p-6 rounded-3xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(16,185,129,0.12)] transition-all duration-300 hover:-translate-y-1 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-400/20 to-teal-500/0 rounded-full blur-2xl -mr-10 -mt-10 transition-transform duration-500 group-hover:scale-150"></div>
          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Tổng Bài Viết</p>
              <p className="text-4xl font-black text-slate-800">{postsCount.toLocaleString('vi-VN')}</p>
            </div>
            <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white transition-colors duration-300 shadow-inner">
              <FileText className="w-7 h-7" />
            </div>
          </div>
          <div className="mt-6 flex items-center text-sm">
            <span className="flex items-center text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded-md">
              <TrendingUp className="w-4 h-4 mr-1" /> Đang hoạt động
            </span>
          </div>
        </div>

        {/* Card 2 — Banner Quảng Cáo */}
        <div className="group relative bg-white/60 backdrop-blur-xl p-6 rounded-3xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(59,130,246,0.12)] transition-all duration-300 hover:-translate-y-1 overflow-hidden delay-100">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-indigo-500/0 rounded-full blur-2xl -mr-10 -mt-10 transition-transform duration-500 group-hover:scale-150"></div>
          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Banner Quảng Cáo</p>
              <p className="text-4xl font-black text-slate-800">{adsCount}</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-2xl text-blue-600 group-hover:bg-blue-500 group-hover:text-white transition-colors duration-300 shadow-inner">
              <MonitorPlay className="w-7 h-7" />
            </div>
          </div>
          <div className="mt-6 flex items-center text-sm">
            <span className="flex items-center text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded-md">
              <TrendingUp className="w-4 h-4 mr-1" /> Đang chạy tốt
            </span>
          </div>
        </div>

        {/* Card 3 — Views hôm nay (Redis BITCOUNT) */}
        <div className="group relative bg-white/60 backdrop-blur-xl p-6 rounded-3xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(168,85,247,0.12)] transition-all duration-300 hover:-translate-y-1 overflow-hidden delay-200">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-400/20 to-fuchsia-500/0 rounded-full blur-2xl -mr-10 -mt-10 transition-transform duration-500 group-hover:scale-150"></div>
          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Unique Views Hôm Nay</p>
              <p className="text-4xl font-black text-slate-800">{stats.todayViews.toLocaleString('vi-VN')}</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-2xl text-purple-600 group-hover:bg-purple-500 group-hover:text-white transition-colors duration-300 shadow-inner">
              <Eye className="w-7 h-7" />
            </div>
          </div>
          <div className="mt-6 flex items-center text-sm">
            <span className="flex items-center text-purple-600 font-bold bg-purple-50 px-2 py-1 rounded-md">
              <Activity className="w-4 h-4 mr-1" /> Redis BITMAP realtime
            </span>
          </div>
        </div>

        {/* Card 4 — Đang Online (Redis BITCOUNT/giờ) */}
        <div className="group relative bg-white/60 backdrop-blur-xl p-6 rounded-3xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(245,158,11,0.12)] transition-all duration-300 hover:-translate-y-1 overflow-hidden delay-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-400/20 to-orange-500/0 rounded-full blur-2xl -mr-10 -mt-10 transition-transform duration-500 group-hover:scale-150"></div>
          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Đang Online</p>
              <div className="flex items-baseline gap-2">
                <p className="text-4xl font-black text-slate-800">{stats.onlineNow.toLocaleString('vi-VN')}</p>
                {stats.onlineNow > 0 && (
                  <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse mb-1"></span>
                )}
              </div>
            </div>
            <div className="p-4 bg-amber-50 rounded-2xl text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition-colors duration-300 shadow-inner">
              <Users className="w-7 h-7" />
            </div>
          </div>
          <div className="mt-6 flex items-center text-sm">
            <span className="flex items-center text-amber-600 font-bold bg-amber-50 px-2 py-1 rounded-md">
              <Activity className="w-4 h-4 mr-1" /> Giờ này (BITMAP 2h TTL)
            </span>
          </div>
        </div>

        {/* Card 5 — Bài Hot (Redis ZSET) */}
        <div className="group relative bg-white/60 backdrop-blur-xl p-6 rounded-3xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(239,68,68,0.12)] transition-all duration-300 hover:-translate-y-1 overflow-hidden delay-[400ms]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-red-400/20 to-rose-500/0 rounded-full blur-2xl -mr-10 -mt-10 transition-transform duration-500 group-hover:scale-150"></div>
          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Bài Hot 7 Ngày</p>
              <p className="text-4xl font-black text-slate-800">{stats.hotPostIds.length}</p>
            </div>
            <div className="p-4 bg-red-50 rounded-2xl text-red-600 group-hover:bg-red-500 group-hover:text-white transition-colors duration-300 shadow-inner">
              <Flame className="w-7 h-7" />
            </div>
          </div>
          <div className="mt-6 flex items-center text-sm">
            <span className="flex items-center text-red-600 font-bold bg-red-50 px-2 py-1 rounded-md">
              <TrendingUp className="w-4 h-4 mr-1" /> Redis Sorted Set (ZINCRBY)
            </span>
          </div>
        </div>
      </div>

      {/* Cache info */}
      <p className="text-xs text-slate-300 mt-6 text-right">
        Stats cached at {new Date(stats.cachedAt).toLocaleTimeString('vi-VN')} · TTL 5 phút · Redis Bitmap + ZSET
      </p>
    </div>
  );
}


