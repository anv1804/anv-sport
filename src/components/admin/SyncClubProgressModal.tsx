"use client";

import { useState } from "react";
import { X, Loader2, CheckCircle, AlertCircle, Play, Square } from "lucide-react";
import { syncSingleClub } from "@/app/admin/(dashboard)/clubs/actions";
import toast from "react-hot-toast";

export type SyncClubQueueItem = {
  id: string;
  name: string;
  status: "pending" | "syncing" | "success" | "error";
  message?: string;
};

export default function SyncClubProgressModal({ 
  isOpen, 
  onClose, 
  selectedClubs,
  onComplete
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  selectedClubs: { id: string; name: string }[];
  onComplete: () => void;
}) {
  const [queue, setQueue] = useState<SyncClubQueueItem[]>(
    selectedClubs.map(c => ({ ...c, status: "pending" }))
  );
  const [isSyncing, setIsSyncing] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);

  if (!isOpen) return null;

  const startSync = async () => {
    setIsSyncing(true);
    setIsCancelled(false);

    let currentQueue = [...queue];
    
    // Reset any previous errors/successes
    currentQueue = currentQueue.map(item => ({ ...item, status: item.status === "syncing" ? "pending" : item.status }));
    setQueue(currentQueue);

    for (let i = 0; i < currentQueue.length; i++) {
      if (currentQueue[i].status === "success") continue;
      
      // Check cancellation inside the loop (React state might be stale in the loop, better to use a ref, but let's check a local variable if we use a ref. Wait, if we use a state `isCancelled`, we should access it via a ref or simply check `window.cancelSync`).
      // For simplicity, we'll check a flag.
      if (window._cancelSyncFlag) {
        toast.error("Đã hủy quá trình đồng bộ!");
        break;
      }

      currentQueue[i].status = "syncing";
      setQueue([...currentQueue]);

      try {
        const res = await syncSingleClub(currentQueue[i].id);
        
        if (window._cancelSyncFlag) break; // Check again after await

        if (res.success) {
          currentQueue[i].status = "success";
          currentQueue[i].message = res.name;
        } else {
          currentQueue[i].status = "error";
          currentQueue[i].message = res.error || "Có lỗi xảy ra";
        }
      } catch (err) {
        currentQueue[i].status = "error";
        currentQueue[i].message = "Lỗi hệ thống";
      }

      setQueue([...currentQueue]);
      
      // Delay to avoid overwhelming the server/Wikipedia
      await new Promise(r => setTimeout(r, 1000));
    }

    setIsSyncing(false);
    window._cancelSyncFlag = false;
    onComplete();
  };

  const handleCancel = () => {
    setIsCancelled(true);
    window._cancelSyncFlag = true;
  };

  const handleClose = () => {
    if (isSyncing) return;
    onClose();
  };

  const successCount = queue.filter(q => q.status === "success").length;
  const totalCount = queue.length;
  const progressPercent = Math.round((successCount / totalCount) * 100) || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Đồng bộ Câu lạc bộ</h2>
            <p className="text-sm text-slate-500 mt-1">Cập nhật dữ liệu từ Wikipedia</p>
          </div>
          <button onClick={handleClose} disabled={isSyncing} className="text-slate-400 hover:text-slate-600 transition-colors p-2 rounded-lg hover:bg-slate-100 disabled:opacity-50">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 pt-4">
          <div className="flex justify-between text-sm font-bold text-slate-700 mb-2">
            <span>Tiến độ đồng bộ</span>
            <span>{successCount} / {totalCount} ({progressPercent}%)</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div 
              className="bg-emerald-500 h-2.5 rounded-full transition-all duration-300" 
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-4">
          <div className="border border-slate-200 rounded-lg overflow-hidden flex-1 flex flex-col min-h-[300px]">
            <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 text-sm font-bold text-slate-700">
              Chi tiết tiến trình
            </div>
            <div className="overflow-y-auto p-4 flex flex-col gap-3 flex-1">
              {queue.map((item, idx) => (
                <div key={item.id} className="flex items-start gap-3 text-sm">
                  {item.status === "pending" && <div className="w-5 h-5 rounded-full border-2 border-slate-200 shrink-0 mt-0.5" />}
                  {item.status === "syncing" && <Loader2 className="w-5 h-5 text-blue-500 animate-spin shrink-0 mt-0.5" />}
                  {item.status === "success" && <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />}
                  {item.status === "error" && <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />}
                  
                  <div className="flex-1 min-w-0">
                    <p className={`truncate font-medium ${
                      item.status === "success" ? "text-emerald-700" : 
                      item.status === "error" ? "text-red-600" : "text-slate-700"
                    }`}>
                      {item.status === "success" ? (item.message || item.name) : item.name}
                    </p>
                    {item.status === "error" && item.message && (
                      <p className="text-[12px] mt-0.5 text-red-500">
                        {item.message}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 rounded-b-xl">
          {isSyncing ? (
            <button 
              onClick={handleCancel}
              className="px-5 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors flex items-center gap-2"
            >
              <Square className="w-4 h-4 fill-current" /> Hủy khẩn cấp
            </button>
          ) : (
            <>
              <button 
                onClick={handleClose} 
                className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200 bg-white border border-slate-200 rounded-lg transition-colors"
              >
                Đóng
              </button>
              <button 
                onClick={startSync}
                disabled={successCount === totalCount}
                className="px-5 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <Play className="w-4 h-4" /> Bắt đầu Đồng bộ
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Global typing for the window flag
declare global {
  interface Window {
    _cancelSyncFlag: boolean;
  }
}
