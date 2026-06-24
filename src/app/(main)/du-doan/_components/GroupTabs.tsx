"use client";

import { ChevronRight } from 'lucide-react';
import { useScrollDrag } from './hooks/useScrollDrag';

interface Props {
  tabs: string[];
  selectedGroup: string;
  onSelect: (group: string) => void;
}

export default function GroupTabs({ tabs, selectedGroup, onSelect }: Props) {
  const { ref, canScroll, scrollDirection, scrollBy } = useScrollDrag(tabs.join(','));

  if (tabs.length <= 1) return null;

  return (
    <div className="relative flex items-center mb-4 md:mb-6 border-b border-slate-200/60 pb-4">
      <div
        ref={ref}
        className="flex items-center gap-2 overflow-x-auto w-full scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {tabs.map((grp) => {
          const value = grp === 'Tất cả' ? 'all' : grp;
          return (
            <button
              key={grp}
              onClick={() => onSelect(value)}
              className={[
                'px-4.5 py-1.5 rounded-full text-[12px] font-bold uppercase tracking-wide transition-all duration-200 whitespace-nowrap',
                selectedGroup === value
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'text-slate-500 hover:text-slate-800 bg-transparent',
              ].join(' ')}
            >
              {grp}
            </button>
          );
        })}
        <div className="w-4 shrink-0" />
      </div>

      {canScroll && (
        <div className="absolute right-0 top-0 bottom-4 w-12 bg-gradient-to-l from-white via-white/75 to-transparent pointer-events-none flex items-center justify-end pr-1">
          <button
            onClick={() => scrollBy(scrollDirection === 'next' ? 240 : -240)}
            className="pointer-events-auto w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-all shadow active:scale-95"
          >
            <ChevronRight className={`w-3.5 h-3.5 ${scrollDirection === 'prev' ? 'rotate-180' : ''}`} />
          </button>
        </div>
      )}
    </div>
  );
}
