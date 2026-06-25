"use client";

import { useState, useEffect, useMemo } from 'react';
import { Search, Trophy, ChevronRight } from 'lucide-react';
import HeroSection from './_components/HeroSection';
import FeaturedMatchCard from './_components/FeaturedMatchCard';
import AiPostsFeed from './_components/AiPostsFeed';
import GroupTabs from './_components/GroupTabs';
import PillGroup from './_components/PillGroup';
import MatchList from './_components/MatchList';
import Sidebar from './_components/Sidebar';
import { parseDateToTimestamp, TAB_TO_ROUND_KEY, type Fixture, readStored, readStoredString, getLocalDateString } from './_components/helpers';

interface Post {
  id: number;
  title: string;
  excerpt: string | null;
  imageUrl: string | null;
  createdAt: string;
}

interface PredictionClientPageProps {
  initialAiPosts?: Post[];
}

type FilterType = 'all' | 'live' | 'finished' | 'upcoming';
type DateFilter = 'all' | 'yesterday' | 'today' | 'tomorrow';

const FILTER_TYPE_OPTIONS = [
  { value: 'all', label: 'Tất cả' },
  { value: 'live', label: 'Đang đấu' },
  { value: 'finished', label: 'Đã đấu' },
  { value: 'upcoming', label: 'Chưa đấu' },
] satisfies { value: FilterType; label: string }[];

const WORLD_CUP_TABS = [
  'Tất cả',
  'Group A', 'Group B', 'Group C', 'Group D', 'Group E', 'Group F',
  'Group G', 'Group H', 'Group I', 'Group J', 'Group K', 'Group L',
  'Vòng 32 đội', 'Vòng 16 đội', 'Tứ kết', 'Bán kết', 'Chung kết',
];

// SWR memory cache for instant 0ms back-navigation
// Không cache khi có live match - luôn fetch fresh để lấy liveClock mới nhất
let globalFixturesCache: Fixture[] = [];

export default function PredictionClientPage({ initialAiPosts = [] }: PredictionClientPageProps) {
  const [fixtures, setFixtures] = useState<Fixture[]>(() => {
    // Bỏ qua cache nếu có live match — buộc re-fetch để lấy liveClock chính xác
    if (globalFixturesCache.some(f => f.status === 'Đang đấu')) return [];
    return globalFixturesCache;
  });
  const [loading, setLoading] = useState(() =>
    globalFixturesCache.length === 0 || globalFixturesCache.some(f => f.status === 'Đang đấu')
  );
  const [error, setError] = useState<string | null>(null);

  // Khởi tạo bằng giá trị mặc định để SSR và client lần đầu render giống nhau (tránh hydration mismatch)
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('today');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedGroup, setSelectedGroup] = useState('all');

  // Sau khi hydration xong mới đọc localStorage và khôi phục giá trị đã lưu
  useEffect(() => {
    const savedFilterType = readStored('pred_filterType', ['all', 'live', 'finished', 'upcoming'] as const, 'all');
    const savedDateFilter = readStored('pred_dateFilter', ['all', 'yesterday', 'today', 'tomorrow'] as const, 'today');
    const savedCategory = readStoredString('pred_selectedCategory', 'all');
    const savedGroup = readStoredString('pred_selectedGroup', 'all');
    setFilterType(savedFilterType);
    setDateFilter(savedDateFilter);
    setSelectedCategory(savedCategory);
    setSelectedGroup(savedGroup);
  }, []);

  const activeSport = 'bongda';

  useEffect(() => {
    const intervalRef = { current: null as ReturnType<typeof setInterval> | null };

    const fetchFixtures = async () => {
      try {
        const res = await fetch('/api/fixtures');
        const data = await res.json() as { success: boolean; data: Fixture[]; error?: string };
        if (data.success) {
          const worldCupOnly = data.data
            .filter(f => f.category && (
              f.category.startsWith('FIFA World Cup 2026') ||
              f.category.toLowerCase().includes('world cup')
            ))
            .map(f => ({ ...f, sportType: 'bongda' }));
          globalFixturesCache = worldCupOnly;
          setFixtures(worldCupOnly);
          setError(null);
          return worldCupOnly;
        } else {
          setError(data.error ?? 'Unknown error');
        }
      } catch (err) {
        console.error('Lỗi khi fetch lịch thi đấu', err);
        setError('Lỗi kết nối máy chủ API lịch thi đấu');
      } finally {
        setLoading(false);
      }
      return null;
    };

    fetchFixtures().then(data => {
      if (!data?.some(f => f.status === 'Đang đấu')) return;
      // Có trận live → polling mỗi 90s. Server cache 45s nên ESPN chỉ bị gọi 1 lần/45s
      intervalRef.current = setInterval(async () => {
        const updated = await fetchFixtures();
        if (!updated?.some(f => f.status === 'Đang đấu')) {
          if (intervalRef.current) clearInterval(intervalRef.current);
        }
      }, 90_000);
    });

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Persist filters
  useEffect(() => {
    localStorage.setItem('pred_filterType', filterType);
    localStorage.setItem('pred_dateFilter', dateFilter);
    localStorage.setItem('pred_selectedCategory', selectedCategory);
    localStorage.setItem('pred_selectedGroup', selectedGroup);
  }, [filterType, dateFilter, selectedCategory, selectedGroup]);

  // Adjust dateFilter when it becomes incompatible with the new filterType
  const handleFilterTypeChange = (type: string) => {
    const t = type as FilterType;
    setFilterType(t);
    if (t === 'finished' && dateFilter === 'tomorrow') setDateFilter('today');
    else if (t === 'upcoming' && dateFilter === 'yesterday') setDateFilter('today');
    else if (t === 'live' && (dateFilter === 'yesterday' || dateFilter === 'tomorrow')) setDateFilter('today');
  };

  const groupedFixtures = useMemo<Record<string, Fixture[]>>(() => {
    let filtered = fixtures.filter(f => f.sportType === activeSport);

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(f =>
        f.team1.name.toLowerCase().includes(q) ||
        f.team2.name.toLowerCase().includes(q) ||
        f.category?.toLowerCase().includes(q)
      );
    }

    if (filterType === 'upcoming') {
      filtered = filtered.filter(f => !f.status || f.status.toLowerCase().includes('upcoming') || f.status === 'Chưa diễn ra' || f.status === 'Chưa đá');
    } else if (filterType === 'finished') {
      filtered = filtered.filter(f => f.status === 'Kết thúc' || (f.status && !f.status.toLowerCase().includes('upcoming') && f.status !== 'Chưa diễn ra' && f.status !== 'Chưa đá' && f.status !== 'Đang đấu'));
    } else if (filterType === 'live') {
      filtered = filtered.filter(f => f.status === 'Đang đấu');
    }

    if (dateFilter === 'today') filtered = filtered.filter(f => f.matchDate === getLocalDateString(0));
    else if (dateFilter === 'yesterday') filtered = filtered.filter(f => f.matchDate === getLocalDateString(-1));
    else if (dateFilter === 'tomorrow') filtered = filtered.filter(f => f.matchDate === getLocalDateString(1));

    if (selectedCategory === 'all' || selectedCategory.startsWith('FIFA World Cup 2026')) {
      if (selectedCategory.startsWith('FIFA World Cup 2026')) {
        filtered = filtered.filter(f => f.category?.startsWith('FIFA World Cup 2026'));
      }
      if (selectedGroup !== 'all') {
        const roundKey = TAB_TO_ROUND_KEY[selectedGroup];
        filtered = roundKey
          ? filtered.filter(f => f.category?.toLowerCase().includes(roundKey.toLowerCase()))
          : filtered.filter(f => f.category?.includes(selectedGroup));
      }
    } else {
      filtered = filtered.filter(f => f.category === selectedCategory);
      if (selectedGroup !== 'all' && selectedGroup.startsWith('Vòng ')) {
        const roundNum = parseInt(selectedGroup.replace('Vòng ', ''));
        if (!isNaN(roundNum)) {
          const leagueMatches = fixtures.filter(f => f.sportType === activeSport && f.category === selectedCategory);
          const uniqueDates = Array.from(new Set(leagueMatches.map(f => f.matchDate).filter(Boolean)));
          const targetDate = uniqueDates.sort((a, b) => parseDateToTimestamp(a) - parseDateToTimestamp(b))[roundNum - 1];
          if (targetDate) filtered = filtered.filter(f => f.matchDate === targetDate);
        }
      }
    }

    const grouped = filtered.reduce<Record<string, Fixture[]>>((acc, curr) => {
      const key = curr.matchDate || 'Chưa xác định';
      (acc[key] ??= []).push(curr);
      return acc;
    }, {});

    const statusPrio = (s: string) => s === 'Đang đấu' ? 1 : s === 'Kết thúc' ? 3 : 2;
    Object.values(grouped).forEach(group => {
      group.sort((a, b) => {
        const diff = statusPrio(a.status) - statusPrio(b.status);
        return diff !== 0 ? diff : (a.matchTime || '00:00').localeCompare(b.matchTime || '00:00');
      });
    });

    const isUpcoming = (m: Fixture) => !m.status || m.status.toLowerCase().includes('upcoming') || m.status === 'Chưa diễn ra' || m.status === 'Chưa đá' || m.status === 'Đang đấu';
    const allDates = Object.keys(grouped).sort();
    const sorted: Record<string, Fixture[]> = {};
    [...allDates.filter(d => grouped[d].some(isUpcoming)), ...allDates.filter(d => !grouped[d].some(isUpcoming)).reverse()]
      .forEach(k => { sorted[k] = grouped[k]; });
    return sorted;
  }, [fixtures, activeSport, filterType, dateFilter, searchQuery, selectedCategory, selectedGroup]);

  const filterTabs = useMemo(() => {
    if (selectedCategory === 'all' || selectedCategory.startsWith('FIFA World Cup 2026')) {
      return WORLD_CUP_TABS;
    }
    const leagueMatches = fixtures.filter(f => f.sportType === activeSport && f.category === selectedCategory);
    const uniqueDates = Array.from(new Set(leagueMatches.map(f => f.matchDate).filter(Boolean)));
    return ['Tất cả', ...uniqueDates
      .sort((a, b) => parseDateToTimestamp(a) - parseDateToTimestamp(b))
      .map((_, idx) => `Vòng ${idx + 1}`)
    ];
  }, [fixtures, activeSport, selectedCategory]);

  const categories = useMemo(() => {
    const raw = fixtures.filter(f => f.sportType === activeSport).map(f => f.category || 'Giải đấu khác');
    return Array.from(new Set(raw.map(cat => cat.startsWith('FIFA World Cup 2026') ? 'FIFA World Cup 2026' : cat)));
  }, [fixtures, activeSport]);

  const featuredMatches = useMemo(() => {
    const sportMatches = fixtures.filter(f => f.sportType === activeSport);
    if (sportMatches.length === 0) return [];

    let manualPinId: string | null = null;
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      manualPinId = params.get('pin') || params.get('pinnedId');
    }
    if (manualPinId) {
      const pinned = sportMatches.find(f => f.id === manualPinId);
      if (pinned) return [pinned];
    }

    return [sportMatches.find(f => f.status === 'Đang đấu') ?? sportMatches.find(f => f.status === 'Chưa đá') ?? sportMatches[0]];
  }, [fixtures, activeSport]);

  const dateFilterOptions = useMemo(() => [
    { value: 'all', label: 'Tất cả' },
    { value: 'yesterday', label: 'Hôm qua', disabled: filterType === 'upcoming' || filterType === 'live' },
    { value: 'today', label: 'Hôm nay' },
    { value: 'tomorrow', label: 'Ngày mai', disabled: filterType === 'finished' || filterType === 'live' },
  ], [filterType]);

  return (
    <div className="w-full font-client-ui bg-[#f4f7fa] bg-[radial-gradient(#d3dfee_1.5px,transparent_1.5px)] [background-size:24px_24px] text-slate-900 pb-16">

      <HeroSection />

      {featuredMatches.length > 0 && (
        <div className="max-w-[1160px] mx-auto px-4 mt-[-180px] md:mt-[-280px] relative z-20">
          <div className="flex flex-col gap-4 md:gap-6">
            {featuredMatches.map(match => match && (
              <FeaturedMatchCard key={match.id} match={match} />
            ))}
          </div>
        </div>
      )}

      <AiPostsFeed posts={initialAiPosts} />

      <div className="max-w-[1160px] mx-auto px-4 py-4 md:py-6 flex flex-col lg:flex-row gap-4 md:gap-6">

        <div className="flex-1 min-w-0">
          <div className="bg-white border border-slate-200/80 rounded-[24px] p-4 md:p-6 shadow-[0_20px_50px_rgba(15,23,42,0.05)]">

            <div className="flex items-center gap-3 mb-4 md:mb-6 pb-4 border-b border-slate-200/60">
              <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/25 rounded-xl flex items-center justify-center text-emerald-600">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-slate-900 text-lg font-black uppercase tracking-wider">LỊCH THI ĐẤU</h2>
                <p className="text-slate-500 text-xs mt-0.5 font-medium">FIFA World Cup 2026™</p>
              </div>
            </div>

            {/* Search + Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 md:gap-6">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm đội bóng, giải đấu..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-all font-semibold bg-slate-50/50"
                />
              </div>
              <div className="relative">
                <Trophy className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                  value={selectedCategory}
                  onChange={(e) => { setSelectedCategory(e.target.value); setSelectedGroup('all'); }}
                  className="w-full pl-10 pr-8 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 appearance-none bg-slate-50/50 focus:outline-none focus:border-emerald-500 font-extrabold cursor-pointer"
                >
                  <option value="all">Tất cả các giải ({categories.length})</option>
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
                <ChevronRight className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rotate-90 pointer-events-none" />
              </div>
            </div>

            <GroupTabs tabs={filterTabs} selectedGroup={selectedGroup} onSelect={setSelectedGroup} />

            {/* Status & Date filters */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4 md:mb-6">
              <PillGroup
                options={FILTER_TYPE_OPTIONS}
                value={filterType}
                onChange={handleFilterTypeChange}
                className="w-full sm:w-[360px]"
              />
              <PillGroup
                options={dateFilterOptions}
                value={dateFilter}
                onChange={(v) => setDateFilter(v as DateFilter)}
                className="w-full sm:w-[360px]"
              />
            </div>

            <MatchList groupedFixtures={groupedFixtures} loading={loading} error={error} />
          </div>
        </div>

        <Sidebar />
      </div>
    </div>
  );
}
