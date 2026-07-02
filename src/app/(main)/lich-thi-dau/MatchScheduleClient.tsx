'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Search, Trophy, Filter,
  ChevronDown, Loader2, AlertCircle
} from 'lucide-react';
import { Fixture } from '@/components/domain/match-schedule/types';
import { GROUPS, GROUP_COLORS } from '@/components/domain/match-schedule/constants';
import { extractGroup } from '@/components/domain/match-schedule/utils';
import { DateSection } from '@/components/domain/match-schedule/DateSection';

export function MatchScheduleClient() {
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeGroup, setActiveGroup] = useState('TẤT CẢ');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/fixtures');
        const data = await res.json();
        if (data.success) {
          const wc = (data.data as Fixture[]).filter(
            f => f.category?.includes('World Cup') || f.category?.includes('FIFA')
          );
          setFixtures(wc);
        } else setError('Không thể tải dữ liệu.');
      } catch { setError('Lỗi kết nối máy chủ.'); }
      finally { setIsLoading(false); }
    })();
  }, []);

  const filtered = useMemo(() => {
    let list = fixtures;
    if (activeGroup !== 'TẤT CẢ') list = list.filter(f => extractGroup(f.category) === activeGroup);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(f =>
        f.team1.name.toLowerCase().includes(q) ||
        f.team2.name.toLowerCase().includes(q) ||
        f.ground.toLowerCase().includes(q)
      );
    }
    return list;
  }, [fixtures, activeGroup, searchQuery]);

  const byDate = useMemo(() => {
    const map: Record<string, Fixture[]> = {};
    for (const f of filtered) { (map[f.matchDate || 'Unknown'] ??= []).push(f); }
    return Object.keys(map).sort().map(date => ({ date, fixtures: map[date] }));
  }, [filtered]);

  return (
    <div style={{ minHeight: '100vh', background: '#080f1c', fontFamily: 'var(--font-inter),sans-serif' }}>

      {/* ══ HEADER ══════════════════════════════════════════════ */}
      <div style={{
        background: 'linear-gradient(180deg,#0c1829 0%,#091523 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '20px 20px 0' }}>

          {/* Title + filter button */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: 'linear-gradient(135deg,#0f4c2a,#093320)',
                border: '1px solid rgba(16,185,129,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Trophy style={{ width: 20, height: 20, color: '#10b981' }} />
              </div>
              <div>
                <h1 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#e8f0fb', lineHeight: 1 }}>
                  LỊCH THI ĐẤU
                </h1>
                <div style={{ fontSize: 10, color: '#3d5272', fontWeight: 600, marginTop: 3, letterSpacing: '0.04em' }}>
                  FIFA World Cup 2026™
                </div>
              </div>
            </div>
            <button style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)',
              borderRadius: 8, padding: '7px 14px', cursor: 'pointer',
              fontSize: 11, fontWeight: 700, color: '#4a607a',
            }}>
              <Filter style={{ width: 12, height: 12 }} />
              Bộ lọc
            </button>
          </div>

          {/* Search + competition */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
              <Search style={{
                position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)',
                width: 13, height: 13, color: '#3d5272',
              }} />
              <input
                type="text" placeholder="Tìm đội bóng, giải đấu..."
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: '100%', paddingLeft: 32, paddingRight: 14,
                  paddingTop: 9, paddingBottom: 9,
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 8, color: '#c4d4e8', fontSize: 12, fontWeight: 500,
                  outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, minWidth: 180,
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 8, padding: '9px 12px', cursor: 'pointer',
            }}>
              <Trophy style={{ width: 12, height: 12, color: '#f59e0b' }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: '#4a607a', flex: 1 }}>
                Tất cả các giải ({filtered.length})
              </span>
              <ChevronDown style={{ width: 11, height: 11, color: '#3d5272' }} />
            </div>
          </div>

          {/* Group tabs */}
          <div style={{ display: 'flex', gap: 4, overflowX: 'auto', scrollbarWidth: 'none' }}>
            {GROUPS.map(g => {
              const isActive = activeGroup === g;
              const color = GROUP_COLORS[g] ?? '#10b981';
              const activeBg = g === 'TẤT CẢ' ? '#10b981' : `${color}22`;
              const activeColor = g === 'TẤT CẢ' ? '#fff' : color;

              return (
                <button key={g} onClick={() => setActiveGroup(g)} style={{
                  flexShrink: 0, border: 'none', cursor: 'pointer',
                  padding: isActive ? '7px 16px' : '7px 14px',
                  borderRadius: isActive && g === 'TẤT CẢ' ? 99 : 7,
                  background: isActive ? activeBg : 'transparent',
                  color: isActive ? activeColor : '#3d5272',
                  fontSize: 11, fontWeight: 800, letterSpacing: '0.05em',
                  transition: 'all 0.15s',
                }}>
                  {g}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ══ CONTENT ═════════════════════════════════════════════ */}
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '22px 20px 60px' }}>

        {isLoading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 0', gap: 14 }}>
            <Loader2 style={{ width: 32, height: 32, color: '#10b981', animation: 'ltdSpin 1s linear infinite' }} />
            <span style={{ color: '#3d5272', fontSize: 13, fontWeight: 600 }}>Đang tải lịch thi đấu...</span>
          </div>
        )}

        {!isLoading && error && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center',
            padding: '48px 20px', background: 'rgba(239,68,68,0.05)',
            border: '1px solid rgba(239,68,68,0.15)', borderRadius: 10, color: '#ef4444',
          }}>
            <AlertCircle style={{ width: 18, height: 18 }} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>{error}</span>
          </div>
        )}

        {!isLoading && !error && filtered.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 0', gap: 12 }}>
            <Trophy style={{ width: 42, height: 42, color: '#1a2d48' }} />
            <span style={{ color: '#3d5272', fontSize: 13, fontWeight: 600 }}>Không tìm thấy trận đấu nào phù hợp.</span>
          </div>
        )}

        {!isLoading && !error && byDate.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            {byDate.map(({ date, fixtures: df }) => (
              <DateSection key={date} date={date} fixtures={df} />
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes ltdSpin { to { transform: rotate(360deg); } }
        @keyframes ltdPulse { 0%,100%{opacity:1} 50%{opacity:0.25} }
        .ltd-card { transition: border-color 0.2s, box-shadow 0.2s; }
        .ltd-card:hover { border-color: rgba(16,185,129,0.18) !important; box-shadow: 0 6px 28px rgba(0,0,0,0.35) !important; }
        input::placeholder { color: #3d5272 !important; }
        ::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
