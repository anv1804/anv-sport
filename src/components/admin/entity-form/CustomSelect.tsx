'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search } from 'lucide-react';
import { useClickOutside } from '@/hooks/useClickOutside';

interface Option {
  value: string;
  label: string;
  abbr?: string;
  color?: string;
  icon?: string;
  image?: string;
}

interface Props {
  name?: string;
  options: Option[];
  defaultValue?: string;
  value?: string;
  onChange?: (val: string) => void;
  placeholder?: string;
  disabled?: boolean;
  menuPlacement?: 'top' | 'bottom';
}

const colorMap: Record<string, string> = {
  yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  blue:   'bg-blue-100   text-blue-700   border-blue-200',
  green:  'bg-emerald-100 text-emerald-700 border-emerald-200',
  red:    'bg-red-100    text-red-700    border-red-200',
};

export function CustomSelect({ name, options, defaultValue = '', value, onChange, placeholder = '-- Chọn --', disabled = false, menuPlacement = 'bottom' }: Props) {
  const [internalSelected, setInternalSelected] = useState(defaultValue);
  const selected = value !== undefined ? value : internalSelected;
  const handleSelect = (val: string) => {
    if (value === undefined) setInternalSelected(val);
    if (onChange) onChange(val);
  };
  const [open, setOpen]         = useState(false);
  const ref                     = useRef<HTMLDivElement>(null);

  const [searchTerm, setSearchTerm] = useState('');

  // Clear search term when dropdown closes
  useEffect(() => {
    if (!open) {
      setSearchTerm('');
    }
  }, [open]);

  useClickOutside(ref, () => setOpen(false));

  const filteredOptions = options.filter(o => o.label.toLowerCase().includes(searchTerm.toLowerCase()));

  const selectedOption = options.find(o => o.value === selected);

  return (
    <div ref={ref} className="relative">
      {name && <input type="hidden" name={name} value={selected} />}

      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(v => !v)}
        className={`
          w-full h-[42px] px-3 py-2 text-sm rounded-lg border
          flex items-center gap-2 transition-all
          ${disabled ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-70' : 'bg-white text-gray-800'}
          ${open && !disabled
            ? 'border-emerald-500 ring-2 ring-emerald-500/20'
            : !disabled ? 'border-slate-300 hover:border-slate-400' : ''
          }
        `}
      >
        {selectedOption ? (
          <>
            {selectedOption.image && <img src={selectedOption.image} alt="" className="w-5 h-5 object-contain" />}
            {selectedOption.icon && <span className="text-lg">{selectedOption.icon}</span>}
            {selectedOption.abbr && (
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded border ${colorMap[selectedOption.color || 'green'] || colorMap.green}`}>
                {selectedOption.abbr}
              </span>
            )}
            <span className={`font-medium flex-1 text-left ${disabled ? 'text-slate-400' : 'text-gray-800'}`}>{selectedOption.label}</span>
          </>
        ) : (
          <span className="text-gray-400 flex-1 text-left">{placeholder}</span>
        )}
        <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''} ${disabled ? 'text-slate-300' : 'text-slate-400'}`} />
      </button>

      {open && (
        <div className={`absolute z-50 w-full bg-white border border-slate-200 rounded-xl shadow-2xl shadow-slate-200/80 overflow-hidden max-h-80 flex flex-col ${menuPlacement === 'top' ? 'bottom-full mb-1.5' : 'top-full mt-1.5'}`}>
          {options.length > 5 && (
            <div className="p-2 border-b border-slate-100 sticky top-0 bg-white z-10 shrink-0">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm kiếm..."
                  className="w-full text-sm pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  autoFocus
                />
              </div>
            </div>
          )}
          
          <div className="overflow-y-auto flex-1 p-1">
            <div
              className="px-3 py-2.5 rounded-lg hover:bg-slate-50 cursor-pointer text-sm text-gray-400"
              onClick={() => { handleSelect(''); setOpen(false); }}
            >
              {placeholder}
            </div>
            
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-4 text-center text-sm text-slate-400">
                Không tìm thấy kết quả
              </div>
            ) : (
              filteredOptions.map(o => (
                <div
                  key={o.value}
                  onClick={() => { handleSelect(o.value); setOpen(false); }}
                  className={`
                    px-3 py-2.5 rounded-lg cursor-pointer text-sm flex items-center gap-2.5 transition-colors
                    ${selected === o.value
                      ? 'bg-emerald-50 text-emerald-800 font-semibold'
                      : 'hover:bg-slate-50 text-gray-700'
                    }
                  `}
                >
                  {o.image && <img src={o.image} alt="" className="w-5 h-5 object-contain" />}
                  {o.icon && <span className="text-xl">{o.icon}</span>}
                  {o.abbr && (
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded border min-w-[32px] text-center ${colorMap[o.color || 'green'] || colorMap.green}`}>
                      {o.abbr}
                    </span>
                  )}
                  <span className="flex-1">{o.label}</span>
                  {selected === o.value && <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
