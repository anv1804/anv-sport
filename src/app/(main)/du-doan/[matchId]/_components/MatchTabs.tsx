"use client";

export type TabKey = 'dienbien' | 'doihinh' | 'thongke';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'dienbien', label: 'Diễn biến' },
  { key: 'doihinh', label: 'Đội hình' },
  { key: 'thongke', label: 'Thống kê' },
];

interface Props {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
}

export default function MatchTabs({ activeTab, onTabChange }: Props) {
  return (
    <div className="flex border-b-2 border-slate-100 bg-white px-2">
      {TABS.map(tab => (
        <button
          key={tab.key}
          onClick={() => onTabChange(tab.key)}
          className={`flex-1 py-4 text-center text-[13px] font-black uppercase tracking-wider transition-colors ${
            activeTab === tab.key
              ? 'text-green-600 border-b-4 border-green-600'
              : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
