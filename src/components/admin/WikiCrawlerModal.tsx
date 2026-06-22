'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Search, Loader2, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { CustomSelect } from './entity-form/CustomSelect';

export function WikiCrawlerModal({ 
  isOpen, 
  onClose, 
  onRefresh,
  clubs = [],
  countries = []
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onRefresh: () => void;
  clubs?: { id: string; name: string; countryId: string | null }[];
  countries?: { id: string; name: string }[];
}) {
  const [names, setNames] = useState('');
  const [lang, setLang] = useState('vi');
  const [selectedCountryId, setSelectedCountryId] = useState('');
  const [selectedClubId, setSelectedClubId] = useState('');
  const [loading, setLoading] = useState(false);

  // Reset selected club if it doesn't belong to the newly selected country
  useEffect(() => {
    if (selectedCountryId) {
      const isClubInCountry = clubs.some(c => c.id === selectedClubId && c.countryId === selectedCountryId);
      if (!isClubInCountry) {
        setSelectedClubId('');
      }
    }
  }, [selectedCountryId, clubs, selectedClubId]);
  const [results, setResults] = useState<any[]>([]);
  const [progress, setProgress] = useState(0);
  const [currentName, setCurrentName] = useState('');
  const [processedCount, setProcessedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Poll progress state from server
  const pollProgress = async () => {
    try {
      const res = await fetch('/api/admin/crawler/wiki');
      const data = await res.json();

      if (data.success && data.progress) {
        const prog = data.progress;
        setResults(prog.results || []);
        setProcessedCount(prog.processed || 0);
        setTotalCount(prog.total || 0);
        setCurrentName(prog.currentName || '');
        
        if (prog.total > 0) {
          setProgress(Math.round((prog.processed / prog.total) * 100));
        }

        if (prog.status === 'running') {
          setLoading(true);
        } else if (prog.status === 'completed' || prog.status === 'failed') {
          setLoading(false);
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
          onRefresh();
        }
      }
    } catch (err) {
      console.error('Error polling crawler progress:', err);
    }
  };

  // Start polling on mount/open
  useEffect(() => {
    if (isOpen) {
      pollProgress(); // Instant check
      pollingRef.current = setInterval(pollProgress, 1500);
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [isOpen]);

  const handleCrawl = async () => {
    const nameList = names
      .split(/[\n,]/)
      .map(n => n.trim())
      .filter(n => n.length > 0);

    if (nameList.length === 0 && !selectedClubId) return;

    setLoading(true);
    setResults([]);
    setProgress(0);
    setProcessedCount(0);
    setTotalCount(nameList.length || 25); // Estimated for club crawl

    try {
      const res = await fetch('/api/admin/crawler/wiki', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'start', 
          names, 
          lang,
          clubId: selectedClubId || undefined
        })
      });

      const data = await res.json();
      if (data.success) {
        // Start polling immediately
        if (pollingRef.current) clearInterval(pollingRef.current);
        pollingRef.current = setInterval(pollProgress, 1500);
      } else {
        setLoading(false);
        alert(data.error || 'Không thể bắt đầu tiến trình crawl.');
      }
    } catch (error) {
      setLoading(false);
      alert('Lỗi kết nối tới máy chủ');
    }
  };

  const handleStop = async () => {
    try {
      const res = await fetch('/api/admin/crawler/wiki', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stop' })
      });
      const data = await res.json();
      if (data.success) {
        setLoading(false);
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
      }
    } catch (e) {
      console.error("Error stopping crawler:", e);
    }
  };

  const handleClose = async () => {
    // If completed or failed, clear the session on close so it starts fresh next time
    if (!loading) {
      try {
        await fetch('/api/admin/crawler/wiki', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'clear' })
        });
      } catch (e) {}
    }
    onClose();
  };

  if (!isOpen) return null;

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
          <button onClick={handleClose} className="text-slate-400 hover:text-slate-600 transition-colors p-2 rounded-full hover:bg-slate-200">
            <X size={24} />
          </button>
        </div>

        <div className="p-4 md:p-6 overflow-y-auto flex-1">
          <div className="space-y-4">
            {!loading && processedCount === 0 && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Ngôn ngữ Wikipedia</label>
                    <CustomSelect 
                      value={lang} 
                      onChange={setLang} 
                      options={[
                        { value: 'vi', label: 'Tiếng Việt (vi.wikipedia.org)' },
                        { value: 'en', label: 'Tiếng Anh (en.wikipedia.org) - Khuyên dùng' }
                      ]} 
                      placeholder="-- Chọn ngôn ngữ --"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Lọc theo Quốc gia</label>
                    <CustomSelect 
                      value={selectedCountryId} 
                      onChange={setSelectedCountryId} 
                      options={[
                        { value: '', label: '-- Tất cả quốc gia --' },
                        ...countries.map(c => ({ value: c.id, label: c.name }))
                      ]} 
                      placeholder="-- Chọn quốc gia --"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Cào toàn bộ đội hình CLB</label>
                    <CustomSelect 
                      value={selectedClubId} 
                      onChange={setSelectedClubId} 
                      options={[
                        { value: '', label: '-- Không chọn (Nhập thủ công) --' },
                        ...clubs
                          .filter(c => !selectedCountryId || c.countryId === selectedCountryId)
                          .map(c => ({ value: c.id, label: c.name }))
                      ]} 
                      placeholder="-- Chọn CLB --"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    {selectedClubId ? 'Danh sách cầu thủ bổ sung (Không bắt buộc)' : 'Danh sách cầu thủ'}
                  </label>
                  <textarea 
                    value={names}
                    onChange={e => setNames(e.target.value)}
                    placeholder={selectedClubId 
                      ? "Nhập thêm các tên cầu thủ khác nếu muốn cào đồng thời..." 
                      : "Nhập tên cầu thủ, mỗi tên một dòng (hoặc cách nhau bằng dấu phẩy).\nVí dụ:\nLionel Messi\nCristiano Ronaldo"
                    }
                    className="w-full h-32 px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none text-sm"
                    disabled={loading}
                  />
                  {selectedClubId && (
                    <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                      <Info size={14} /> Hệ thống sẽ tự động quét & cào danh sách cầu thủ của câu lạc bộ đã chọn từ TheSportsDB.
                    </p>
                  )}
                </div>
              </>
            )}
            
            {(loading || processedCount > 0) && (
              <div className="space-y-2 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div className="flex justify-between items-center text-sm font-medium text-slate-700">
                  <span className="flex items-center gap-2">
                    {loading ? (
                      <Loader2 size={16} className="animate-spin text-emerald-600" />
                    ) : (
                      <CheckCircle size={16} className="text-emerald-600" />
                    )}
                    {loading ? (
                      <>Đang xử lý: <span className="text-emerald-700 font-semibold">{currentName}</span></>
                    ) : (
                      <span className="text-emerald-700 font-semibold">Đã hoàn thành tiến trình crawl</span>
                    )}
                  </span>
                  <div className="flex items-center gap-3">
                    {loading && (
                      <button 
                        onClick={handleStop}
                        className="px-2.5 py-1 text-xs bg-red-100 hover:bg-red-200 text-red-700 font-bold rounded-lg transition-colors"
                      >
                        Dừng lại
                      </button>
                    )}
                    <span>{processedCount}/{totalCount} ({progress}%)</span>
                  </div>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-emerald-600 h-2.5 rounded-full transition-all duration-300" 
                    style={{ width: `${progress}%` }}
                  />
                </div>
                {!loading && (
                  <p className="text-xs text-slate-400 italic mt-1">Bạn có thể đóng bảng này để bắt đầu lượt cào mới.</p>
                )}
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
          <button onClick={handleClose} className="px-6 py-2.5 rounded-lg border border-slate-300 text-slate-600 font-medium hover:bg-slate-100 transition-colors">
            Đóng
          </button>
          {!loading && processedCount === 0 && (
            <button 
              onClick={handleCrawl} 
              disabled={loading || (!names.trim() && !selectedClubId)}
              className="px-6 py-2.5 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              Bắt đầu Crawl
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
