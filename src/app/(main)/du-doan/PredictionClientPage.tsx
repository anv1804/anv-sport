"use client";

import { useState, useEffect, Fragment, useMemo, useRef } from 'react';
import { Calendar, AlertCircle, ChevronRight, Search, Trophy, Bot, Activity, Cpu, Filter, Zap, Cloud, Sparkles, Clock, Users, CloudSun, Tv, Tv2, MapPin } from 'lucide-react';
import Link from 'next/link';
import { createArticleUrl } from '@/lib/helpers/url';
import { getWinProbability, getAiPct, isPlaceholderTeam } from '@/lib/utils';

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

// Stale-While-Revalidate Memory Cache to enable instant 0ms transitions back to this page
let globalFixturesCache: any[] = [];

const GROUP_COLORS: Record<string, string> = {
  'GROUP A': '#f59e0b',
  'GROUP B': '#3b82f6',
  'GROUP C': '#a855f7',
  'GROUP D': '#ef4444',
  'GROUP E': '#06b6d4',
  'GROUP F': '#10b981',
  'GROUP G': '#f97316',
  'GROUP H': '#ec4899',
};

const FIFA_RANKS: Record<string, number> = {
  'Argentina': 1, 'France': 2, 'England': 3, 'Brazil': 4, 'Belgium': 5,
  'Portugal': 6, 'Netherlands': 7, 'Spain': 8, 'Germany': 9, 'Uruguay': 10,
  'Colombia': 11, 'Croatia': 12, 'Morocco': 13, 'Mexico': 14, 'USA': 15,
  'Switzerland': 40,
  'Japan': 17, 'South Korea': 18,
  'Canada': 20,
  'Senegal': 20,
  'Denmark': 21, 'Austria': 22, 'Turkey': 23, 'Ecuador': 24, 'Chile': 25,
  'Italy': 26, 'Australia': 27, 'Iran': 28, 'Poland': 29, 'Czech Republic': 30,
  'Scotland': 31, 'Norway': 32, 'Wales': 33, 'Hungary': 34, 'Paraguay': 35,
  'Serbia': 36, 'Costa Rica': 37, 'Saudi Arabia': 38, 'Tunisia': 39, 'Egypt': 40,
  'Romania': 41, 'Algeria': 42, 'Slovakia': 43, 'Ivory Coast': 44, 'Cameroon': 45,
  'Ghana': 46, 'South Africa': 47, 'Panama': 49, 'DR Congo': 55,
  'Bosnia & Herzegovina': 57, 'Qatar': 60, 'Iraq': 63, 'Uzbekistan': 64,
  'Cape Verde': 65, 'Curaçao': 76, 'Haiti': 83, 'Jordan': 87, 'New Zealand': 96,
};

function getRank(name: string) {
  const h = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return FIFA_RANKS[name] ?? ((h * 7 + 1) % 80 + 20);
}

function extractGroup(category: string): string {
  const m = category.match(/Group ([A-L])/i);
  return m ? `GROUP ${m[1].toUpperCase()}` : '';
}

function shortDate(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

const TAB_TO_ROUND_KEY: Record<string, string> = {
  'Vòng 32 đội': 'Round of 32',
  'Vòng 16 đội': 'Round of 16',
  'Tứ kết': 'Quarter-final',
  'Bán kết': 'Semi-final',
  'Tranh hạng ba': 'Match for third place',
  'Chung kết': 'Final'
};

function parseDateToTimestamp(dateStr: string): number {
  if (!dateStr) return 0;
  if (dateStr.includes('-')) {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])).getTime();
    }
  } else if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0])).getTime();
    }
  }
  const parsed = Date.parse(dateStr);
  return isNaN(parsed) ? 0 : parsed;
}

function getCityName(ground: string): string {
  if (!ground || ground === 'Chưa xác định') return 'Vancouver';
  const lower = ground.toLowerCase();
  if (lower.includes('vancouver') || lower.includes('bc place')) return 'Vancouver';
  if (lower.includes('toronto') || lower.includes('bmo')) return 'Toronto';
  if (lower.includes('azteca') || lower.includes('mexico')) return 'Mexico City';
  if (lower.includes('monterrey') || lower.includes('bbva')) return 'Monterrey';
  if (lower.includes('guadalajara') || lower.includes('akron')) return 'Guadalajara';
  if (lower.includes('new york') || lower.includes('metlife')) return 'New York';
  if (lower.includes('los angeles') || lower.includes('sofi')) return 'Los Angeles';
  if (lower.includes('dallas') || lower.includes('at&t')) return 'Dallas';
  if (lower.includes('kansas') || lower.includes('arrowhead')) return 'Kansas City';
  if (lower.includes('atlanta') || lower.includes('mercedes')) return 'Atlanta';
  if (lower.includes('miami') || lower.includes('hard rock')) return 'Miami';
  if (lower.includes('philadelphia') || lower.includes('lincoln')) return 'Philadelphia';
  if (lower.includes('seattle') || lower.includes('lumen')) return 'Seattle';
  if (lower.includes('san francisco') || lower.includes('levi')) return 'San Francisco';
  if (lower.includes('boston') || lower.includes('gillette')) return 'Boston';
  if (lower.includes('houston') || lower.includes('nrg')) return 'Houston';
  return 'Vancouver';
}

function getTeamStyles(name: string) {
  const n = name.toLowerCase();
  if (n.includes('switzerland') || n.includes('thụy sĩ')) {
    return {
      glow: '0 0 20px rgba(239, 68, 68, 0.8)',
      border: '2px solid #e5c158',
      bg: '#ef4444',
    };
  }
  if (n.includes('canada')) {
    return {
      glow: '0 0 20px rgba(255, 255, 255, 0.65)',
      border: '2px solid #ffffff',
      bg: '#ffffff',
    };
  }
  if (n.includes('argentina')) {
    return {
      glow: '0 0 16px rgba(116, 189, 241, 0.65)',
      border: '2.5px solid #74bdf1',
      bg: '#74bdf1',
    };
  }
  if (n.includes('brazil')) {
    return {
      glow: '0 0 16px rgba(253, 224, 71, 0.65)',
      border: '2.5px solid #fde047',
      bg: '#fde047',
    };
  }
  if (n.includes('france') || n.includes('pháp')) {
    return {
      glow: '0 0 16px rgba(37, 99, 235, 0.65)',
      border: '2.5px solid #2563eb',
      bg: '#2563eb',
    };
  }
  if (n.includes('portugal') || n.includes('bồ đào nha')) {
    return {
      glow: '0 0 16px rgba(220, 38, 38, 0.65)',
      border: '2.5px solid #dc2626',
      bg: '#dc2626',
    };
  }
  if (n.includes('spain') || n.includes('tây ban nha')) {
    return {
      glow: '0 0 16px rgba(234, 179, 8, 0.65)',
      border: '2.5px solid #eab308',
      bg: '#eab308',
    };
  }
  if (n.includes('germany') || n.includes('đức')) {
    return {
      glow: '0 0 16px rgba(255, 255, 255, 0.45)',
      border: '2.5px solid #ffffff',
      bg: '#ffffff',
    };
  }
  if (n.includes('netherlands') || n.includes('hà lan')) {
    return {
      glow: '0 0 16px rgba(249, 115, 22, 0.65)',
      border: '2.5px solid #f97316',
      bg: '#f97316',
    };
  }
  if (n.includes('england') || n.includes('anh')) {
    return {
      glow: '0 0 16px rgba(255, 255, 255, 0.45)',
      border: '2.5px solid #ffffff',
      bg: '#ffffff',
    };
  }
  if (n.includes('italy') || n.includes('ý')) {
    return {
      glow: '0 0 16px rgba(29, 78, 216, 0.65)',
      border: '2.5px solid #1d4ed8',
      bg: '#1d4ed8',
    };
  }
  
  let hashVal = 0;
  for (let i = 0; i < name.length; i++) {
    hashVal = name.charCodeAt(i) + ((hashVal << 5) - hashVal);
  }
  const colors = [
    { border: '#3b82f6', glow: 'rgba(59, 130, 246, 0.4)', bg: '#3b82f6' },
    { border: '#10b981', glow: 'rgba(16, 185, 129, 0.4)', bg: '#10b981' },
    { border: '#f59e0b', glow: 'rgba(245, 158, 11, 0.4)', bg: '#f59e0b' },
    { border: '#ec4899', glow: 'rgba(236, 72, 153, 0.4)', bg: '#ec4899' },
    { border: '#8b5cf6', glow: 'rgba(139, 92, 246, 0.4)', bg: '#8b5cf6' },
    { border: '#06b6d4', glow: 'rgba(6, 182, 212, 0.4)', bg: '#06b6d4' },
  ];
  const choice = colors[Math.abs(hashVal) % colors.length];
  return {
    glow: `0 0 10px ${choice.glow}`,
    border: `2.5px solid ${choice.border}`,
    bg: choice.bg,
  };
}

export default function PredictionClientPage({ initialAiPosts = [] }: PredictionClientPageProps) {
  const [fixtures, setFixtures] = useState<any[]>(() => globalFixturesCache);
  const [loading, setLoading] = useState(() => globalFixturesCache.length === 0);
  const [error, setError] = useState<string | null>(null);

  // Grouping & Filtering State
  const [groupedFixtures, setGroupedFixtures] = useState<Record<string, any[]>>({});
  const [filterType, setFilterType] = useState<'all' | 'upcoming' | 'finished'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'yesterday' | 'today' | 'tomorrow'>('today');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [isLoadedFromStore, setIsLoadedFromStore] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const tabsRef = useRef<HTMLDivElement>(null);
  const [scrollDirection, setScrollDirection] = useState<'next' | 'prev'>('next');
  const [canScroll, setCanScroll] = useState(false);

  // New Tab State for Sports
  const [activeSport, setActiveSport] = useState<'bongda' | 'vothuat'>('bongda');

  const filterTabs = useMemo(() => {
    if (selectedCategory === 'all' || selectedCategory.startsWith('FIFA World Cup 2026')) {
      return [
        'Tất cả',
        'Group A', 'Group B', 'Group C', 'Group D', 'Group E', 'Group F', 
        'Group G', 'Group H', 'Group I', 'Group J', 'Group K', 'Group L',
        'Vòng 32 đội', 'Vòng 16 đội', 'Tứ kết', 'Bán kết', 'Chung kết'
      ];
    }
    
    // For domestic leagues, get unique dates and map to rounds
    const leagueMatches = fixtures.filter(f => f.sportType === activeSport && f.category === selectedCategory);
    const uniqueDates = Array.from(new Set(leagueMatches.map(f => f.matchDate).filter(Boolean))) as string[];
    const sortedDates = uniqueDates.sort((a, b) => parseDateToTimestamp(a) - parseDateToTimestamp(b));
    
    return ['Tất cả', ...sortedDates.map((_, idx) => `Vòng ${idx + 1}`)];
  }, [fixtures, activeSport, selectedCategory]);

  const leagueSortedDates = useMemo(() => {
    if (selectedCategory === 'all' || selectedCategory.startsWith('FIFA World Cup 2026')) {
      return [];
    }
    const leagueMatches = fixtures.filter(f => f.sportType === activeSport && f.category === selectedCategory);
    const uniqueDates = Array.from(new Set(leagueMatches.map(f => f.matchDate).filter(Boolean))) as string[];
    return uniqueDates.sort((a, b) => parseDateToTimestamp(a) - parseDateToTimestamp(b));
  }, [fixtures, activeSport, selectedCategory]);

  useEffect(() => {
    const fetchFixtures = async () => {
      try {
        const res = await fetch('/api/fixtures');
        const data = await res.json();
        
        if (data.success) {
          const worldCupOnly = data.data.filter((f: any) => 
            f.category && (
              f.category.startsWith('FIFA World Cup 2026') || 
              f.category.toLowerCase().includes('world cup')
            )
          );
          const withSport = worldCupOnly.map((f: any) => ({
            ...f,
            sportType: 'bongda'
          }));
          globalFixturesCache = withSport;
          setFixtures(withSport);
          setError(null);
        } else {
          setError(data.error);
        }
      } catch (err) {
        console.error("Lỗi khi fetch lịch thi đấu", err);
        setError("Lỗi kết nối máy chủ API lịch thi đấu");
      } finally {
        setLoading(false);
      }
    };
    fetchFixtures();
  }, []);

  // Load filters from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedFilterType = localStorage.getItem('pred_filterType');
      if (savedFilterType === 'all' || savedFilterType === 'upcoming' || savedFilterType === 'finished') {
        setFilterType(savedFilterType);
      }
      
      const savedDateFilter = localStorage.getItem('pred_dateFilter');
      if (savedDateFilter === 'all' || savedDateFilter === 'yesterday' || savedDateFilter === 'today' || savedDateFilter === 'tomorrow') {
        setDateFilter(savedDateFilter);
      }

      const savedCategory = localStorage.getItem('pred_selectedCategory');
      if (savedCategory) {
        setSelectedCategory(savedCategory);
      }

      const savedGroup = localStorage.getItem('pred_selectedGroup');
      if (savedGroup) {
        setSelectedGroup(savedGroup);
      }

      setIsLoadedFromStore(true);
    }
  }, []);

  // Save filters to localStorage on changes (after mount restoration)
  useEffect(() => {
    if (isLoadedFromStore && typeof window !== 'undefined') {
      localStorage.setItem('pred_filterType', filterType);
    }
  }, [filterType, isLoadedFromStore]);

  useEffect(() => {
    if (isLoadedFromStore && typeof window !== 'undefined') {
      localStorage.setItem('pred_dateFilter', dateFilter);
    }
  }, [dateFilter, isLoadedFromStore]);

  useEffect(() => {
    if (isLoadedFromStore && typeof window !== 'undefined') {
      localStorage.setItem('pred_selectedCategory', selectedCategory);
    }
  }, [selectedCategory, isLoadedFromStore]);

  useEffect(() => {
    if (isLoadedFromStore && typeof window !== 'undefined') {
      localStorage.setItem('pred_selectedGroup', selectedGroup);
    }
  }, [selectedGroup, isLoadedFromStore]);

  // Hook to monitor scroll bounds & compute direction
  useEffect(() => {
    const el = tabsRef.current;
    if (!el) return;

    const checkScroll = () => {
      const { scrollLeft, scrollWidth, clientWidth } = el;
      setCanScroll(scrollWidth > clientWidth);
      
      // If reached the end of the scroll
      if (scrollLeft + clientWidth >= scrollWidth - 12) {
        setScrollDirection('prev');
      } 
      // If back to the beginning
      else if (scrollLeft <= 12) {
        setScrollDirection('next');
      }
    };

    el.addEventListener('scroll', checkScroll, { passive: true });
    const ro = new ResizeObserver(checkScroll);
    ro.observe(el);

    // Initial check after rendering
    const timer = setTimeout(checkScroll, 100);

    return () => {
      el.removeEventListener('scroll', checkScroll);
      ro.disconnect();
      clearTimeout(timer);
    };
  }, [filterTabs]);

  // Hook to enable mouse drag-to-scroll on desktop
  useEffect(() => {
    const el = tabsRef.current;
    if (!el) return;

    let isDown = false;
    let startX: number;
    let scrollLeft: number;

    const onMouseDown = (e: MouseEvent) => {
      isDown = true;
      el.style.cursor = 'grabbing';
      el.style.userSelect = 'none';
      startX = e.pageX - el.offsetLeft;
      scrollLeft = el.scrollLeft;
    };

    const onMouseLeave = () => {
      isDown = false;
      el.style.cursor = 'grab';
      el.style.removeProperty('user-select');
    };

    const onMouseUp = () => {
      isDown = false;
      el.style.cursor = 'grab';
      el.style.removeProperty('user-select');
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - el.offsetLeft;
      const walk = (x - startX) * 1.5; // multiplier
      el.scrollLeft = scrollLeft - walk;
    };

    // Set initial cursor style if it can scroll
    el.style.cursor = 'grab';

    el.addEventListener('mousedown', onMouseDown);
    el.addEventListener('mouseleave', onMouseLeave);
    el.addEventListener('mouseup', onMouseUp);
    el.addEventListener('mousemove', onMouseMove);

    return () => {
      el.removeEventListener('mousedown', onMouseDown);
      el.removeEventListener('mouseleave', onMouseLeave);
      el.removeEventListener('mouseup', onMouseUp);
      el.removeEventListener('mousemove', onMouseMove);
      el.style.removeProperty('cursor');
      el.style.removeProperty('user-select');
    };
  }, [canScroll]);

  // Adjust dateFilter if it becomes incompatible with filterType
  useEffect(() => {
    if (filterType === 'finished' && dateFilter === 'tomorrow') {
      setDateFilter('today');
    } else if (filterType === 'upcoming' && dateFilter === 'yesterday') {
      setDateFilter('today');
    }
  }, [filterType, dateFilter]);

  useEffect(() => {
    // 1. Filter by Sport
    let filtered = fixtures.filter(f => f.sportType === activeSport);

    // 2. Filter by Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(f => 
        f.team1.name.toLowerCase().includes(q) || 
        f.team2.name.toLowerCase().includes(q) ||
        f.category?.toLowerCase().includes(q)
      );
    }

    // 3. Filter by Status
    if (filterType === 'upcoming') {
      filtered = filtered.filter(f => !f.status || f.status.toLowerCase().includes('upcoming') || f.status === 'Chưa diễn ra' || f.status === 'Chưa đá');
    } else if (filterType === 'finished') {
      filtered = filtered.filter(f => f.status && !f.status.toLowerCase().includes('upcoming') && f.status !== 'Chưa diễn ra' && f.status !== 'Chưa đá');
    }

    // 3.1 Filter by Date Tabs
    const getLocalDateString = (offsetDays = 0) => {
      const d = new Date();
      d.setDate(d.getDate() + offsetDays);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };
    const todayStr = getLocalDateString(0);
    const yesterdayStr = getLocalDateString(-1);
    const tomorrowStr = getLocalDateString(1);

    if (dateFilter === 'today') {
      filtered = filtered.filter(f => f.matchDate === todayStr);
    } else if (dateFilter === 'yesterday') {
      filtered = filtered.filter(f => f.matchDate === yesterdayStr);
    } else if (dateFilter === 'tomorrow') {
      filtered = filtered.filter(f => f.matchDate === tomorrowStr);
    }

    // 4. Filter by Category & Tabs
    if (selectedCategory === 'all' || selectedCategory.startsWith('FIFA World Cup 2026')) {
      if (selectedCategory.startsWith('FIFA World Cup 2026')) {
        filtered = filtered.filter(f => f.category?.startsWith('FIFA World Cup 2026'));
      }
      
      if (selectedGroup !== 'all') {
        const isKnockoutRound = TAB_TO_ROUND_KEY[selectedGroup];
        if (isKnockoutRound) {
          const englishRoundKey = TAB_TO_ROUND_KEY[selectedGroup];
          filtered = filtered.filter(f => f.category?.toLowerCase().includes(englishRoundKey.toLowerCase()));
        } else {
          filtered = filtered.filter(f => f.category?.includes(selectedGroup));
        }
      }
    } else {
      filtered = filtered.filter(f => f.category === selectedCategory);
      
      if (selectedGroup !== 'all' && selectedGroup.startsWith('Vòng ')) {
        const roundNum = parseInt(selectedGroup.replace('Vòng ', ''));
        if (!isNaN(roundNum)) {
          const targetDate = leagueSortedDates[roundNum - 1];
          if (targetDate) {
            filtered = filtered.filter(f => f.matchDate === targetDate);
          }
        }
      }
    }

    // Group by Date (ngày thi đấu)
    const grouped = filtered.reduce((acc, curr) => {
      const dateKey = curr.matchDate || 'Chưa xác định';
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(curr);
      return acc;
    }, {} as Record<string, any[]>);

    // Sort matches within each date group
    Object.keys(grouped).forEach(dateKey => {
      grouped[dateKey].sort((a: any, b: any) => {
        const getStatusPriority = (status: string) => {
          if (status === 'Đang đá') return 1;
          if (status === 'Kết thúc') return 3;
          return 2;
        };
        const prioA = getStatusPriority(a.status);
        const prioB = getStatusPriority(b.status);
        if (prioA !== prioB) return prioA - prioB;

        const timeA = a.matchTime || '00:00';
        const timeB = b.matchTime || '00:00';
        return timeA.localeCompare(timeB);
      });
    });

    const sortedGrouped: Record<string, any[]> = {};
    const allDates = Object.keys(grouped).sort();
    
    const isUpcoming = (m: any) => !m.status || m.status.toLowerCase().includes('upcoming') || m.status === 'Chưa diễn ra' || m.status === 'Chưa đá' || m.status === 'Đang đá';
    const upcomingDates = allDates.filter(date => grouped[date].some(isUpcoming));
    const pastDates = allDates.filter(date => !grouped[date].some(isUpcoming));

    pastDates.reverse();

    [...upcomingDates, ...pastDates].forEach(key => {
      sortedGrouped[key] = grouped[key];
    });

    setGroupedFixtures(sortedGrouped);
  }, [fixtures, activeSport, filterType, dateFilter, searchQuery, selectedCategory, selectedGroup]);

  const rawCategories = Array.from(new Set(fixtures.filter(f => f.sportType === activeSport).map(f => f.category || 'Giải đấu khác')));
  const categories = Array.from(new Set(rawCategories.map(cat => {
    if (cat.startsWith('FIFA World Cup 2026')) {
      return 'FIFA World Cup 2026';
    }
    return cat;
  })));
  const getDeterministicGameInfo = (groundName: string, id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const absHash = Math.abs(hash);
    
    // Stadium
    const stadium = groundName && groundName !== "Chưa xác định" ? groundName : "BC Place Stadium";
    
    // Capacity
    const capacities = ["54,500", "68,014", "72,400", "45,500", "80,000"];
    const capacity = capacities[absHash % capacities.length];
    
    // Weather
    const temps = ["18°C", "20°C", "22°C", "16°C", "24°C"];
    const conditions = ["Partly Cloudy", "Sunny", "Clear Sky", "Light Rain", "Mostly Sunny"];
    const temp = temps[absHash % temps.length];
    const condition = conditions[(absHash >> 2) % conditions.length];
    
    // Broadcaster
    const broadcasters = ["FIFA+", "VTV5 / VTV6", "HTV Thể Thao", "FPT Play"];
    const broadcaster = broadcasters[absHash % broadcasters.length];
    
    return { stadium, capacity, temp, condition, broadcaster };
  };

  const parseCategory = (category: string) => {
    if (!category) return { main: "FIFA WORLD CUP 2026™", sub: "" };
    if (category.toLowerCase().includes("fifa world cup 2026")) {
      const group = category.split("-")?.[1]?.trim() || "GROUP STAGE";
      return { main: "FIFA WORLD CUP 2026™", sub: group.toUpperCase() };
    }
    if (category.includes(" - ")) {
      const parts = category.split(" - ");
      return { main: parts[0].toUpperCase(), sub: parts[1].toUpperCase() };
    }
    return { main: category.toUpperCase(), sub: "" };
  };

  const getFeaturedMatches = () => {
    const sportMatches = fixtures.filter(f => f.sportType === activeSport);
    if (sportMatches.length === 0) return [];

    // Check for manual pin via URL parameter (?pin=xxx or ?pinnedId=xxx)
    let manualPinId: string | null = null;
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      manualPinId = params.get('pin') || params.get('pinnedId');
    }

    // Hardcoded developer pin (set to a match ID if desired, e.g. 'wc2026-0')
    const hardcodedPinId = null;

    const targetPinId = manualPinId || hardcodedPinId;

    if (targetPinId) {
      const pinnedMatch = sportMatches.find(f => f.id === targetPinId);
      if (pinnedMatch) {
        return [pinnedMatch];
      }
    }

    // Automatic selection: prioritize live matches, then upcoming matches, then any match
    const liveMatch = sportMatches.find(f => f.status === 'Đang đá');
    if (liveMatch) return [liveMatch];

    const upcomingMatch = sportMatches.find(f => f.status === 'Chưa đá');
    if (upcomingMatch) return [upcomingMatch];

    return [sportMatches[0]];
  };

  const featuredMatches = getFeaturedMatches();

  return (
    <div className="w-full font-client-ui bg-[#f4f7fa] bg-[radial-gradient(#d3dfee_1.5px,transparent_1.5px)] [background-size:24px_24px] text-slate-900 pb-16">
      
      {/* HEADER HERO SECTION */}
      <div className="bg-gradient-to-br from-[#070d19] via-[#0f1934] to-[#070b14] text-white relative overflow-hidden pt-16 pb-52 md:pt-24 md:pb-72 px-4 border-b border-slate-800/85">
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_80%,transparent_100%)] opacity-20"></div>
        {/* Glowing auras */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="max-w-[1160px] mx-auto relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="text-center md:text-left flex flex-col items-center md:items-start w-full md:w-auto">
            <div className="flex flex-col sm:flex-row items-center gap-3 mb-5">
              <span className="bg-emerald-500/10 border border-emerald-500/35 text-emerald-400 font-extrabold px-3.5 py-1 rounded-full text-[10px] tracking-widest flex items-center gap-1.5 uppercase shadow-[0_2px_15px_rgba(16,185,129,0.15)] backdrop-blur-md">
                <Cpu className="w-3.5 h-3.5 animate-spin-slow" /> ANV SUPERCOMPUTER V2.5
              </span>
              <span className="text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-widest mt-1.5 sm:mt-0 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" /> Giao diện dự đoán cao cấp toàn diện
              </span>
            </div>
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight uppercase leading-none flex flex-col gap-2">
              <span>TRUNG TÂM</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 drop-shadow-sm font-extrabold">
                DỰ ĐOÁN & PHÂN TÍCH
              </span>
            </h1>
            <p className="text-slate-450 text-sm md:text-base mt-4 max-w-[650px] leading-relaxed">
              Phân tích cơ sở dữ liệu đối đầu lịch sử, phong độ cầu thủ, sơ đồ chiến thuật và đưa ra xác suất dự đoán thông minh theo thời gian thực.
            </p>
          </div>
          
          <div className="shrink-0 flex items-center gap-3 bg-slate-900/80 border border-slate-700/60 px-5 py-3 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.37)] backdrop-blur-md">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-450 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] font-bold text-slate-355 uppercase tracking-widest">LIVE SCOREBOARD RUNNING</span>
          </div>
        </div>
      </div>

      {/* HOT FEATURED MATCHES PANEL */}
      {featuredMatches.length > 0 && (
        <div className="max-w-[1160px] mx-auto px-4 mt-[-180px] md:mt-[-280px] relative z-20">
          <div className="flex flex-col gap-6">
            {featuredMatches.map(match => {
              const { w1, draw, w2 } = getWinProbability(match.id, match.team1.name, match.team2.name);
              const info = getDeterministicGameInfo(match.ground, match.id);
              const categoryInfo = parseCategory(match.category);

              return (
                <div key={match.id} className="relative rounded-[18px] overflow-hidden border border-[#1a3055] bg-[#0c1829] flex flex-col group shadow-[0_20px_60px_rgba(0,0,0,0.55)] transition-all duration-300 hover:border-[#3b82f6]/40 hover:shadow-[0_20px_60px_rgba(0,0,0,0.65),0_0_40px_rgba(59,130,246,0.18)]">

                  {/* Stadium background — full, only dark on left side */}
                  <div className="absolute inset-0 bg-[url('/images/stadium_background.png')] bg-cover bg-[center_top] pointer-events-none transition-all duration-700 ease-out group-hover:scale-[1.04] group-hover:brightness-110"></div>
                  <div className="absolute inset-0 pointer-events-none transition-all duration-750 ease-out group-hover:scale-[1.04]" style={{ background: 'linear-gradient(to right, #0c1829 0%, #0c1829 38%, rgba(12,24,41,0.82) 58%, rgba(12,24,41,0.08) 100%)' }}></div>
                  <div className="absolute inset-0 bg-gradient-to-b from-[#0c1829]/70 via-transparent to-[#0c1829]/55 pointer-events-none"></div>

                  {/* Content */}
                  <div className="relative z-10 p-6 md:p-8 flex flex-col gap-5">

                    {/* TOP ROW */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex items-center gap-1.5 bg-[#0d1f3d]/80 backdrop-blur-sm text-[#6b9de8] font-bold px-3 py-1.5 rounded-full border border-[#1e3a6e]/60 text-[10px] tracking-widest uppercase">
                          <span className="text-amber-400 text-[11px]">🏆</span>
                          {categoryInfo.main}
                        </div>
                        <span className="text-[#00c8ff] text-[11px] font-black uppercase tracking-widest">
                          • {categoryInfo.sub || 'GROUP B'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="bg-[#0d1f3d]/70 backdrop-blur-sm border border-[#1e3a6e]/50 text-[10px] font-medium text-[#6b9de8] px-3.5 py-1.5 rounded-full flex items-center gap-1.5">
                          <MapPin className="w-3 h-3" /> VANCOUVER, CANADA
                        </div>
                        <Link
                          href={`/du-doan/${match.id}`}
                          className="bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/50 text-emerald-300 font-bold px-4 py-1.5 rounded-full text-[10px] uppercase tracking-widest flex items-center gap-1.5 transition-all duration-200 active:scale-95"
                        >
                          <Sparkles className="w-3 h-3 text-emerald-400" /> XEM AI
                        </Link>
                      </div>
                    </div>

                    {/* BIG TITLE */}
                    <div>
                      <h2 className="text-white text-[32px] md:text-[44px] font-black tracking-tight leading-none uppercase">
                        {categoryInfo.main}
                      </h2>
                      <div className="text-[28px] md:text-[36px] font-black leading-none text-[#00c8ff] tracking-wide mt-0.5">
                        {categoryInfo.sub || 'GROUP B'}
                      </div>
                      <p className="text-[#4d6a90] text-[11px] mt-2.5 leading-relaxed max-w-[420px]">
                        Phân tích dữ liệu chuyên sâu, dự đoán chính xác<br/>và cập nhật theo thời gian thực.
                      </p>
                    </div>

                    {/* INNER MATCH CARD */}
                    <div className="bg-[#081426]/88 backdrop-blur-sm rounded-2xl border border-[#1a3558]/70 overflow-hidden">

                      {/* Teams + Time */}
                      <div className="flex items-center">

                        {/* Home Team */}
                        <div className="flex items-center gap-4 flex-1 px-6 py-5">
                          <img
                            src={match.team1.logo}
                            alt={match.team1.name}
                            className="w-[72px] h-[72px] md:w-[82px] md:h-[82px] object-cover rounded-xl shadow-[0_4px_16px_rgba(0,0,0,0.6)] shrink-0"
                          />
                          <div>
                            <div className="font-black text-xl md:text-2xl text-white tracking-tight leading-tight">
                              {match.team1.name}
                            </div>
                            <div className="mt-1.5 text-[9px] font-bold text-[#3d5c84] bg-[#0d1e38]/80 border border-[#1a3058]/70 px-2.5 py-0.5 rounded-full uppercase tracking-widest inline-block">
                              {match.sportType === 'bongda' ? 'UEFA' : 'LEAGUE'}
                            </div>
                          </div>
                        </div>

                        {/* Center */}
                        <div className="flex flex-col items-center gap-1.5 px-5 py-5 border-x border-[#1a3558]/50 shrink-0">
                          <div className="flex items-center gap-1 bg-[#0c1829]/80 border border-[#1e3a6e]/50 text-[#4d88c0] rounded-full px-3 py-1 text-[9px] font-bold uppercase tracking-widest whitespace-nowrap">
                            <Clock className="w-3 h-3" /> KICK-OFF
                          </div>
                          {match.score1 !== null && match.score2 !== null ? (
                            <div className="flex items-center text-white font-black text-3xl font-mono whitespace-nowrap">
                              <span>{match.score1}</span>
                              <span className="text-[#3b82f6] mx-2">:</span>
                              <span>{match.score2}</span>
                            </div>
                          ) : (
                            <div className="text-white font-black text-[40px] leading-none whitespace-nowrap font-mono tracking-tight">
                              {match.matchTime}
                            </div>
                          )}
                          <div className="text-[9px] font-bold text-[#3d5c84] uppercase tracking-widest whitespace-nowrap">
                            {match.matchDate}
                          </div>
                        </div>

                        {/* Away Team */}
                        <div className="flex items-center justify-end gap-4 flex-1 px-6 py-5">
                          <div className="text-right">
                            <div className="font-black text-xl md:text-2xl text-white tracking-tight leading-tight">
                              {match.team2.name}
                            </div>
                            <div className="mt-1.5 text-[9px] font-bold text-[#3d5c84] bg-[#0d1e38]/80 border border-[#1a3058]/70 px-2.5 py-0.5 rounded-full uppercase tracking-widest inline-block">
                              {match.sportType === 'bongda' ? 'CONCACAF' : 'LEAGUE'}
                            </div>
                          </div>
                          <img
                            src={match.team2.logo}
                            alt={match.team2.name}
                            className="w-[72px] h-[72px] md:w-[82px] md:h-[82px] object-cover rounded-xl shadow-[0_4px_16px_rgba(0,0,0,0.6)] shrink-0"
                          />
                        </div>

                      </div>

                      {/* Probability bar */}
                      <div className="px-6 pb-4 pt-3 border-t border-[#1a3558]/40">
                        <div className="w-full h-1.5 rounded-full overflow-hidden flex">
                          <div className="h-full bg-emerald-400" style={{ width: `${w1}%` }}></div>
                          <div className="h-full bg-[#1e3050]" style={{ width: `${draw}%` }}></div>
                          <div className="h-full bg-[#3b82f6]" style={{ width: `${w2}%` }}></div>
                        </div>
                        <div className="flex justify-between text-[11px] font-bold mt-1.5">
                          <span className="text-emerald-400">{w1}%</span>
                          <span className="text-[#3d5c84]">HÒA {draw}%</span>
                          <span className="text-[#60a5fa]">{w2}%</span>
                        </div>
                      </div>

                      {/* BOTTOM METADATA ROW */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-0 px-6 py-4 border-t border-[#1a3558]/40 bg-[#061020]/30">
                        <div className="flex items-center gap-2.5 sm:pr-5 sm:border-r border-[#1a3558]/30">
                          <img src="/images/stadium_3d_icon.png" alt="Stadium" className="w-8 h-8 object-contain shrink-0" />
                          <div>
                            <div className="text-[12px] font-semibold text-white leading-tight">{info.stadium}</div>
                            <div className="text-[10px] text-[#3d5c84] mt-0.5">Vancouver, Canada</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2.5 sm:px-5 sm:border-r border-[#1a3558]/30">
                          <Users className="w-5 h-5 text-[#4d88c0] shrink-0" />
                          <div>
                            <div className="text-[12px] font-semibold text-white leading-tight">{info.capacity}</div>
                            <div className="text-[10px] text-[#3d5c84] mt-0.5">Capacity</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2.5 sm:px-5 sm:border-r border-[#1a3558]/30">
                          <CloudSun className="w-5 h-5 text-[#f59e0b] shrink-0" />
                          <div>
                            <div className="text-[12px] font-semibold text-white leading-tight">{info.temp}</div>
                            <div className="text-[10px] text-[#3d5c84] mt-0.5">{info.condition}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2.5 sm:pl-5">
                          <Tv className="w-5 h-5 text-[#4d88c0] shrink-0" />
                          <div>
                            <div className="text-[12px] font-semibold text-white leading-tight">{info.broadcaster}</div>
                            <div className="text-[10px] text-[#3d5c84] mt-0.5">Official Broadcaster</div>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TOP ARTICLES FEED */}
      {initialAiPosts && initialAiPosts.length > 0 && (
        <div className="max-w-[1160px] mx-auto px-4 mt-10">
          <div className="bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-[24px] p-6 md:p-8 shadow-[0_20px_50px_rgba(15,23,42,0.05)]">
            
            {/* Header section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl flex items-center justify-center text-emerald-600 shadow-[0_4px_12px_rgba(16,185,129,0.1)] shrink-0">
                  <Bot className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h2 className="text-slate-900 text-lg md:text-xl font-black uppercase tracking-wider flex items-center gap-1.5">
                    TIN TỨC & NHẬN ĐỊNH <span className="text-emerald-600">AI MỚI NHẤT</span>
                  </h2>
                  <p className="text-slate-500 text-xs mt-1 font-medium">
                    Phân tích chuyên sâu từ AI • Dữ liệu chính xác • Cập nhật liên tục
                  </p>
                </div>
              </div>
              <div className="bg-emerald-50 border border-emerald-150/60 text-emerald-600 text-[11px] font-black uppercase tracking-widest px-4 py-2 rounded-full flex items-center gap-2 self-start sm:self-auto shadow-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Cập nhật 5 phút trước
              </div>
            </div>

            {/* Articles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {initialAiPosts.slice(0, 3).map((post, index) => {
                const badges = [
                  { text: "PHÂN TÍCH AI", class: "bg-emerald-50/90 border-emerald-200/80 text-emerald-700", icon: "★" },
                  { text: "CHIẾN THUẬT", class: "bg-purple-50/90 border-purple-200/80 text-purple-700", icon: "⚙" },
                  { text: "NHẬN ĐỊNH", class: "bg-blue-50/90 border-blue-200/80 text-blue-700", icon: "⚡" }
                ];
                const badge = badges[index % 3];

                return (
                  <Link 
                    key={post.id}
                    href={createArticleUrl(post.title, post.id)}
                    className="bg-white border border-slate-200/60 hover:border-emerald-400 rounded-2xl overflow-hidden flex flex-col transition-all duration-350 group shadow-[0_4px_16px_rgba(15,23,42,0.02)] hover:shadow-[0_15px_35px_rgba(16,185,129,0.06)]"
                  >
                    {/* Image container */}
                    {post.imageUrl && (
                      <div className="relative aspect-[16/10] overflow-hidden">
                        <img 
                          src={post.imageUrl} 
                          alt={post.title} 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 group-hover:brightness-105" 
                        />
                        {/* Top-left Badge */}
                        <div className={`absolute top-3 left-3 border text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md backdrop-blur-md flex items-center gap-1 ${badge.class}`}>
                          <span>{badge.icon}</span> {badge.text}
                        </div>

                        {/* Time ago badge */}
                        <div className="absolute top-3 right-3 bg-black/60 border border-white/10 text-[9px] font-bold text-white/95 px-2.5 py-1 rounded-md backdrop-blur-md">
                          {index === 0 ? "5 phút trước" : index === 1 ? "12 phút trước" : "18 phút trước"}
                        </div>

                        {/* Hexagon styled icon overlay bottom-right */}
                        <div className="absolute bottom-3 right-3 w-10 h-10 bg-white/95 border border-slate-200/80 rounded-xl flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.06)] group-hover:border-emerald-400 transition-colors">
                          {index % 3 === 0 && <Bot className="w-5 h-5 text-emerald-500" />}
                          {index % 3 === 1 && <Activity className="w-5 h-5 text-purple-500" />}
                          {index % 3 === 2 && <Trophy className="w-5 h-5 text-blue-500" />}
                        </div>
                      </div>
                    )}

                    {/* Text content */}
                    <div className="p-5 flex-1 flex flex-col">
                      <h3 className="text-slate-900 font-extrabold text-base leading-snug line-clamp-2 group-hover:text-emerald-600 transition-colors duration-200">
                        {post.title}
                      </h3>
                      <p className="text-slate-500 text-xs line-clamp-2 mt-2 leading-relaxed flex-1 font-medium">
                        {post.excerpt}
                      </p>

                      {/* Bottom Action / Footer row */}
                      <div className="flex items-center justify-between border-t border-slate-100/90 pt-4 mt-4 text-[12px] font-bold">
                        <span className="text-emerald-600 flex items-center gap-1 group-hover:underline">
                          Đọc ngay <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                        
                        <div className="flex items-center gap-3 text-slate-400">
                          <span className="flex items-center gap-1 text-[11px] text-amber-500/90 font-black">
                            🔥 {index === 0 ? "12.4K" : index === 1 ? "8.7K" : "15.6K"}
                          </span>
                          <span className="flex items-center gap-1 text-[11px] font-black text-slate-450">
                            💬 {index === 0 ? "86" : index === 1 ? "54" : "112"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>

          </div>
        </div>
      )}

      {/* MAIN CONTAINER */}
      <div className="max-w-[1160px] mx-auto px-4 py-8 flex flex-col lg:flex-row gap-6 md:gap-8">
        
        {/* MAIN CONTENT AREA */}
        <div className="flex-1 min-w-0">
          
          <div className="bg-white border border-slate-200/80 rounded-[24px] p-6 shadow-[0_20px_50px_rgba(15,23,42,0.05)]">
            
            {/* Header: Title & Filter Button */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/25 rounded-xl flex items-center justify-center text-emerald-600">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-slate-900 text-lg font-black uppercase tracking-wider">LỊCH THI ĐẤU</h2>
                  <p className="text-slate-500 text-xs mt-0.5 font-medium">FIFA World Cup 2026™</p>
                </div>
              </div>
            </div>

            {/* Filter Inputs (Always Visible) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="relative w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Tìm đội bóng, giải đấu..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-all font-semibold bg-slate-50/50"
                />
              </div>

              <div className="relative w-full">
                <Trophy className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select 
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setSelectedGroup('all');
                  }}
                  className="w-full pl-10 pr-8 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 appearance-none bg-slate-50/50 focus:outline-none focus:border-emerald-500 font-extrabold cursor-pointer"
                >
                  <option value="all">Tất cả các giải ({categories.length})</option>
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
                <ChevronRight className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rotate-90 pointer-events-none" />
              </div>
            </div>

            {/* Category / Group Tabs */}
            {filterTabs.length > 1 && (
              <div className="relative flex items-center mb-6 border-b border-slate-200/60 pb-4 group/scroll">
                
                {/* Scroll Container */}
                <div 
                  ref={tabsRef}
                  className="flex items-center gap-2 overflow-x-auto w-full scroll-smooth"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {filterTabs.map((grp) => {
                    const isSelected = selectedGroup === (grp === 'Tất cả' ? 'all' : grp);
                    return (
                      <button
                        key={grp}
                        onClick={() => setSelectedGroup(grp === 'Tất cả' ? 'all' : grp)}
                        className={`px-4.5 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider transition-all duration-200 whitespace-nowrap
                          ${isSelected
                            ? 'bg-emerald-500 text-white shadow-md'
                            : 'text-slate-500 hover:text-slate-800 bg-transparent'}`}
                      >
                        {grp}
                      </button>
                    );
                  })}
                  
                  <div className="w-4 shrink-0" />
                </div>

                {/* Right Gradient + Unified Toggle Button */}
                {canScroll && (
                  <div className="absolute right-0 top-0 bottom-4 w-12 bg-gradient-to-l from-white via-white/75 to-transparent pointer-events-none flex items-center justify-end pr-1">
                    <button 
                      onClick={() => {
                        if (tabsRef.current) {
                          if (scrollDirection === 'next') {
                            tabsRef.current.scrollBy({ left: 240, behavior: 'smooth' });
                          } else {
                            tabsRef.current.scrollBy({ left: -240, behavior: 'smooth' });
                          }
                        }
                      }}
                      className="pointer-events-auto w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-all shadow active:scale-95"
                    >
                      {scrollDirection === 'next' ? (
                        <ChevronRight className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 rotate-180" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Status & Date Filter Tabs */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
              {/* Left Side: Status Tabs */}
              <div className="flex bg-slate-100 p-0.5 rounded-full border border-slate-200/40 w-full sm:w-[280px] shadow-inner shrink-0">
                <button
                  onClick={() => setFilterType('all')}
                  className={`flex-1 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider transition-all duration-205
                    ${filterType === 'all'
                      ? 'bg-emerald-500 text-white shadow-md'
                      : 'text-slate-500 hover:text-slate-800'}`}
                >
                  Tất cả
                </button>
                <button
                  onClick={() => setFilterType('finished')}
                  className={`flex-1 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider transition-all duration-205
                    ${filterType === 'finished'
                      ? 'bg-emerald-500 text-white shadow-md'
                      : 'text-slate-500 hover:text-slate-800'}`}
                >
                  Đã đấu
                </button>
                <button
                  onClick={() => setFilterType('upcoming')}
                  className={`flex-1 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider transition-all duration-205
                    ${filterType === 'upcoming'
                      ? 'bg-emerald-500 text-white shadow-md'
                      : 'text-slate-500 hover:text-slate-800'}`}
                >
                  Chưa đấu
                </button>
              </div>

              {/* Right Side: Date Tabs */}
              <div className="flex bg-slate-100 p-0.5 rounded-full border border-slate-200/40 w-full sm:w-[320px] shadow-inner shrink-0">
                <button
                  onClick={() => setDateFilter('all')}
                  className={`flex-1 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider transition-all duration-205
                    ${dateFilter === 'all'
                      ? 'bg-emerald-500 text-white shadow-md'
                      : 'text-slate-500 hover:text-slate-800'}`}
                >
                  Tất cả
                </button>
                <button
                  onClick={() => setDateFilter('yesterday')}
                  disabled={filterType === 'upcoming'}
                  className={`flex-1 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider transition-all duration-205
                    ${dateFilter === 'yesterday'
                      ? 'bg-emerald-500 text-white shadow-md'
                      : 'text-slate-500 hover:text-slate-800'}
                    ${filterType === 'upcoming' ? 'opacity-30 cursor-not-allowed pointer-events-none' : ''}`}
                >
                  Hôm qua
                </button>
                <button
                  onClick={() => setDateFilter('today')}
                  className={`flex-1 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider transition-all duration-205
                    ${dateFilter === 'today'
                      ? 'bg-emerald-500 text-white shadow-md'
                      : 'text-slate-500 hover:text-slate-800'}`}
                >
                  Hôm nay
                </button>
                <button
                  onClick={() => setDateFilter('tomorrow')}
                  disabled={filterType === 'finished'}
                  className={`flex-1 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider transition-all duration-205
                    ${dateFilter === 'tomorrow'
                      ? 'bg-emerald-500 text-white shadow-md'
                      : 'text-slate-500 hover:text-slate-800'}
                    ${filterType === 'finished' ? 'opacity-30 cursor-not-allowed pointer-events-none' : ''}`}
                >
                  Ngày mai
                </button>
              </div>
            </div>

          {loading ? (
             <FixturesListSkeleton />
          ) : error ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-16 flex flex-col items-center justify-center min-h-[400px] shadow-sm">
              <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
              <p className="text-slate-855 font-black text-lg mb-2">Lỗi kết nối dữ liệu</p>
              <p className="text-slate-500 font-medium text-sm">{error}</p>
            </div>
          ) : Object.keys(groupedFixtures).length === 0 ? (
             <div className="bg-white border border-slate-200 rounded-2xl p-16 flex flex-col items-center justify-center min-h-[400px] shadow-sm">
               <Trophy className="w-12 h-12 text-slate-300 mb-4" />
               <p className="text-slate-500 font-bold text-sm">Không tìm thấy trận đấu nào phù hợp với bộ lọc hiện tại.</p>
             </div>
          ) : (
            <div className="space-y-8 md:space-y-10">
              {Object.entries(groupedFixtures).map(([dateStr, matches]) => {
                const dateObj = new Date(dateStr);
                const formattedDate = isNaN(dateObj.getTime()) ? dateStr : dateObj.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });

                return (
                  <div key={dateStr} className="space-y-4">
                    {/* Date Header Title */}
                    <div className="bg-slate-50 px-5 py-3 rounded-xl flex items-center justify-between border border-slate-200 shadow-sm">
                      <div className="flex items-center gap-2.5">
                        <span className="text-sm">📅</span>
                        <h3 className="text-slate-800 font-extrabold uppercase tracking-widest text-xs md:text-sm">{formattedDate}</h3>
                      </div>
                      <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-250/50 px-3 py-0.5 rounded-full uppercase tracking-wider">{matches.length} TRẬN</span>
                    </div>

                    {/* Grid of Match Cards styled exactly like Mockup */}
              <div className="grid grid-cols-1 gap-6">
                      {matches.map((match: any) => {
                         const isFinished = match.status === 'Kết thúc';
                         const isLive = match.status === 'Đang đá';
                         const matchTimeStr = match.matchTime || '00:00';
                         const score1Num = (isFinished || isLive) && match.score1 !== null && match.score1 !== undefined ? parseInt(match.score1) : null;
                         const score2Num = (isFinished || isLive) && match.score2 !== null && match.score2 !== undefined ? parseInt(match.score2) : null;

                          const { w1, draw, w2 } = getWinProbability(match.id, match.team1.name, match.team2.name);
                          const info = getDeterministicGameInfo(match.ground, match.id);
                          const categoryInfo = parseCategory(match.category);
                          const style1 = getTeamStyles(match.team1.name);
                          const style2 = getTeamStyles(match.team2.name);
                          const group = categoryInfo.sub || extractGroup(match.category) || 'GROUP B';
                          const groupColor = GROUP_COLORS[group] ?? '#10b981';

                          const rank1 = getRank(match.team1.name);
                          const rank2 = getRank(match.team2.name);
                          const aiPct = getAiPct(match.team1.name, match.team2.name);

                          return (
                            <Link
                              key={match.id}
                              href={`/du-doan/${match.id}`}
                              style={{
                                display: 'block',
                                background: '#ffffff',
                                border: '1px solid rgba(15,23,42,0.08)',
                                borderRadius: 10,
                                overflow: 'hidden',
                                textDecoration: 'none',
                                boxShadow: '0 4px 16px rgba(15,23,42,0.02)',
                              }}
                              className="pred-match-card"
                            >
                              {/* META ROW */}
                              <div style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '8px 14px',
                                background: 'rgba(15,23,42,0.02)',
                                borderBottom: '1px solid rgba(15,23,42,0.05)',
                                gap: 8,
                              }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                                  {group && (
                                    <div style={{
                                      display: 'inline-flex', alignItems: 'center', gap: 4,
                                      background: `${groupColor}18`,
                                      border: `1px solid ${groupColor}40`,
                                      borderRadius: 5, padding: '2px 8px', flexShrink: 0,
                                    }}>
                                      <Trophy style={{ width: 9, height: 9, color: groupColor }} />
                                      <span style={{ fontSize: 9, fontWeight: 900, color: groupColor, letterSpacing: '0.08em' }}>{group}</span>
                                    </div>
                                  )}
                                  {match.ground && match.ground !== 'Chưa xác định' && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0 }}>
                                      <MapPin style={{ width: 10, height: 10, color: '#64748b', flexShrink: 0 }} />
                                      <span style={{ fontSize: 10, color: '#475569', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {match.ground}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                                  {isLive ? (
                                    <div style={{
                                      display: 'flex', alignItems: 'center', gap: 4,
                                      background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
                                      borderRadius: 99, padding: '2px 8px',
                                      fontSize: 10, fontWeight: 800, color: '#ef4444',
                                    }}>
                                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#ef4444', animation: 'predPulse 1s infinite', display: 'inline-block' }} />
                                      LIVE
                                    </div>
                                  ) : (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                      <Clock style={{ width: 10, height: 10, color: '#64748b' }} />
                                      <span style={{ fontSize: 10, color: '#475569', fontWeight: 600 }}>
                                        {matchTimeStr} • {shortDate(match.matchDate)}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* BODY */}
                              <div style={{ display: 'flex', alignItems: 'center', padding: '16px 14px 14px', gap: 8 }}>
                                {/* HOME */}
                                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
                                  <img
                                    src={match.team1.logo}
                                    alt={match.team1.name}
                                    style={{ width: 60, height: 60, objectFit: 'contain', borderRadius: 10, border: '2px solid rgba(15,23,42,0.08)', background: 'rgba(15,23,42,0.03)', flexShrink: 0, display: 'block' }}
                                  />
                                  <div style={{ minWidth: 0, flex: 1 }}>
                                    <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', lineHeight: 1.25, letterSpacing: '-0.01em' }}>
                                      {match.team1.name}
                                    </div>
                                    <div style={{ fontSize: 9, color: '#64748b', fontWeight: 700, letterSpacing: '0.05em', marginTop: 4 }}>
                                      {isPlaceholderTeam(match.team1.name) ? 'RANK: —' : `FIFA RANK #${rank1}`}
                                    </div>
                                  </div>
                                </div>

                                {/* CENTER */}
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 110, flexShrink: 0, gap: 2 }}>
                                  {isFinished || isLive ? (
                                    <>
                                      <span style={{ fontSize: 8, fontWeight: 700, color: '#64748b', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                                        {isFinished ? 'KẾT THÚC' : '⚡ LIVE'}
                                      </span>
                                      <div style={{ fontSize: 34, fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>
                                        {match.score1 ?? 0}<span style={{ color: '#cbd5e1', margin: '0 2px' }}>–</span>{match.score2 ?? 0}
                                      </div>
                                    </>
                                  ) : (
                                    <>
                                      <span style={{ fontSize: 8, fontWeight: 700, color: '#64748b', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                                        KICK-OFF
                                      </span>
                                      <div style={{ fontSize: 34, fontWeight: 900, color: '#0f172a', lineHeight: 1, letterSpacing: '0.01em' }}>
                                        {matchTimeStr}
                                      </div>
                                      <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600, marginTop: 1 }}>
                                        {shortDate(match.matchDate)}
                                      </div>
                                      <div style={{
                                        marginTop: 4, fontSize: 9, color: '#475569', fontWeight: 800,
                                        padding: '2px 14px', borderRadius: 99,
                                        border: '1px solid rgba(15,23,42,0.08)',
                                        background: 'rgba(15,23,42,0.03)',
                                        letterSpacing: '0.08em',
                                      }}>
                                        VS
                                      </div>
                                    </>
                                  )}
                                </div>

                                {/* AWAY */}
                                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 14, minWidth: 0 }}>
                                  <div style={{ minWidth: 0, textAlign: 'right', flex: 1 }}>
                                    <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', lineHeight: 1.25, letterSpacing: '-0.01em' }}>
                                      {match.team2.name}
                                    </div>
                                    <div style={{ fontSize: 9, color: '#64748b', fontWeight: 700, letterSpacing: '0.05em', marginTop: 4 }}>
                                      {isPlaceholderTeam(match.team2.name) ? 'RANK: —' : `FIFA RANK #${rank2}`}
                                    </div>
                                  </div>
                                  <img
                                    src={match.team2.logo}
                                    alt={match.team2.name}
                                    style={{ width: 60, height: 60, objectFit: 'contain', borderRadius: 10, border: '2px solid rgba(15,23,42,0.08)', background: 'rgba(15,23,42,0.03)', flexShrink: 0, display: 'block' }}
                                  />
                                </div>

                                {/* AI BADGE */}
                                <div style={{
                                  flexShrink: 0, width: 72,
                                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                                  paddingLeft: 10,
                                  borderLeft: '1px solid rgba(15,23,42,0.05)',
                                }}>
                                  <div style={{ position: 'relative' }}>
                                    <div style={{
                                      width: 38, height: 38, borderRadius: '50%',
                                      border: '2px solid rgba(16,185,129,0.3)',
                                      background: 'radial-gradient(circle at 38% 38%, rgba(16,185,129,0.1) 0%, rgba(16,185,129,0.02) 100%)',
                                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                      <Tv2 style={{ width: 18, height: 18, color: '#10b981' }} />
                                    </div>
                                    <div style={{
                                      position: 'absolute', top: -1, right: -2,
                                      width: 9, height: 9, borderRadius: '50%',
                                      background: 'linear-gradient(135deg, #34d399, #10b981)',
                                      border: '1.5px solid #ffffff',
                                      boxShadow: '0 0 6px rgba(16,185,129,0.6)',
                                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                      <span style={{ fontSize: 5, color: '#fff', fontWeight: 900, lineHeight: 1 }}>✦</span>
                                    </div>
                                  </div>
                                  <div style={{ fontSize: 8, color: '#475569', fontWeight: 700, letterSpacing: '0.04em', textAlign: 'center', lineHeight: 1.3 }}>
                                    <span style={{ color: '#10b981' }}>AI</span> DỰ ĐOÁN
                                  </div>
                                  <div style={{ fontSize: 20, fontWeight: 900, color: '#10b981', lineHeight: 1 }}>
                                    {isPlaceholderTeam(match.team1.name) || isPlaceholderTeam(match.team2.name) ? '—' : `${aiPct}%`}
                                  </div>
                                </div>
                              </div>

                              {/* PROBABILITY */}
                              <div style={{ borderTop: '1px solid rgba(15,23,42,0.04)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 14px 4px' }}>
                                  <span style={{ fontSize: 9, fontWeight: 900, color: '#10b981', letterSpacing: '0.04em' }}>
                                    {w1}% {match.team1.name.toUpperCase()} WIN
                                  </span>
                                  <span style={{ fontSize: 9, fontWeight: 700, color: '#64748b', letterSpacing: '0.04em' }}>
                                    {draw}% HÒA
                                  </span>
                                  <span style={{ fontSize: 9, fontWeight: 900, color: groupColor, letterSpacing: '0.04em' }}>
                                    {w2}% {match.team2.name.toUpperCase()} WIN
                                  </span>
                                </div>
                                <div style={{ display: 'flex', height: 4 }}>
                                  <div style={{ width: `${w1}%`, background: 'linear-gradient(90deg,#059669,#10b981)' }} />
                                  <div style={{ width: `${draw}%`, background: '#e2e8f0' }} />
                                  <div style={{ width: `${w2}%`, background: `linear-gradient(90deg,${groupColor}88,${groupColor})` }} />
                                </div>
                              </div>
                            </Link>
                          );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
        
        {/* RIGHT SIDEBAR */}
        <div className="w-full lg:w-[320px] shrink-0 space-y-6">
          
          {/* AI Banner Widget */}
          <div className="bg-gradient-to-br from-[#0c142c] via-[#0d162f] to-[#090f22] rounded-2xl p-6 relative overflow-hidden shadow-lg border border-slate-800">
            <div className="absolute -right-10 -bottom-10 opacity-5">
              <Activity className="w-48 h-48 text-white" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4 bg-emerald-500/10 border border-emerald-500/20 w-max px-3 py-1.5 rounded-lg text-emerald-400">
                <Bot className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Siêu Máy Tính AI</span>
              </div>
              <p className="text-[13px] text-slate-400 font-medium leading-relaxed mb-6 font-client-ui">
                Hệ thống tự động tham chiếu dữ liệu từ TheSportsDB, kết hợp với các thuật toán học máy nâng cao để phân tích phong độ đối đầu và dự đoán xác suất trận đấu.
              </p>
              <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest border-t border-slate-800/80 pt-4 text-slate-500">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Real-time Analysis</span>
                <span className="text-emerald-400/80 border border-emerald-500/20 px-2 py-0.5 rounded">API Official</span>
              </div>
            </div>
          </div>

          {/* Warning Widget */}
          <div className="bg-amber-50/40 rounded-2xl p-6 border border-amber-100 shadow-sm relative overflow-hidden">
            <div className="flex items-center gap-2 mb-3 text-amber-800">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span className="text-[11px] font-black uppercase tracking-widest">Khuyến Cáo Vận Hành</span>
            </div>
            <p className="text-[12px] text-amber-850/80 font-medium leading-relaxed">
              Các phân tích và dự đoán từ Siêu máy tính AI chỉ mang tính chất tham khảo tin tức thể thao giải trí. ANVSport tuyệt đối không cung cấp dịch vụ hoặc khuyến khích người dùng tham gia cá cược dưới mọi hình thức.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}

function FixturesListSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {[1, 2].map((dateIdx) => (
        <div key={dateIdx} className="space-y-4">
          {/* Header */}
          <div className="bg-slate-900 px-4 md:px-5 py-3.5 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-4 h-4 bg-slate-700 rounded"></div>
              <div className="h-4 bg-slate-700 rounded w-40"></div>
            </div>
            <div className="w-16 h-4 bg-slate-800 rounded-full"></div>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-2xl border border-slate-200/80 divide-y divide-slate-100 overflow-hidden">
            {[1, 2, 3].map((rowIdx) => (
              <div key={rowIdx} className="p-4.5 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="w-32 h-3.5 bg-gray-200 rounded"></div>
                  <div className="w-24 h-3.5 bg-gray-200 rounded"></div>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 flex items-center justify-end gap-3">
                    <div className="w-20 h-4 bg-gray-200 rounded"></div>
                    <div className="w-8 h-6 bg-gray-200 rounded shrink-0"></div>
                  </div>
                  <div className="w-[155px] md:w-[190px] shrink-0 flex flex-col items-center gap-1.5 px-2">
                    <div className="w-12 h-5 bg-gray-200 rounded"></div>
                    <div className="w-full h-1 bg-slate-100 rounded-full"></div>
                  </div>
                  <div className="flex-1 flex items-center justify-start gap-3">
                    <div className="w-8 h-6 bg-gray-200 rounded shrink-0"></div>
                    <div className="w-20 h-4 bg-gray-200 rounded"></div>
                  </div>
                  <div className="w-[85px] md:w-[105px] shrink-0 pl-1 md:pl-3">
                    <div className="w-full h-8 bg-gray-205 rounded-lg"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    <style>{`
      .pred-match-card { transition: border-color 0.2s, box-shadow 0.2s; }
      .pred-match-card:hover { border-color: rgba(16,185,129,0.18) !important; box-shadow: 0 6px 28px rgba(0,0,0,0.35) !important; }
      @keyframes predPulse { 0%,100%{opacity:1} 50%{opacity:0.25} }
    `}</style>
    </div>
  );
}
