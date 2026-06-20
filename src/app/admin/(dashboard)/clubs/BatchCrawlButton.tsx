'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Download, Loader2 } from 'lucide-react';
import { batchExtractWikipediaClubs } from './actions';
import toast from 'react-hot-toast';

export function BatchCrawlButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [links, setLinks] = useState('');
  const [isCrawling, setIsCrawling] = useState(false);
  const [results, setResults] = useState<{url: string, status: string, name?: string, error?: string}[] | null>(null);

  const handleCrawl = async () => {
    const urlList = links.split('\n').map(l => l.trim()).filter(l => l);
    if (urlList.length === 0) return;

    setIsCrawling(true);
    setResults(null);
    try {
      const res = await batchExtractWikipediaClubs(urlList);
      if (res.success) {
        setResults(res.results || []);
        toast.success(`Crawl thành công ${res.results?.filter(r => r.status === 'success').length} mục`);
      } else {
        toast.error(res.error || 'Có lỗi xảy ra.');
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsCrawling(false);
    }
  };

  return (
    <>
      <Button 
        type="button"
        variant="outline"
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50 font-bold rounded-lg shadow-sm transition-colors flex items-center text-[13px]"
      >
        <Download className="w-4 h-4 mr-1.5" /> Crawl từ Wiki
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800">Crawl nhiều Câu lạc bộ từ Wikipedia</h2>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto space-y-4">
              <div>
                <label className="text-[13px] font-bold text-slate-700 mb-2 block">Danh sách Link Wikipedia (mỗi link 1 dòng)</label>
                <textarea 
                  value={links}
                  onChange={e => setLinks(e.target.value)}
                  placeholder="https://vi.wikipedia.org/wiki/Liverpool_F.C.&#10;https://vi.wikipedia.org/wiki/Manchester_United_F.C."
                  className="w-full h-40 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-[13px] resize-none"
                  disabled={isCrawling}
                />
              </div>

              {results && (
                <div className="space-y-2 mt-4">
                  <h3 className="text-[13px] font-bold text-slate-700">Kết quả:</h3>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar pr-2">
                    {results.map((r, i) => (
                      <div key={i} className={`p-3 rounded-lg text-[13px] border ${r.status === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
                        <div className="font-medium truncate">{r.url}</div>
                        {r.status === 'success' ? (
                          <div className="text-emerald-600 mt-1">✓ Thành công: {r.name}</div>
                        ) : (
                          <div className="text-red-600 mt-1">✕ Lỗi: {r.error}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isCrawling}>
                Đóng
              </Button>
              <Button onClick={handleCrawl} disabled={isCrawling || !links.trim()} className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[140px]">
                {isCrawling ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Đang Crawl...</> : 'Bắt đầu Crawl'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
