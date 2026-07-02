'use client'

import { useState, useEffect } from 'react'
import { X, Calendar, Clock, Loader2, Pin, Save } from 'lucide-react'
import { setPrintZonePost } from './actions'
import { setPrintCategoryPost } from '../category-posts/actions'
import { useAlert } from '@/components/providers/ConfirmProvider'

export function PrintModal({ 
  isOpen, 
  onClose, 
  item, 
  mode,
  targetId,
  onSaved
}: { 
  isOpen: boolean;
  onClose: () => void;
  item: any;
  mode: 'ZONE' | 'CATEGORY';
  targetId: string;
  onSaved: () => void;
}) {
  const alert = useAlert()
  const [isPrinted, setIsPrinted] = useState(false)
  const [isIndefinite, setIsIndefinite] = useState(true)
  
  const [startDate, setStartDate] = useState('')
  const [startTime, setStartTime] = useState('')
  
  const [endDate, setEndDate] = useState('')
  const [endTime, setEndTime] = useState('')
  
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (item) {
      setIsPrinted(item.isPrinted || false);
      
      if (item.printStartTime) {
        const d = new Date(item.printStartTime);
        setStartDate(d.toISOString().split('T')[0]);
        setStartTime(d.toTimeString().substring(0, 5));
      } else {
        setStartDate('');
        setStartTime('');
      }

      if (item.printEndTime) {
        setIsIndefinite(false);
        const d = new Date(item.printEndTime);
        setEndDate(d.toISOString().split('T')[0]);
        setEndTime(d.toTimeString().substring(0, 5));
      } else {
        setIsIndefinite(true);
        setEndDate('');
        setEndTime('');
      }
    }
  }, [item, isOpen])

  if (!isOpen || !item) return null;

  const handleSave = async () => {
    setIsSaving(true)
    let printStartTime = null;
    let printEndTime = null;
    
    if (isPrinted) {
      if (startDate && startTime) {
        printStartTime = new Date(`${startDate}T${startTime}`);
      }
      
      if (!isIndefinite) {
        if (!endDate || !endTime) {
          await alert('Vui lòng chọn ngày và giờ kết thúc!');
          setIsSaving(false);
          return;
        }
        printEndTime = new Date(`${endDate}T${endTime}`);
        
        if (printStartTime && printEndTime <= printStartTime) {
          await alert('Thời gian kết thúc phải lớn hơn thời gian bắt đầu!');
          setIsSaving(false);
          return;
        }
      }
    }

    let res;
    if (mode === 'ZONE') {
      res = await setPrintZonePost(item.id, isPrinted, printStartTime, printEndTime, targetId);
    } else {
      res = await setPrintCategoryPost(item.id, isPrinted, printStartTime, printEndTime, targetId);
    }

    if (res?.success) {
      onSaved();
      onClose();
    } else {
      await alert(res?.error || 'Lỗi khi lưu cấu hình Print');
    }
    setIsSaving(false)
  }

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <Pin className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800">Cấu hình Print (Ghim)</h2>
              <p className="text-sm text-slate-500 font-medium">Ưu tiên hiển thị bài viết lên đầu</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 md:p-6 space-y-6">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <p className="text-sm font-bold text-slate-700 truncate">{item.post.title}</p>
          </div>

          <div className="flex items-center justify-between">
            <label className="font-bold text-slate-700 flex flex-col cursor-pointer">
              <span>Bật trạng thái Print</span>
              <span className="text-xs text-slate-500 font-normal">Bài viết sẽ luôn nằm ở Top 1</span>
            </label>
            <button 
              type="button"
              onClick={() => setIsPrinted(!isPrinted)}
              className={`w-12 h-6 rounded-full transition-colors relative ${isPrinted ? 'bg-emerald-500' : 'bg-slate-300'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${isPrinted ? 'left-7' : 'left-1'}`}></div>
            </button>
          </div>

          {isPrinted && (
            <div className="space-y-4 pt-4 border-t border-slate-100 animate-in fade-in slide-in-from-top-2">
              
              <div className="flex gap-4 mb-4">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Ngày bắt đầu (Tùy chọn)</label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input 
                      type="date" 
                      value={startDate}
                      onChange={e => setStartDate(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:border-emerald-500 outline-none transition-colors"
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Giờ bắt đầu</label>
                  <div className="relative">
                    <Clock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input 
                      type="time" 
                      value={startTime}
                      onChange={e => setStartTime(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:border-emerald-500 outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-700">Thời hạn Print</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="radio" 
                    id="indefinite" 
                    checked={isIndefinite} 
                    onChange={() => setIsIndefinite(true)} 
                    className="accent-emerald-600 w-4 h-4"
                  />
                  <label htmlFor="indefinite" className="text-sm font-medium text-slate-600 cursor-pointer">Vô thời hạn</label>
                  
                  <input 
                    type="radio" 
                    id="timer" 
                    checked={!isIndefinite} 
                    onChange={() => setIsIndefinite(false)} 
                    className="accent-emerald-600 w-4 h-4 ml-4"
                  />
                  <label htmlFor="timer" className="text-sm font-medium text-slate-600 cursor-pointer">Hẹn giờ kết thúc</label>
                </div>
              </div>

              {!isIndefinite && (
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Ngày kết thúc</label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                      <input 
                        type="date" 
                        value={endDate}
                        onChange={e => setEndDate(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:border-emerald-500 outline-none transition-colors"
                      />
                    </div>
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Giờ kết thúc</label>
                    <div className="relative">
                      <Clock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                      <input 
                        type="time" 
                        value={endTime}
                        onChange={e => setEndTime(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:border-emerald-500 outline-none transition-colors"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-4 md:p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200 bg-slate-100 rounded-xl transition-colors"
          >
            Hủy bỏ
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors flex items-center shadow-sm shadow-emerald-600/20 disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Lưu cài đặt
          </button>
        </div>
      </div>
    </div>
  )
}
