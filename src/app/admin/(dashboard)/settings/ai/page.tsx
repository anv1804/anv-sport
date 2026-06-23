import { getAISettings, getAILogs, getAILogStats } from "./actions";
import AIClientPage from "./AIClientPage";
import AIHistoryTable from "./AIHistoryTable";
import { Cpu, BarChart2, ShieldAlert } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AISettingsPage() {
  const settings = await getAISettings();
  const logs = await getAILogs(10, 0); // Limit 10, offset 0 for page 1
  const stats = await getAILogStats();

  const hasQuotaError = logs.some(log => 
    log.status === "ERROR" && 
    (log.errorMessage?.toLowerCase().includes("quota") || 
     log.errorMessage?.toLowerCase().includes("balance") || 
     log.errorMessage?.toLowerCase().includes("hết tiền"))
  );

  return (
    <div className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {hasQuotaError && (
        <div className="p-4 bg-amber-50/80 backdrop-blur-xl border border-amber-200/60 text-amber-900 rounded-[20px] flex items-start gap-3 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
          <ShieldAlert className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-bold text-sm">Cảnh báo: Tài khoản AI Box hết tiền hoặc hết Quota!</h3>
            <p className="text-xs text-amber-700/90 mt-1 font-medium leading-relaxed">
              Hệ thống phát hiện một số yêu cầu AI gần đây bị từ chối với lỗi không đủ số dư. 
              Vui lòng kiểm tra lại tài khoản và nạp thêm tiền tại <a href="https://api.ai-box.vn" target="_blank" rel="noopener noreferrer" className="underline font-bold text-amber-800 hover:text-amber-900">api.ai-box.vn</a> để khôi phục dịch vụ.
            </p>
          </div>
        </div>
      )}

      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 bg-white/70 backdrop-blur-xl border border-slate-200/60 rounded-[24px] shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Cpu className="w-6 h-6 text-emerald-600" />
            Cấu hình API & AI
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Quản lý tích hợp AI, API Key của các mô hình ngôn ngữ lớn (DeepSeek, GPT...) và theo dõi lượng tiêu hao token của hệ thống.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="col-span-1 lg:sticky lg:top-6 space-y-6">
          <AIClientPage initialSettings={settings} />
        </div>
        
        <div className="col-span-2 space-y-6">
          {/* Stats Card */}
          <div className="bg-white/70 backdrop-blur-xl border border-slate-200/60 rounded-[24px] shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-emerald-600" />
              <h2 className="font-bold text-slate-800 text-base">Thống kê & Quota sử dụng</h2>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100/80">
                  <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Tổng Tokens</div>
                  <div className="text-lg font-black text-emerald-600">{stats.totalTokens.toLocaleString()}</div>
                </div>
                <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100/80">
                  <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Tổng lượt gọi</div>
                  <div className="text-lg font-black text-slate-700">{stats.totalCalls.toLocaleString()}</div>
                </div>
                <div className="bg-emerald-50/40 p-4 rounded-2xl border border-emerald-100/60 text-emerald-700">
                  <div className="text-xs text-emerald-600/70 font-bold uppercase tracking-wider mb-1">Thành công</div>
                  <div className="text-lg font-black">{stats.successCalls.toLocaleString()}</div>
                </div>
                <div className="bg-red-50/45 p-4 rounded-2xl border border-red-100/60 text-red-650">
                  <div className="text-xs text-red-500/70 font-bold uppercase tracking-wider mb-1">Thất bại</div>
                  <div className="text-lg font-black">{stats.errorCalls.toLocaleString()}</div>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 text-center font-medium leading-relaxed">
                * Số token được ước tính tự động dựa trên độ dài của Prompt và Output nội dung bài viết.
              </p>
            </div>
          </div>

          {/* History Card Client component */}
          <AIHistoryTable initialLogs={logs as any} totalCalls={stats.totalCalls} />
        </div>
      </div>
    </div>
  );
}
