'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, X, ChevronDown, Star, Globe } from 'lucide-react';
import { COUNTRIES } from '@/lib/constants';
import { useClickOutside } from '@/hooks/useClickOutside';

function getFlagEmoji(iso2: string) {
  if (!iso2 || iso2.length < 2) return '🌐';
  return String.fromCodePoint(
    ...[...iso2.toUpperCase().slice(0, 2)].map(c => c.codePointAt(0)! + 127397)
  );
}

interface Props {
  name: string;
  defaultValues?: string[]; // array of country codes
}

export function MultiNationalityPicker({ name, defaultValues = [] }: Props) {
  const [selected, setSelected] = useState<string[]>(defaultValues);
  const [search, setSearch]     = useState('');
  const [open, setOpen]         = useState(false);
  const containerRef            = useRef<HTMLDivElement>(null);
  const searchRef               = useRef<HTMLInputElement>(null);

  useClickOutside(containerRef, () => {
    setOpen(false);
    setSearch('');
  });

  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 50);
  }, [open]);

  const toggle = (code: string) => {
    setSelected(prev =>
      prev.includes(code)
        ? prev.filter(c => c !== code)
        : [...prev, code]
    );
  };

  const remove = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelected(prev => prev.filter(c => c !== code));
  };

  const setPrimary = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelected(prev => [code, ...prev.filter(c => c !== code)]);
  };

  const filtered = COUNTRIES.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.code.toLowerCase().includes(search.toLowerCase())
  );

  const selectedCountries = selected
    .map(code => COUNTRIES.find(c => c.code === code))
    .filter(Boolean) as typeof COUNTRIES;

  return (
    <div ref={containerRef} className="relative space-y-2">
      {/* Hidden input – stores JSON array */}
      <input type="hidden" name={name} value={JSON.stringify(selected)} />

      {/* Selected chips */}
      {selectedCountries.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedCountries.map((c, i) => (
            <div
              key={c.code}
              className={`
                inline-flex items-center gap-1.5 pl-2 pr-1 py-1 rounded-lg text-xs font-semibold border transition-all
                ${i === 0
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 ring-1 ring-emerald-200'
                  : 'bg-slate-50 text-slate-600 border-slate-200'
                }
              `}
            >
              <span className="text-base leading-none">{getFlagEmoji(c.iso2)}</span>
              <span>{c.name}</span>
              <span className="font-mono text-[10px] opacity-60">{c.code}</span>
              {i === 0 ? (
                <Star className="w-3 h-3 text-emerald-500 fill-emerald-400" title="Quốc tịch chính" />
              ) : (
                <button
                  type="button"
                  onClick={(e) => setPrimary(c.code, e)}
                  title="Đặt làm quốc tịch chính"
                  className="w-4 h-4 flex items-center justify-center text-slate-300 hover:text-emerald-500 transition-colors"
                >
                  <Star className="w-3 h-3" />
                </button>
              )}
              <button
                type="button"
                onClick={(e) => remove(c.code, e)}
                className="w-4 h-4 flex items-center justify-center text-slate-300 hover:text-red-400 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={`
          w-full h-[40px] px-3 py-2 text-sm rounded-lg border bg-white
          flex items-center gap-2 transition-all
          ${open
            ? 'border-emerald-500 ring-2 ring-emerald-500/20'
            : 'border-slate-300 hover:border-emerald-400'
          }
        `}
      >
        <Globe className="w-4 h-4 text-slate-300 shrink-0" />
        <span className="text-slate-400 flex-1 text-left text-sm">
          {selected.length > 0
            ? `${selected.length} quốc tịch đã chọn — nhấn để thêm`
            : '-- Chọn Quốc Tịch --'}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-300 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-[100] mt-0.5 w-full bg-white border border-slate-200 rounded-xl shadow-2xl shadow-slate-300/40 overflow-hidden">

          {/* Search */}
          <div className="p-2 border-b border-slate-100 bg-slate-50">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Tìm quốc gia..."
                className="w-full pl-8 pr-3 py-1.5 text-sm rounded-md border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
              />
              {search && (
                <button type="button" onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2">
                  <X className="w-3 h-3 text-slate-400" />
                </button>
              )}
            </div>
          </div>

          {/* List – compact rows */}
          <div className="max-h-52 overflow-y-auto overscroll-contain">
            {filtered.length > 0 ? filtered.map(c => {
              const isSelected = selected.includes(c.code);
              const idx = selected.indexOf(c.code);
              return (
                <div
                  key={c.code}
                  onClick={() => toggle(c.code)}
                  className={`
                    px-3 py-1.5 cursor-pointer text-sm flex items-center gap-2 transition-colors
                    ${isSelected ? 'bg-emerald-50' : 'hover:bg-slate-50'}
                  `}
                >
                  <span className="text-lg w-6 text-center leading-none shrink-0">{getFlagEmoji(c.iso2)}</span>
                  <span className={`flex-1 truncate ${isSelected ? 'text-emerald-800 font-semibold' : 'text-gray-700'}`}>{c.name}</span>
                  <span className="text-[11px] font-mono text-slate-400 shrink-0">{c.code}</span>
                  {isSelected && (
                    <div className="flex items-center gap-0.5 shrink-0">
                      {idx === 0 && <Star className="w-3 h-3 text-emerald-400 fill-emerald-300" />}
                      <div className="w-4 h-4 rounded bg-emerald-500 flex items-center justify-center">
                        <span className="text-white text-[10px] font-bold">✓</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            }) : (
              <div className="px-4 py-6 text-center text-sm text-slate-400">Không tìm thấy</div>
            )}
          </div>

          {/* Footer */}
          <div className="px-3 py-1.5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between text-xs text-slate-400">
            <span>{filtered.length} quốc gia · {selected.length} đã chọn</span>
            {selected.length > 0 && (
              <button type="button" onClick={() => setSelected([])} className="text-red-400 hover:text-red-600 transition-colors">
                Xóa tất cả
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
