'use client';

import { useState, useRef } from 'react';
import { ChevronDown, X, Star, Check } from 'lucide-react';
import { FOOTBALL_POSITIONS } from '@/lib/constants';
import { useClickOutside } from '@/hooks/useClickOutside';

const COLOR_MAP: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  yellow: { bg: 'bg-yellow-50',  text: 'text-yellow-800', border: 'border-yellow-200', dot: 'bg-yellow-400' },
  blue:   { bg: 'bg-blue-50',    text: 'text-blue-800',   border: 'border-blue-200',   dot: 'bg-blue-400'   },
  green:  { bg: 'bg-emerald-50', text: 'text-emerald-800',border: 'border-emerald-200',dot: 'bg-emerald-400' },
  red:    { bg: 'bg-red-50',     text: 'text-red-800',    border: 'border-red-200',    dot: 'bg-red-400'    },
};

interface Props {
  name: string;
  defaultValues?: string[];
}

export function MultiPositionSelect({ name, defaultValues = [] }: Props) {
  const [selected, setSelected] = useState<string[]>(defaultValues);
  const [open, setOpen]         = useState(false);
  const ref                     = useRef<HTMLDivElement>(null);

  useClickOutside(ref, () => setOpen(false));

  const toggle = (val: string) => {
    setSelected(prev =>
      prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]
    );
  };

  const remove = (val: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelected(prev => prev.filter(v => v !== val));
  };

  const setPrimary = (val: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelected(prev => [val, ...prev.filter(v => v !== val)]);
  };

  const selectedPositions = selected
    .map(v => FOOTBALL_POSITIONS.find(p => p.value === v))
    .filter(Boolean) as typeof FOOTBALL_POSITIONS;

  return (
    <div ref={ref} className="relative space-y-2">
      <input type="hidden" name={name} value={JSON.stringify(selected)} />

      {/* Chips */}
      {selectedPositions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedPositions.map((pos, i) => {
            const clr = COLOR_MAP[pos.color] || COLOR_MAP.green;
            return (
              <div
                key={pos.value}
                className={`
                  inline-flex items-center gap-1 pl-1.5 pr-1 py-1 rounded-lg text-xs font-bold border transition-all
                  ${i === 0 ? `${clr.bg} ${clr.text} ${clr.border} ring-1 ${clr.border}` : 'bg-slate-50 text-slate-600 border-slate-200'}
                `}
              >
                <span className={`w-5 h-5 rounded text-[10px] font-black text-white flex items-center justify-center ${clr.dot}`}>
                  {pos.abbr}
                </span>
                <span className="mx-0.5">{pos.label}</span>
                {i === 0 ? (
                  <Star className={`w-3 h-3 ${clr.text} fill-current opacity-70`} />
                ) : (
                  <button type="button" onClick={(e) => setPrimary(pos.value, e)} title="Đặt làm vị trí chính" className="w-4 h-4 flex items-center justify-center text-slate-300 hover:text-emerald-500 transition-colors">
                    <Star className="w-3 h-3" />
                  </button>
                )}
                <button type="button" onClick={(e) => remove(pos.value, e)} className="w-4 h-4 flex items-center justify-center text-slate-300 hover:text-red-400 transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={`
          w-full h-[40px] px-3 py-2 text-sm rounded-lg border bg-white
          flex items-center gap-2 transition-all
          ${open ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-300 hover:border-emerald-400'}
        `}
      >
        <span className="text-slate-400 flex-1 text-left text-sm">
          {selected.length > 0 ? `${selected.length} vị trí đã chọn — nhấn để thêm` : '-- Chọn Vị Trí --'}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-300 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-[100] mt-0.5 w-full bg-white border border-slate-200 rounded-xl shadow-2xl shadow-slate-300/40 overflow-hidden">
          <div className="max-h-56 overflow-y-auto overscroll-contain py-1">
            {FOOTBALL_POSITIONS.map(pos => {
              const isSelected = selected.includes(pos.value);
              const idx = selected.indexOf(pos.value);
              const clr = COLOR_MAP[pos.color] || COLOR_MAP.green;
              return (
                <div
                  key={pos.value}
                  onClick={() => toggle(pos.value)}
                  className={`
                    px-3 py-1.5 cursor-pointer text-sm flex items-center gap-2 transition-colors
                    ${isSelected ? `${clr.bg}` : 'hover:bg-slate-50'}
                  `}
                >
                  <span className={`w-6 h-5 rounded text-[10px] font-black text-white flex items-center justify-center shrink-0 ${clr.dot}`}>
                    {pos.abbr}
                  </span>
                  <span className={`flex-1 ${isSelected ? `${clr.text} font-semibold` : 'text-gray-700'}`}>{pos.label}</span>
                  {isSelected && (
                    <div className="flex items-center gap-0.5 shrink-0">
                      {idx === 0 && <Star className={`w-3 h-3 ${clr.text} fill-current opacity-70`} />}
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="px-3 py-1.5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between text-xs text-slate-400">
            <span>{selected.length} đã chọn</span>
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
