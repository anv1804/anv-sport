'use client';

import { useState, useRef, useEffect } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { crawlClubs } from './actions';

const leagues = [
  "English Premier League",
  "Spanish La Liga",
  "Italian Serie A",
  "German Bundesliga",
  "French Ligue 1"
];

export function CrawlButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeLeague, setActiveLeague] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleCrawl = async (league: string) => {
    setIsLoading(true);
    setActiveLeague(league);
    setError('');
    setSuccess('');
    
    try {
      const result = await crawlClubs(league);
      if (result.success) {
        setSuccess(`Crawl thành công ${result.count} đội bóng!`);
        setTimeout(() => {
          setIsOpen(false);
          setSuccess('');
          setActiveLeague('');
        }, 2500);
      } else {
        setError(result.error || 'Có lỗi xảy ra khi lấy dữ liệu');
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg shadow-sm transition-colors flex items-center text-[13px]"
      >
        <Download className="w-4 h-4 mr-1.5" /> Crawl Tự động
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-72 bg-white border border-slate-200 shadow-xl rounded-xl p-3 z-50 animate-in fade-in zoom-in-95 duration-200">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-1">Chọn Giải đấu</h4>
          
          <div className="space-y-1">
            {leagues.map(league => (
              <button
                key={league}
                onClick={() => handleCrawl(league)}
                disabled={isLoading}
                className={`w-full text-left px-3 py-2.5 text-sm rounded-lg transition-colors flex items-center justify-between ${
                  isLoading && activeLeague !== league 
                    ? 'opacity-50 cursor-not-allowed text-slate-500' 
                    : 'text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 font-medium'
                }`}
              >
                {league}
                {isLoading && activeLeague === league && (
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                )}
              </button>
            ))}
          </div>

          {error && <div className="mt-3 text-[13px] font-medium text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-100">{error}</div>}
          {success && <div className="mt-3 text-[13px] font-medium text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-100">{success}</div>}
        </div>
      )}
    </div>
  );
}
