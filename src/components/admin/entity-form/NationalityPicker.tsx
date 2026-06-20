'use client';

import { useState, useRef, useEffect } from 'react';
import { COUNTRIES } from '@/lib/constants';
import { Search, ChevronDown, X, Globe } from 'lucide-react';
import { useClickOutside } from '@/hooks/useClickOutside';

function getFlagEmoji(iso2: string) {
  if (!iso2 || iso2.length < 2) return '🌐';
  const code = iso2.toUpperCase().slice(0, 2);
  return String.fromCodePoint(
    ...[...code].map(c => c.codePointAt(0)! + 127397)
  );
}

interface Props {
  name: string;
  defaultValue?: string;
}

export function NationalityPicker({ name, defaultValue = '' }: Props) {
  const [selected, setSelected] = useState(defaultValue);
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

  const selectedCountry = COUNTRIES.find(c => c.code === selected);

  const filtered = search.trim()
    ? COUNTRIES.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.code.toLowerCase().includes(search.toLowerCase())
      )
    : COUNTRIES;

  const pick = (code: string) => {
    setSelected(code);
    setOpen(false);
    setSearch('');
  };

  return (
    <div ref={containerRef} className="relative">
      <input type="hidden" name={name} value={selected} />

      {/* ── Trigger ── */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={`
          w-full h-[42px] px-3 py-2 text-sm rounded-lg border bg-white
          flex items-center gap-2.5 transition-all group
          ${open
            ? 'border-emerald-500 ring-2 ring-emerald-500/20'
            : 'border-slate-300 hover:border-emerald-400'
          }
        `}
      >
        {selectedCountry ? (
          <>
            <span className="text-xl leading-none w-7 text-center">{getFlagEmoji(selectedCountry.iso2)}</span>
            <span className="text-gray-800 font-medium flex-1 text-left">{selectedCountry.name}</span>
            <span className="text-[11px] text-slate-400 font-mono bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
              {selectedCountry.code}
            </span>
            <X
              className="w-3.5 h-3.5 text-slate-300 hover:text-red-400 shrink-0 transition-colors"
              onClick={e => { e.stopPropagation(); setSelected(''); }}
            />
          </>
        ) : (
          <>
            <Globe className="w-4 h-4 text-slate-300 shrink-0" />
            <span className="text-slate-400 flex-1 text-left">-- Chọn Quốc Tịch --</span>
            <ChevronDown className={`w-4 h-4 text-slate-300 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
          </>
        )}
      </button>

      {/* ── Dropdown ── */}
      {open && (
        <div className="absolute z-[100] mt-1.5 w-full min-w-[260px] bg-white border border-slate-200 rounded-xl shadow-2xl shadow-slate-300/40 overflow-hidden">

          {/* Search */}
          <div className="p-2.5 border-b border-slate-100 bg-slate-50">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Tìm theo tên hoặc mã quốc gia..."
                className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 placeholder:text-slate-400"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div className="max-h-64 overflow-y-auto overscroll-contain">
            {/* Reset option */}
            <div
              className="px-3 py-2 hover:bg-slate-50 cursor-pointer text-sm text-slate-400 italic border-b border-slate-50"
              onClick={() => pick('')}
            >
              Không chọn
            </div>

            {filtered.length > 0 ? filtered.map(c => (
              <div
                key={c.code}
                onClick={() => pick(c.code)}
                className={`
                  px-3 py-2 cursor-pointer text-sm flex items-center gap-2.5 transition-colors
                  ${selected === c.code
                    ? 'bg-emerald-50 text-emerald-800 font-semibold'
                    : 'hover:bg-slate-50 text-gray-700'
                  }
                `}
              >
                <span className="text-xl w-7 text-center leading-none shrink-0">{getFlagEmoji(c.iso2)}</span>
                <span className="flex-1 truncate">{c.name}</span>
                <span className="text-[11px] font-mono text-slate-400 shrink-0">{c.code}</span>
                {selected === c.code && <span className="text-emerald-500 text-xs shrink-0">✓</span>}
              </div>
            )) : (
              <div className="px-4 py-8 text-center">
                <Globe className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                <p className="text-sm text-slate-400">Không tìm thấy quốc gia nào</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-3 py-1.5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between">
            <span className="text-xs text-slate-400">{filtered.length} quốc gia</span>
            {selected && selectedCountry && (
              <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                <span>{getFlagEmoji(selectedCountry.iso2)}</span>
                {selectedCountry.name}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
