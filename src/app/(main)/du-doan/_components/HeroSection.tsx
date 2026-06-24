import { Cpu, Sparkles } from 'lucide-react';

export default function HeroSection() {
  return (
    <div className="bg-gradient-to-br from-[#070d19] via-[#0f1934] to-[#070b14] text-white relative overflow-hidden pt-16 pb-52 md:pt-24 md:pb-72 px-4 border-b border-slate-800/85">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_80%,transparent_100%)] opacity-20"></div>
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="max-w-[1160px] mx-auto relative z-10 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6">
        <div className="text-center md:text-left flex flex-col items-center md:items-start w-full md:w-auto">
          <div className="flex flex-col sm:flex-row items-center gap-3 mb-5">
            <span className="bg-emerald-500/10 border border-emerald-500/35 text-emerald-400 font-extrabold px-3.5 py-1 rounded-full text-[10px] tracking-widest flex items-center gap-1.5 uppercase shadow-[0_2px_15px_rgba(16,185,129,0.15)] backdrop-blur-md">
              <Cpu className="w-3.5 h-3.5 animate-spin-slow" /> ANV SUPERCOMPUTER V2.5
            </span>
            <span className="text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-widest mt-1.5 sm:mt-0 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-450" /> Giao diện dự đoán cao cấp toàn diện
            </span>
          </div>
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight uppercase leading-none flex flex-col gap-2">
            <span>TRUNG TÂM</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-450 via-teal-300 to-cyan-400 drop-shadow-sm font-extrabold">
              DỰ ĐOÁN & PHÂN TÍCH
            </span>
          </h1>
          <p className="text-slate-450 text-sm md:text-base mt-4 max-w-[650px] leading-relaxed">
            Phân tích cơ sở dữ liệu đối đầu lịch sử, phong độ cầu thủ, sơ đồ chiến thuật và đưa ra xác suất dự đoán thông minh theo thời gian thực.
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-3 bg-slate-900/80 border border-slate-700/60 px-5 py-3 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.37)] backdrop-blur-md">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-450 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-[10px] font-bold text-slate-355 uppercase tracking-widest">LIVE SCOREBOARD RUNNING</span>
        </div>
      </div>
    </div>
  );
}
