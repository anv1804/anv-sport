import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Search, ChevronDown, CornerDownRight } from 'lucide-react';

export type CategoryOption = { 
  id: string; 
  name: string; 
  depth: number;
  group?: string; 
};

type CategorySearchSelectProps = { 
  value: string; 
  onChange: (val: string) => void; 
  options: CategoryOption[];
  placeholder?: string;
  className?: string;
};

export const CategorySearchSelect = ({ 
  value, 
  onChange, 
  options,
  placeholder = '-- Chọn danh mục --',
  className = ''
}: CategorySearchSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [rect, setRect] = useState<DOMRect | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const selected = useMemo(() => options.find(o => o.id === value), [options, value]);
  const displayValue = selected ? selected.name : placeholder;

  const filtered = useMemo(() => {
    if (!isOpen) return []; // Dừng mọi tính toán khi ẩn
    return options.filter(o => 
      o.name.toLowerCase().includes(search.toLowerCase()) ||
      (o.group && o.group.toLowerCase().includes(search.toLowerCase()))
    ).slice(0, 100); // Giới hạn 100 dòng để không giật lag DOM
  }, [options, search, isOpen]);

  const groups = useMemo(() => Array.from(new Set(filtered.map(o => o.group || 'Khác'))), [filtered]);

  return (
    <div className={`relative w-full ${className}`} ref={triggerRef}>
      <div 
        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm cursor-pointer flex justify-between items-center focus:ring-2 focus:ring-emerald-500/50"
        onClick={() => { setIsOpen(!isOpen); setSearch(''); }}
      >
        <span className="truncate">{displayValue}</span>
        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
      </div>
      
      {isOpen && (
        <div 
          ref={dropdownRef}
          className="absolute left-0 top-full mt-1 z-[110] w-full bg-white border border-slate-200 shadow-xl rounded-lg max-h-60 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-1 duration-100 flex flex-col"
        >
          <div className="p-2 sticky top-0 bg-white border-b border-slate-200 z-10 shrink-0">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Tìm kiếm..."
                className="w-full pl-8 pr-3 py-1.5 text-sm bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          <div className="p-1 flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="p-2 text-sm text-slate-500 text-center">Không tìm thấy</div>
            ) : (
              groups.map(group => (
                <div key={group} className="mb-1 last:mb-0">
                  {group !== 'Khác' && (
                    <div className="px-2 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50 rounded-sm mb-0.5">
                      {group}
                    </div>
                  )}
                  {filtered.filter(o => (o.group || 'Khác') === group).map(opt => (
                    <div 
                      key={opt.id}
                      className={`px-3 py-2 text-sm rounded-md cursor-pointer hover:bg-emerald-100 hover:text-emerald-700 flex items-center ${opt.id === value ? 'bg-emerald-100 text-emerald-700 font-medium' : 'text-slate-700'}`}
                      style={{ paddingLeft: `${opt.depth * 1.2 + 0.75}rem` }}
                      onClick={() => {
                        onChange(opt.id);
                        setIsOpen(false);
                        setSearch('');
                      }}
                    >
                      {opt.depth > 0 && <CornerDownRight className="w-3 h-3 text-slate-400 mr-2 shrink-0" />}
                      <span className="truncate">{opt.name}</span>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
