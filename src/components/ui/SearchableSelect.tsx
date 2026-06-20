'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Check, CornerDownRight } from 'lucide-react';

type Option = {
  value: string;
  label: string;
  group?: string;
  depth?: number;
};

type SearchableSelectProps = {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  size?: "sm" | "md";
};

export function SearchableSelect({ options, value, onChange, placeholder = "Chọn...", className = "", size = "md" }: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedOption = useMemo(() => options.find(o => o.value === value), [options, value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = useMemo(() => {
    if (!isOpen) return []; // Không tính toán khi dropdown đang đóng, tiết kiệm 99% CPU
    return options.filter(o => 
      o.label.toLowerCase().includes(search.toLowerCase()) || 
      (o.group && o.group.toLowerCase().includes(search.toLowerCase()))
    ).slice(0, 100); // Chỉ render tối đa 100 kết quả để chống tràn DOM
  }, [options, search, isOpen]);

  const groups = useMemo(() => Array.from(new Set(filteredOptions.map(o => o.group || 'Khác'))), [filteredOptions]);

  const containerClasses = size === "sm" 
    ? "w-full bg-white border border-slate-300 rounded-md px-2 py-1 text-xs flex items-center justify-between cursor-pointer hover:border-emerald-500 transition-colors h-[28px]"
    : "w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-sm flex items-center justify-between cursor-pointer hover:border-emerald-500 transition-colors";

  return (
    <div className={`relative ${className}`} ref={wrapperRef}>
      <div 
        className={containerClasses}
        onClick={() => { setIsOpen(!isOpen); setSearch(''); }}
      >
        <span className={selectedOption ? 'text-slate-800 font-medium' : 'text-slate-400'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute right-0 z-50 w-max min-w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-64 flex flex-col overflow-hidden">
          <div className="p-2 border-b border-slate-100 flex items-center gap-2 bg-slate-50 shrink-0">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input 
              type="text"
              autoFocus
              className="w-full bg-transparent outline-none text-[13px] text-slate-700 placeholder:text-slate-400"
              placeholder="Tìm kiếm..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="overflow-y-auto flex-1 p-1">
            {filteredOptions.length === 0 ? (
              <div className="p-3 text-center text-sm text-slate-500 italic">Không tìm thấy kết quả</div>
            ) : (
              groups.map(group => (
                <div key={group} className="mb-1 last:mb-0">
                  {group !== 'Khác' && (
                    <div className="px-2 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50 rounded-sm mb-0.5">
                      {group}
                    </div>
                  )}
                  {filteredOptions.filter(o => (o.group || 'Khác') === group).map(option => (
                    <div
                      key={option.value}
                      className={`py-2 text-sm rounded-md cursor-pointer flex items-center transition-colors ${
                        value === option.value ? 'bg-emerald-50 text-emerald-700 font-bold' : 'hover:bg-slate-100 text-slate-700'
                      }`}
                      style={{ paddingLeft: option.depth ? `${option.depth * 1.2 + 0.5}rem` : '0.5rem', paddingRight: '0.5rem' }}
                      onClick={() => {
                        onChange(option.value);
                        setIsOpen(false);
                      }}
                    >
                      {option.depth && option.depth > 0 ? (
                        <CornerDownRight className="w-3 h-3 text-slate-400 mr-2 shrink-0" />
                      ) : null}
                      <span className="truncate flex-1">{option.label}</span>
                      {value === option.value && <Check className="w-4 h-4 ml-2 shrink-0" />}
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
