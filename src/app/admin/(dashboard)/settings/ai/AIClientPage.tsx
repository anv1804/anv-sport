"use client";

import { useState } from "react";
import { saveAISettings, testAIConnection } from "./actions";
import { toast } from "react-hot-toast";
import { Eye, EyeOff, PlugZap, CheckCircle2, XCircle, Settings, BarChart2, KeyRound, Globe, User, ShieldAlert } from "lucide-react";

export default function AIClientPage({ initialSettings }: { 
  initialSettings: { apiKey: string, baseUrl: string, username?: string, password?: string }
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; data?: string[]; error?: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setIsLoading(true);
    const result = await saveAISettings(formData);
    setIsLoading(false);

    if (result.success) {
      toast.success("Đã lưu cấu hình AI thành công");
      setTestResult(null);
    } else {
      toast.error(result.error || "Có lỗi xảy ra khi lưu");
    }
  };

  async function handleTestConnection() {
    setIsTesting(true);
    setTestResult(null);
    const result = await testAIConnection();
    if (result.success) {
      toast.success("Kết nối thành công!");
      setTestResult({ success: true, data: result.models });
    } else {
      toast.error("Kết nối thất bại!");
      setTestResult({ success: false, error: result.error });
    }
    setIsTesting(false);
  }

  return (
    <div className="space-y-6">
      {/* Configuration Card */}
      <div className="bg-white/70 backdrop-blur-xl border border-slate-200/60 rounded-[24px] shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center gap-2">
          <Settings className="w-5 h-5 text-emerald-600" />
          <h2 className="font-bold text-slate-800 text-base">Cấu hình API Key & AI Box</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Base URL (Đường dẫn kết nối)
            </label>
            <div className="relative">
              <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                name="baseUrl"
                defaultValue={initialSettings.baseUrl}
                placeholder="https://api.ai-box.vn"
                className="w-full pl-10 pr-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 font-semibold transition-all"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Tài khoản (Username)
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  name="username"
                  defaultValue={initialSettings.username}
                  placeholder="Username"
                  className="w-full pl-10 pr-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 font-semibold transition-all"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Mật khẩu (Password)
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  defaultValue={initialSettings.password}
                  placeholder="Password"
                  className="w-full pl-4 pr-10 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 font-semibold transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              API Key
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type={showApiKey ? "text" : "password"}
                name="apiKey"
                defaultValue={initialSettings.apiKey}
                placeholder="sk-..."
                className="w-full pl-10 pr-10 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 font-semibold transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:from-emerald-400 disabled:to-teal-500 rounded-xl shadow-lg shadow-emerald-500/20 disabled:shadow-none transition-all cursor-pointer text-center"
          >
            {isLoading ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </form>
      </div>

      {/* Connection Test Card */}
      <div className="bg-white/70 backdrop-blur-xl border border-slate-200/60 rounded-[24px] shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center gap-2">
          <PlugZap className="w-5 h-5 text-emerald-600" />
          <h2 className="font-bold text-slate-800 text-base">Kiểm tra kết nối AI Box</h2>
        </div>
        <div className="p-5 space-y-4">
          <button
            onClick={handleTestConnection}
            disabled={isTesting}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg shadow-blue-500/20 disabled:shadow-none cursor-pointer"
          >
            <PlugZap size={16} className={isTesting ? "animate-spin" : ""} />
            {isTesting ? "Đang kiểm tra kết nối..." : "Test Kết Nối & Lấy Model"}
          </button>

          {testResult && (
            <div className={`p-4 rounded-2xl border animate-in zoom-in-95 duration-200 ${testResult.success ? "bg-emerald-50/40 border-emerald-100/60" : "bg-red-50/40 border-red-100/60"}`}>
              {testResult.success ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-emerald-700 font-black text-sm">
                    <CheckCircle2 size={16} />
                    <span>Kết nối thành công!</span>
                  </div>
                  <div className="text-xs text-slate-600 font-medium">
                    <p className="font-bold mb-1.5 text-slate-700">Các model sẵn có ({testResult.data?.length}):</p>
                    <div className="flex flex-wrap gap-1.5 mt-1.5 max-h-32 overflow-y-auto custom-scrollbar">
                      {testResult.data?.map(m => (
                        <span key={m} className="px-2.5 py-1 bg-white border border-emerald-200/60 text-emerald-700 text-xs font-bold rounded-lg shadow-sm">
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (() => {
                const isOutOfMoney = testResult.error?.toLowerCase().includes("quota") || 
                                     testResult.error?.toLowerCase().includes("balance") || 
                                     testResult.error?.toLowerCase().includes("hết tiền");
                return (
                  <div className="flex items-start gap-2.5 text-red-700">
                    <XCircle size={16} className="mt-0.5 flex-shrink-0" />
                    <div className="space-y-1">
                      <p className="font-bold text-sm">{isOutOfMoney ? "Lỗi: Tài khoản hết tiền / Hết Quota" : "Lỗi kết nối API"}</p>
                      <p className="text-xs font-medium leading-relaxed text-red-600/90">
                        {isOutOfMoney 
                          ? "Tài khoản của bạn tại api.ai-box.vn đã hết tiền hoặc hết Quota sử dụng. Vui lòng nạp thêm tiền để tiếp tục." 
                          : testResult.error}
                      </p>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
