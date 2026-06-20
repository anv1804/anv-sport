"use client";

import { useState } from "react";
import { getAILogs } from "./actions";
import { format } from "date-fns";
import { History, ChevronLeft, ChevronRight, RotateCw, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";

interface AILog {
  id: string;
  prompt: string | null;
  modelUsed: string | null;
  status: string;
  errorMessage: string | null;
  tokenCount: number;
  durationMs: number;
  createdAt: Date;
}

interface AIHistoryTableProps {
  initialLogs: AILog[];
  totalCalls: number;
}

function formatNumber(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export default function AIHistoryTable({ initialLogs, totalCalls }: AIHistoryTableProps) {
  const [logs, setLogs] = useState<AILog[]>(initialLogs);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const limit = 10;
  const totalPages = Math.ceil(totalCalls / limit);

  const fetchLogsPage = async (pageNum: number) => {
    setIsLoading(true);
    try {
      const skip = (pageNum - 1) * limit;
      const res = await getAILogs(limit, skip);
      setLogs(res as any);
      setPage(pageNum);
    } catch (e: any) {
      toast.error(e.message || "Không thể tải lịch sử gọi AI");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchLogsPage(page);
    toast.success("Đã cập nhật lịch sử gọi AI mới nhất");
  };

  return (
    <div className="bg-white/70 backdrop-blur-xl border border-slate-200/60 rounded-[24px] shadow-sm overflow-hidden flex flex-col min-h-[500px] relative">
      {/* Header */}
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2">
          <History className="w-5 h-5 text-emerald-600" />
          Lịch Sử Gọi AI Gần Đây
        </h2>
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="p-2 border border-slate-200 hover:border-slate-300 rounded-xl hover:bg-slate-50 transition-all text-slate-600 disabled:opacity-50 flex items-center gap-1.5 text-xs font-bold cursor-pointer"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
          ) : (
            <RotateCw className="w-4 h-4" />
          )}
          Cập nhật
        </button>
      </div>
      
      {/* Table */}
      <div className="overflow-x-auto flex-1 relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] z-10 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          </div>
        )}
        <table className="w-full text-left border-collapse min-w-[650px]">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-200/60 text-xs font-bold text-slate-400 uppercase tracking-wider">
              <th className="py-3 md:py-4 px-3 md:px-6">Thời gian</th>
              <th className="py-3 md:py-4 px-3 md:px-6">Model</th>
              <th className="py-3 md:py-4 px-3 md:px-6 text-center">Tokens</th>
              <th className="py-3 md:py-4 px-3 md:px-6 text-center">Thời gian gọi</th>
              <th className="py-3 md:py-4 px-3 md:px-6 text-right">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-400 font-semibold">
                  Chưa có lịch sử sử dụng AI
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 transition-colors text-sm">
                  <td className="py-3 md:py-4 px-3 md:px-6 whitespace-nowrap font-medium text-slate-600">
                    {format(new Date(log.createdAt), "dd/MM/yyyy HH:mm:ss")}
                  </td>
                  <td className="py-3 md:py-4 px-3 md:px-6 font-bold text-emerald-600">
                    {log.modelUsed || "Unknown"}
                  </td>
                  <td className="py-3 md:py-4 px-3 md:px-6 text-center font-mono font-bold text-slate-600">
                    {formatNumber(log.tokenCount)}
                  </td>
                  <td className="py-3 md:py-4 px-3 md:px-6 text-center font-semibold text-slate-500">
                    {log.durationMs}ms
                  </td>
                  <td className="py-3 md:py-4 px-3 md:px-6 text-right">
                    {log.status === "SUCCESS" ? (
                      <span className="px-2.5 py-0.5 text-xs font-bold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">
                        Thành công
                      </span>
                    ) : (
                      <span 
                        className="px-2.5 py-0.5 text-xs font-bold rounded-lg bg-red-50 text-red-650 border border-red-100 cursor-help"
                        title={log.errorMessage || "Lỗi không xác định"}
                      >
                        Lỗi
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (() => {
        const pageNumbers: (number | string)[] = [];
        if (totalPages <= 7) {
          for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);
        } else {
          pageNumbers.push(1);
          if (page > 3) pageNumbers.push("...");
          
          const start = Math.max(2, page - 1);
          const end = Math.min(totalPages - 1, page + 1);
          for (let i = start; i <= end; i++) pageNumbers.push(i);
          
          if (page < totalPages - 2) pageNumbers.push("...");
          pageNumbers.push(totalPages);
        }

        return (
          <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-b-[24px]">
            <span className="text-xs text-slate-500 font-bold whitespace-nowrap">
              Hiển thị {(page - 1) * limit + 1} - {Math.min(page * limit, totalCalls)} trên tổng số {totalCalls} dòng
            </span>
            
            <div className="flex items-center gap-1.5 flex-wrap justify-center">
              <button
                type="button"
                onClick={() => fetchLogsPage(page - 1)}
                disabled={page <= 1 || isLoading}
                className="p-2 border border-slate-200 rounded-lg hover:bg-white transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
              >
                <ChevronLeft className="w-4 h-4 text-slate-600" />
              </button>
              
              {pageNumbers.map((pNum, idx) => {
                if (pNum === "...") {
                  return (
                    <span key={`dots-${idx}`} className="px-2 text-xs font-bold text-slate-400">
                      ...
                    </span>
                  );
                }
                return (
                  <button
                    key={pNum}
                    type="button"
                    onClick={() => fetchLogsPage(pNum as number)}
                    disabled={isLoading}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      page === pNum
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'border border-slate-200 hover:bg-white text-slate-700'
                    }`}
                  >
                    {pNum}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => fetchLogsPage(page + 1)}
                disabled={page >= totalPages || isLoading}
                className="p-2 border border-slate-200 rounded-lg hover:bg-white transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
              >
                <ChevronRight className="w-4 h-4 text-slate-600" />
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
