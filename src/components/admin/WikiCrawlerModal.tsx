'use client';

import { useState } from 'react';
import { X, Search, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useAlert } from '@/components/providers/ConfirmProvider';

export function WikiCrawlerModal({ isOpen, onClose, onRefresh }: { isOpen: boolean; onClose: () => void; onRefresh: () => void }) {
  const alert = useAlert();
  const [names, setNames] = useState('');
  const [lang, setLang] = useState('vi');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  if (!isOpen) return null;

  const handleCrawl = async () => {
    if (!names.trim()) return;
    setLoading(true);
    setResults([]);

    try {
      const res = await fetch('/api/admin/crawler/wiki', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ names, lang })
      });

      const data = await res.json();
      if (data.success) {
        setResults(data.results || []);
        onRefresh();
      } else {
        await alert(data.error || 'Có lỗi xảy ra');
      }
    } catch (error) {
      await alert('Lỗi kết nối tới máy chủ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
              <Search size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Wikipedia & AI Crawler</h2>
              <p className="text-sm text-slate-500">Tự động lấy dữ liệu cầu thủ từ Wikipedia</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-2 rounded-full hover:bg-slate-200">
            <X size={24} />
          </button>
        </div>

        <div className="p-4 md:p-6 overflow-y-auto flex-1">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Ngôn ngữ Wikipedia</label>
              <select value={lang} onChange={e => setLang(e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option value="vi">Tiếng Việt (vi.wikipedia.org)</option>
                <option value="en">Tiếng Anh (en.wikipedia.org) - Khuyên dùng</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Danh sách cầu thủ</label>
              <textarea 
                value={names}
                onChange={e => setNames(e.target.value)}
                placeholder="Nhập tên cầu thủ, mỗi tên một dòng (hoặc cách nhau bằng dấu phẩy).&#10;Ví dụ:&#10;Lionel Messi&#10;Cristiano Ronaldo"
                className="w-full h-32 px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none text-sm"
              />
            </div>
            
            {results.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-bold text-slate-800 mb-3 border-b pb-2">Kết quả cào dữ liệu ({results.length}):</h3>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {results.map((r, idx) => (
                    <div key={idx} className={`p-3 rounded-lg border text-sm flex items-start gap-3 \${r.status === 'success' ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                      {r.status === 'success' ? <CheckCircle className="text-emerald-500 shrink-0 mt-0.5" size={18} /> : <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />}
                      <div>
                        <p className="font-semibold text-slate-800">{r.name}</p>
                        {r.status === 'error' && <p className="text-red-600 mt-1">{r.message}</p>}
                        {r.status === 'success' && (
                           <p className="text-emerald-700 mt-1 text-xs">Đã lưu: {r.entity?.name}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 md:p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
          <button onClick={onClose} className="px-6 py-2.5 rounded-lg border border-slate-300 text-slate-600 font-medium hover:bg-slate-100 transition-colors">
            Đóng
          </button>
          <button 
            onClick={handleCrawl} 
            disabled={loading || !names.trim()}
            className="px-6 py-2.5 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading && <Loader2 size={18} className="animate-spin" />}
            {loading ? 'Đang phân tích AI...' : 'Bắt đầu Crawl'}
          </button>
        </div>
      </div>
    </div>
  );
}
