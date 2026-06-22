'use client';

import { useState } from 'react';
import { BarChart3, Info } from 'lucide-react';

const STAT_FIELDS = [
  { key: 'ATT', label: 'Tấn công',    color: 'bg-red-500',     desc: 'Khả năng ghi bàn và dứt điểm' },
  { key: 'TEC', label: 'Kỹ thuật',    color: 'bg-blue-500',    desc: 'Kiểm soát bóng, rê dắt, chuyền' },
  { key: 'TAC', label: 'Chiến thuật', color: 'bg-indigo-500',  desc: 'Đọc trận, di chuyển chiến lược' },
  { key: 'DEF', label: 'Phòng ngự',   color: 'bg-emerald-500', desc: 'Cướp bóng, phá bóng, truy pressing' },
  { key: 'CRE', label: 'Sáng tạo',   color: 'bg-purple-500',  desc: 'Tầm nhìn, đường chuyền key pass' },
  { key: 'STA', label: 'Thể lực',    color: 'bg-orange-500',  desc: 'Sức bền, tốc độ, khả năng sprint' },
  { key: 'PHY', label: 'Thể hình',   color: 'bg-teal-500',    desc: 'Sức mạnh thể chất, không chiến' },
];

interface StatValues {
  [key: string]: number;
}

interface StatsData {
  attributes?: StatValues;
  averageRating?: string;
  [key: string]: any;
}

interface Props {
  name: string;
  defaultValue?: string; // JSON string
}

function parseDefault(raw: string): { attrs: StatValues; rating: string } {
  try {
    const parsed: StatsData = JSON.parse(raw || '{}');
    return {
      attrs: parsed.attributes || {},
      rating: parsed.averageRating || '',
    };
  } catch {
    return { attrs: {}, rating: '' };
  }
}

function getColor(val: number) {
  if (val >= 85) return 'bg-emerald-500';
  if (val >= 70) return 'bg-blue-500';
  if (val >= 55) return 'bg-yellow-400';
  if (val >= 40) return 'bg-orange-400';
  return 'bg-red-400';
}

export function StatsEditor({ name, defaultValue = '' }: Props) {
  const parsed = parseDefault(defaultValue);
  const [attrs, setAttrs]   = useState<StatValues>(parsed.attrs);
  const [rating, setRating] = useState(parsed.rating);

  const setValue = (key: string, val: number) => {
    const clamped = Math.min(100, Math.max(0, val));
    setAttrs(prev => {
      const next = { ...prev, [key]: clamped };
      const sum = STAT_FIELDS.reduce((acc, f) => acc + (next[f.key] ?? 0), 0);
      const avg = sum / STAT_FIELDS.length;
      const outOfTen = (avg / 10).toFixed(1);
      setRating(outOfTen);
      return next;
    });
  };

  const serialized = JSON.stringify({
    attributes: attrs,
    averageRating: rating,
  });

  return (
    <div className="space-y-5">
      <input type="hidden" name={name} value={serialized} />

      {/* Rating tổng */}
      <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
        <BarChart3 className="w-4 h-4 text-slate-400 shrink-0" />
        <label className="text-sm font-bold text-gray-700 shrink-0 w-32">Điểm trung bình</label>
        <input
          type="text"
          value={rating}
          onChange={e => setRating(e.target.value)}
          placeholder="VD: 7.8"
          className="w-24 px-3 py-1.5 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono text-center"
        />
        <span className="text-xs text-slate-400">/ 10</span>
      </div>

      {/* Các chỉ số */}
      <div className="space-y-3">
        {STAT_FIELDS.map(field => {
          const val = attrs[field.key] ?? 0;
          return (
            <div key={field.key} className="flex items-center gap-3">
              {/* Label */}
              <div className="w-28 shrink-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-gray-700">{field.label}</span>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1 py-0.5 rounded">{field.key}</span>
                </div>
              </div>

              {/* Slider */}
              <div className="flex-1 relative">
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-200 ${getColor(val)}`}
                    style={{ width: `${val}%` }}
                  />
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={val}
                  onChange={e => setValue(field.key, Number(e.target.value))}
                  className="absolute inset-0 w-full opacity-0 cursor-pointer h-2"
                />
              </div>

              {/* Number input */}
              <input
                type="number"
                min={0}
                max={100}
                value={val || ''}
                onChange={e => setValue(field.key, Number(e.target.value))}
                placeholder="0"
                className="w-16 px-2 py-1.5 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono text-center shrink-0"
              />

              {/* Score badge */}
              <div className={`w-8 h-6 rounded text-white text-[11px] font-black flex items-center justify-center shrink-0 ${getColor(val)}`}>
                {val || '–'}
              </div>
            </div>
          );
        })}
      </div>

      {/* Ghi chú */}
      <div className="flex items-start gap-2 text-xs text-slate-400 bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
        <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
        <span>Kéo thanh trượt hoặc nhập số (0–100). Dữ liệu được lưu dạng JSON tự động.</span>
      </div>
    </div>
  );
}
