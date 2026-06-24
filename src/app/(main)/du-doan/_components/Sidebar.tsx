import { Bot, Activity, AlertCircle } from 'lucide-react';

export default function Sidebar() {
  return (
    <div className="w-full lg:w-[320px] shrink-0 space-y-6">

      <div className="bg-gradient-to-br from-[#0c142c] via-[#0d162f] to-[#090f22] rounded-2xl p-6 relative overflow-hidden shadow-lg border border-slate-800">
        <div className="absolute -right-10 -bottom-10 opacity-5">
          <Activity className="w-48 h-48 text-white" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4 bg-emerald-500/10 border border-emerald-500/20 w-max px-3 py-1.5 rounded-lg text-emerald-400">
            <Bot className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Siêu Máy Tính AI</span>
          </div>
          <p className="text-[13px] text-slate-400 font-medium leading-relaxed mb-6 font-client-ui">
            Hệ thống tự động tham chiếu dữ liệu từ TheSportsDB, kết hợp với các thuật toán học máy nâng cao để phân tích phong độ đối đầu và dự đoán xác suất trận đấu.
          </p>
          <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest border-t border-slate-800/80 pt-4 text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Real-time Analysis
            </span>
            <span className="text-emerald-400/80 border border-emerald-500/20 px-2 py-0.5 rounded">API Official</span>
          </div>
        </div>
      </div>

      <div className="bg-amber-50/40 rounded-2xl p-6 border border-amber-100 shadow-sm relative overflow-hidden">
        <div className="flex items-center gap-2 mb-3 text-amber-800">
          <AlertCircle className="w-4 h-4 text-amber-600" />
          <span className="text-[11px] font-black uppercase tracking-widest">Khuyến Cáo Vận Hành</span>
        </div>
        <p className="text-[12px] text-amber-850/80 font-medium leading-relaxed">
          Các phân tích và dự đoán từ Siêu máy tính AI chỉ mang tính chất tham khảo tin tức thể thao giải trí. ANVSport tuyệt đối không cung cấp dịch vụ hoặc khuyến khích người dùng tham gia cá cược dưới mọi hình thức.
        </p>
      </div>

    </div>
  );
}
