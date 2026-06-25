'use client';

import { useState } from 'react';
import { Plus, X, GripVertical, Trophy } from 'lucide-react';

interface Props {
  name: string;
  defaultValue?: string; // JSON array string
}

function parseDefault(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw || '[]');
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export function AchievementsEditor({ name, defaultValue = '' }: Props) {
  const [items, setItems] = useState<string[]>(parseDefault(defaultValue));
  const update = (idx: number, val: string) => {
    setItems(prev => prev.map((item, i) => i === idx ? val : item));
  };

  const remove = (idx: number) => {
    setItems(prev => prev.filter((_, i) => i !== idx));
  };

  const add = () => {
    setItems(prev => [...prev, '']);
    setTimeout(() => {
      // Focus the last input
      const inputs = document.querySelectorAll('[data-achievement-input]');
      const last = inputs[inputs.length - 1] as HTMLInputElement;
      last?.focus();
    }, 50);
  };

  const moveUp = (idx: number) => {
    if (idx === 0) return;
    setItems(prev => {
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next;
    });
  };

  const moveDown = (idx: number) => {
    setItems(prev => {
      if (idx >= prev.length - 1) return prev;
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next;
    });
  };

  const serialized = JSON.stringify(items.filter(s => s.trim() !== ''));

  return (
    <div className="space-y-3">
      <input type="hidden" name={name} value={serialized} />

      {items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
          <Trophy className="w-8 h-8 mb-2 text-slate-300" />
          <p className="text-sm font-medium">Chưa có thành tích nào</p>
          <p className="text-xs">Nhấn nút bên dưới để thêm danh hiệu</p>
        </div>
      )}

      {/* List */}
      <div className="space-y-2">
        {items.map((item, idx) => (
          <div
            key={idx}
            className={`
              flex items-center gap-2 p-2 rounded-xl border transition-all
              ${idx === 0 ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200 hover:border-slate-300'}
            `}
          >
            {/* Drag handle / number */}
            <div className="flex items-center gap-1 shrink-0">
              <GripVertical className="w-3.5 h-3.5 text-slate-300" />
              <span className={`text-xs font-bold w-5 text-center ${idx === 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                {idx + 1}
              </span>
              {idx === 0 && <span className="text-xs text-amber-500">🏆</span>}
            </div>

            {/* Input */}
            <input
              type="text"
              value={item}
              onChange={e => update(idx, e.target.value)}
              data-achievement-input
              placeholder={`VD: ${idx === 0 ? 'Premier League: 2023-24' : 'FA Cup: 2019-20'}`}
              className={`
                flex-1 px-3 py-1.5 text-sm rounded-lg border focus:outline-none focus:ring-2 transition-colors
                ${idx === 0
                  ? 'bg-amber-50 border-amber-200 focus:ring-amber-400/20 focus:border-amber-400 placeholder:text-amber-300 text-amber-900 font-semibold'
                  : 'bg-white border-slate-200 focus:ring-emerald-500/20 focus:border-emerald-500 placeholder:text-slate-300 text-gray-700'
                }
              `}
            />

            {/* Move up/down */}
            <div className="flex flex-col gap-0.5 shrink-0">
              <button
                type="button"
                onClick={() => moveUp(idx)}
                disabled={idx === 0}
                className="w-5 h-4 text-[10px] text-slate-400 hover:text-slate-600 disabled:opacity-20 flex items-center justify-center"
              >▲</button>
              <button
                type="button"
                onClick={() => moveDown(idx)}
                disabled={idx === items.length - 1}
                className="w-5 h-4 text-[10px] text-slate-400 hover:text-slate-600 disabled:opacity-20 flex items-center justify-center"
              >▼</button>
            </div>

            {/* Remove */}
            <button
              type="button"
              onClick={() => remove(idx)}
              className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Add button */}
      <button
        type="button"
        onClick={add}
        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border-2 border-dashed border-emerald-200 text-emerald-600 text-sm font-semibold hover:border-emerald-400 hover:bg-emerald-50 transition-all"
      >
        <Plus className="w-4 h-4" />
        Thêm thành tích
      </button>

      {items.length > 0 && (
        <p className="text-xs text-slate-400 text-center">
          🏆 Thành tích đầu tiên là thành tích nổi bật nhất · {items.filter(s => s.trim()).length} mục
        </p>
      )}
    </div>
  );
}
