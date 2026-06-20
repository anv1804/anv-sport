import prisma from "@/lib/prisma";
import { MonitorPlay, Check, X, Settings2, Image as ImageIcon } from "lucide-react";
import { toggleAdStatus, seedInitialAds } from "./actions";

export default async function AdsPage() {
  let ads = await prisma.adPlacement.findMany();
  
  // Auto seed if empty for the first time
  if (ads.length === 0) {
    await seedInitialAds();
    ads = await prisma.adPlacement.findMany();
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Quản lý Quảng Cáo</h1>
        <p className="text-slate-500 mt-1 font-medium">Theo dõi hiệu suất và trạng thái của các vị trí đặt quảng cáo.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {ads.map((ad) => (
          <div key={ad.id} className="group relative bg-white/60 backdrop-blur-xl border border-white/80 rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(59,130,246,0.12)] transition-all duration-300 hover:-translate-y-1 flex flex-col">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center z-10 relative backdrop-blur-md">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-xl text-blue-600 mr-3 shadow-sm">
                  <MonitorPlay className="w-5 h-5" />
                </div>
                <span className="font-bold text-slate-800">{ad.name}</span>
              </div>
              <span className="text-[10px] text-slate-500 font-bold tracking-wider uppercase bg-white/80 px-2.5 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                {ad.slotId}
              </span>
            </div>
            
            <div className="p-5 flex-1 relative z-10">
              <div className="aspect-[16/9] w-full bg-slate-100 rounded-2xl mb-5 flex items-center justify-center overflow-hidden border border-slate-200/60 shadow-inner group-hover:shadow-md transition-shadow duration-300">
                {ad.imageUrl ? (
                  <img src={ad.imageUrl} alt={ad.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-400">
                    <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                    <span className="text-sm font-medium">Chưa có ảnh</span>
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Image URL</label>
                  <div className="text-sm truncate text-slate-700 font-medium">{ad.imageUrl || "N/A"}</div>
                </div>
                <div className="bg-blue-50/30 p-3 rounded-xl border border-blue-100/50">
                  <label className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block mb-1">Link trỏ tới</label>
                  <div className="text-sm truncate text-blue-600 font-medium">{ad.linkUrl || "N/A"}</div>
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center z-10 relative backdrop-blur-md">
              <form action={async () => {
                "use server";
                await toggleAdStatus(ad.id, ad.isActive);
              }}>
                <button 
                  type="submit"
                  className={`flex items-center px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                    ad.isActive 
                      ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-500 hover:text-white hover:shadow-lg hover:shadow-emerald-500/20" 
                      : "bg-slate-100 text-slate-600 hover:bg-slate-500 hover:text-white"
                  }`}
                >
                  {ad.isActive ? (
                    <><Check className="w-4 h-4 mr-1.5" /> Đang bật</>
                  ) : (
                    <><X className="w-4 h-4 mr-1.5" /> Đã tắt</>
                  )}
                </button>
              </form>
              
              <button className="flex items-center text-slate-500 hover:text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-xl text-sm font-bold transition-colors">
                <Settings2 className="w-4 h-4 mr-1.5" /> Cấu hình
              </button>
            </div>
            {/* Decorative background glow based on active state */}
            {ad.isActive && (
              <div className="absolute bottom-0 right-0 w-32 h-32 bg-emerald-400/10 rounded-full blur-2xl -mr-10 -mb-10 pointer-events-none group-hover:scale-150 transition-transform duration-500"></div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
