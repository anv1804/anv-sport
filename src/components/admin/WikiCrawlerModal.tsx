'use client';

import { useState } from 'react';
import { X, Search, Loader2, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { useAlert } from '@/components/providers/ConfirmProvider';

export function WikiCrawlerModal({ isOpen, onClose, onRefresh }: { isOpen: boolean; onClose: () => void; onRefresh: () => void }) {
  const alert = useAlert();
  const [names, setNames] = useState('');
  const [lang, setLang] = useState('vi');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [progress, setProgress] = useState(0);
  const [currentName, setCurrentName] = useState('');
  const [processedCount, setProcessedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  if (!isOpen) return null;

  const handleCrawl = async () => {
    const nameList = names
      .split(/[\n,]/)
      .map(n => n.trim())
      .filter(n => n.length > 0);

    if (nameList.length === 0) return;

    setLoading(true);
    setResults([]);
    setProgress(0);
    setProcessedCount(0);
    setTotalCount(nameList.length);

    let hasSuccess = false;

    for (let i = 0; i < nameList.length; i++) {
      const name = nameList[i];
      setCurrentName(name);
      try {
        const res = await fetch('/api/admin/crawler/wiki', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ names: name, lang, skipIfExists: true })
        });

        const data = await res.json();
        if (data.success && data.results && data.results.length > 0) {
          const resultItem = data.results[0];
          setResults(prev => [...prev, resultItem]);
          if (resultItem.status === 'success') {
            hasSuccess = true;
          }
        } else {
          setResults(prev => [...prev, { name, status: 'error', message: data.error || 'Có lỗi xảy ra' }]);
        }
      } catch (error) {
        setResults(prev => [...prev, { name, status: 'error', message: 'Lỗi kết nối tới máy chủ' }]);
      }

      const newProcessedCount = i + 1;
      setProcessedCount(newProcessedCount);
      setProgress(Math.round((newProcessedCount / nameList.length) * 100));
    }

    if (hasSuccess) {
      onRefresh();
    }
    setLoading(false);
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
                disabled={loading}
              />
            </div>
            
            {loading && (
              <div className="space-y-2 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div className="flex justify-between items-center text-sm font-medium text-slate-700">
                  <span className="flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin text-emerald-600" />
                    Đang xử lý: <span className="text-emerald-700 font-semibold">{currentName}</span>
                  </span>
                  <span>{processedCount}/{totalCount} ({progress}%)</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-emerald-600 h-2.5 rounded-full transition-all duration-300" 
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {results.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-bold text-slate-800 mb-3 border-b pb-2">Kết quả cào dữ liệu ({results.length}):</h3>
                <div className="space-y-2 max-h-[250px] overflow-y-auto">
                  {results.map((r, idx) => {
                    let cardClass = '';
                    let icon = null;
                    if (r.status === 'success') {
                      cardClass = 'bg-emerald-50 border-emerald-100 text-emerald-800';
                      icon = <CheckCircle className="text-emerald-500 shrink-0 mt-0.5" size={18} />;
                    } else if (r.status === 'skipped') {
                      cardClass = 'bg-amber-50 border-amber-100 text-amber-800';
                      icon = <Info className="text-amber-500 shrink-0 mt-0.5" size={18} />;
                    } else {
                      cardClass = 'bg-red-50 border-red-100 text-red-800';
                      icon = <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />;
                    }

                    return (
                      <div key={idx} className={`p-3 rounded-lg border text-sm flex items-start gap-3 ${cardClass}`}>
                        {icon}
                        <div className="flex-1">
                          <p className="font-semibold">{r.name}</p>
                          {r.status === 'error' && <p className="text-red-600 mt-1 text-xs">{r.message}</p>}
                          {r.status === 'skipped' && <p className="text-amber-600 mt-1 text-xs">{r.message}</p>}
                          {r.status === 'success' && (
                             <p className="text-emerald-700 mt-1 text-xs">Đã lưu: {r.entity?.name}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 md:p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
          <button onClick={onClose} disabled={loading} className="px-6 py-2.5 rounded-lg border border-slate-300 text-slate-600 font-medium hover:bg-slate-100 transition-colors disabled:opacity-50">
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
