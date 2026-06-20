import prisma from "@/lib/prisma";
import { FileText, MonitorPlay, Eye, TrendingUp, Users } from "lucide-react";

export default async function AdminDashboard() {
  const postsCount = await prisma.post.count();
  const adsCount = await prisma.adPlacement.count();

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-10">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Tổng Quan Hệ Thống</h1>
        <p className="text-slate-500 mt-2 font-medium">Theo dõi hiệu suất và số liệu của nền tảng ngày hôm nay.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card 1 */}
        <div className="group relative bg-white/60 backdrop-blur-xl p-6 rounded-3xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(16,185,129,0.12)] transition-all duration-300 hover:-translate-y-1 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-400/20 to-teal-500/0 rounded-full blur-2xl -mr-10 -mt-10 transition-transform duration-500 group-hover:scale-150"></div>
          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Tổng Bài Viết</p>
              <p className="text-4xl font-black text-slate-800">{postsCount}</p>
            </div>
            <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white transition-colors duration-300 shadow-inner">
              <FileText className="w-7 h-7" />
            </div>
          </div>
          <div className="mt-6 flex items-center text-sm">
            <span className="flex items-center text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded-md">
              <TrendingUp className="w-4 h-4 mr-1" /> +12%
            </span>
            <span className="text-slate-400 ml-2 font-medium">so với tháng trước</span>
          </div>
        </div>

        {/* Card 2 */}
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

        {/* Card 3 */}
        <div className="group relative bg-white/60 backdrop-blur-xl p-6 rounded-3xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(168,85,247,0.12)] transition-all duration-300 hover:-translate-y-1 overflow-hidden delay-200">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-400/20 to-fuchsia-500/0 rounded-full blur-2xl -mr-10 -mt-10 transition-transform duration-500 group-hover:scale-150"></div>
          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Tổng Lượt Xem</p>
              <p className="text-4xl font-black text-slate-800">12,450</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-2xl text-purple-600 group-hover:bg-purple-500 group-hover:text-white transition-colors duration-300 shadow-inner">
              <Eye className="w-7 h-7" />
            </div>
          </div>
          <div className="mt-6 flex items-center text-sm">
            <span className="flex items-center text-purple-600 font-bold bg-purple-50 px-2 py-1 rounded-md">
              <Users className="w-4 h-4 mr-1" /> Độc giả mới tăng
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
