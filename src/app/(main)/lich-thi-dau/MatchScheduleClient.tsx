'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Search, Trophy, Filter, MapPin, Clock,
  ChevronDown, Loader2, AlertCircle, CalendarDays, Tv2, Sparkles
} from 'lucide-react';
import { isPlaceholderTeam } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface FixtureTeam { name: string; logo: string; }
interface Fixture {
  id: string;
  team1: FixtureTeam;
  team2: FixtureTeam;
  category: string;
  matchDate: string;   // 'YYYY-MM-DD'
  matchTime: string;   // 'HH:MM'
  status: string;
  score1: string | null;
  score2: string | null;
  ground: string;
}

// ---------------------------------------------------------------------------
// Constants & Helpers
// ---------------------------------------------------------------------------
const GROUPS = ['TẤT CẢ', 'GROUP A', 'GROUP B', 'GROUP C', 'GROUP D', 'GROUP E', 'GROUP F', 'GROUP G', 'GROUP H'];

const GROUP_COLORS: Record<string, string> = {
  'GROUP A': '#f59e0b', 'GROUP B': '#3b82f6', 'GROUP C': '#a855f7',
  'GROUP D': '#ef4444', 'GROUP E': '#06b6d4', 'GROUP F': '#10b981',
  'GROUP G': '#f97316', 'GROUP H': '#ec4899',
};

const FIFA_RANKS: Record<string, number> = {
  'Argentina': 1, 'France': 2, 'England': 3, 'Brazil': 4, 'Belgium': 5,
  'Portugal': 6, 'Netherlands': 7, 'Spain': 8, 'Germany': 9, 'Uruguay': 10,
  'Colombia': 11, 'Croatia': 12, 'Morocco': 13, 'Mexico': 14, 'USA': 15,
  'Switzerland': 16, 'Japan': 17, 'South Korea': 18, 'Canada': 19, 'Senegal': 20,
  'Denmark': 21, 'Austria': 22, 'Turkey': 23, 'Ecuador': 24, 'Chile': 25,
  'Italy': 26, 'Australia': 27, 'Iran': 28, 'Poland': 29, 'Czech Republic': 30,
  'Scotland': 31, 'Norway': 32, 'Wales': 33, 'Hungary': 34, 'Paraguay': 35,
  'Serbia': 36, 'Costa Rica': 37, 'Saudi Arabia': 38, 'Tunisia': 39, 'Egypt': 40,
  'Romania': 41, 'Algeria': 42, 'Slovakia': 43, 'Ivory Coast': 44, 'Cameroon': 45,
  'Ghana': 46, 'South Africa': 47, 'Panama': 49, 'DR Congo': 55,
  'Bosnia & Herzegovina': 57, 'Qatar': 60, 'Iraq': 63, 'Uzbekistan': 64,
  'Cape Verde': 65, 'Curaçao': 76, 'Haiti': 83, 'Jordan': 87, 'New Zealand': 96,
};

function extractGroup(category: string): string {
  const m = category.match(/Group ([A-L])/i);
  return m ? `GROUP ${m[1].toUpperCase()}` : '';
}

function formatViDate(dateStr: string): string {
  const days = ['CHỦ NHẬT', 'THỨ HAI', 'THỨ BA', 'THỨ TƯ', 'THỨ NĂM', 'THỨ SÁU', 'THỨ BẢY'];
  const d = new Date(dateStr + 'T00:00:00');
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${days[d.getDay()]}, ${dd}/${mm}/${yyyy}`;
}

/** "2026-06-25" → "25/06/2026" */
function shortDate(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function hash(s: string) { return s.split('').reduce((a, c) => a + c.charCodeAt(0), 0); }

function getProbabilities(t1: string, t2: string) {
  if (isPlaceholderTeam(t1) || isPlaceholderTeam(t2)) {
    return { win: 50, draw: 0, lose: 50 };
  }
  const h1 = hash(t1), h2 = hash(t2);
  const r1 = ((h1 * 37 + 13) % 55) + 15;
  const r2 = ((h2 * 29 + 7) % 30) + 10;
  const rd = ((h1 + h2) * 11 % 25) + 10;
  const total = r1 + r2 + rd;
  const win = Math.round((r1 / total) * 100);
  const draw = Math.round((rd / total) * 100);
  return { win, draw, lose: 100 - win - draw };
}

function getAiPct(t1: string, t2: string) {
  return ((hash(t1 + t2) * 17 + 43) % 15) + 84;
}

function getRank(name: string) {
  const h = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return FIFA_RANKS[name] ?? ((h * 7 + 1) % 80 + 20);
}

// ---------------------------------------------------------------------------
// TeamFlag: rounded square, shows abbr on error
// ---------------------------------------------------------------------------
function TeamFlag({ logo, name, size = 60 }: { logo: string; name: string; size?: number }) {
  const [err, setErr] = useState(false);
  const abbr = name.split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase();
  if (err || !logo) {
    return (
      <div style={{
        width: size, height: size, flexShrink: 0, borderRadius: 10,
        background: 'linear-gradient(135deg,#1a2f52,#0d1c36)',
        border: '2px solid rgba(255,255,255,0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 12, fontWeight: 900, color: '#475569', letterSpacing: '0.04em',
      }}>{abbr}</div>
    );
  }
  return (
    <img src={logo} alt={name} onError={() => setErr(true)}
      style={{
        width: size, height: size, objectFit: 'contain', flexShrink: 0,
        borderRadius: 10, border: '2px solid rgba(255,255,255,0.08)',
        background: 'rgba(255,255,255,0.03)',
        display: 'block',
      }} />
  );
}

// ---------------------------------------------------------------------------
// MatchCard — pixel-perfect replica of reference design
//
//  ┌────────────────────────────────────────────────────────────┐
//  │ [🏆GROUP B] [📍Vancouver]            [🕐 02:00 • 25/06]   │ meta
//  ├────────────────────────────────────────────────────────────┤
//  │ [🇨🇭] Switzerland   KICK-OFF  Canada [🇨🇦]          [🤖]  │ body
//  │       FIFA RANK #16  02:00   FIFA RANK #19        AI DỰ  │
// MatchCard
// ---------------------------------------------------------------------------
function MatchCard({ fixture }: { fixture: Fixture }) {
  const group = extractGroup(fixture.category);
  const prob = getProbabilities(fixture.team1.name, fixture.team2.name);
  const aiPct = getAiPct(fixture.team1.name, fixture.team2.name);
  const rank1 = getRank(fixture.team1.name);
  const rank2 = getRank(fixture.team2.name);
  const isLive = fixture.status === 'Đang đấu';
  const isDone = fixture.status === 'Kết thúc';
  const groupColor = GROUP_COLORS[group] ?? '#10b981';

  const label1 = fixture.team1.name.toUpperCase();
  const label2 = fixture.team2.name.toUpperCase();

  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid rgba(15,23,42,0.08)',
      borderRadius: 10,
      overflow: 'hidden',
      boxShadow: '0 4px 16px rgba(15,23,42,0.02)',
    }} className="ltd-card">

      {/* ── META ROW ──────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 14px',
        background: 'rgba(15,23,42,0.02)',
        borderBottom: '1px solid rgba(15,23,42,0.05)',
        gap: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
          {group && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              background: `${groupColor}15`,
              border: `1px solid ${groupColor}30`,
              borderRadius: 5, padding: '2px 8px', flexShrink: 0,
            }}>
              <Trophy style={{ width: 9, height: 9, color: groupColor }} />
              <span style={{ fontSize: 9, fontWeight: 900, color: groupColor, letterSpacing: '0.08em' }}>{group}</span>
            </div>
          )}
          {fixture.ground && fixture.ground !== 'Chưa xác định' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0 }}>
              <MapPin style={{ width: 10, height: 10, color: '#64748b', flexShrink: 0 }} />
              <span style={{
                fontSize: 10, color: '#475569', fontWeight: 500,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>{fixture.ground}</span>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
          {isLive ? (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 99, padding: '2px 8px',
              fontSize: 10, fontWeight: 800, color: '#ef4444',
            }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#ef4444', animation: 'ltdPulse 1s infinite', display: 'inline-block' }} />
              LIVE
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Clock style={{ width: 10, height: 10, color: '#64748b' }} />
              <span style={{ fontSize: 10, color: '#475569', fontWeight: 600 }}>
                {fixture.matchTime} • {shortDate(fixture.matchDate)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── BODY ROW ──────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center',
        padding: '16px 14px 14px',
        gap: 8,
      }}>

        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
          <TeamFlag logo={fixture.team1.logo} name={fixture.team1.name} size={60} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{
              fontSize: 16, fontWeight: 800, color: '#0f172a', lineHeight: 1.25,
              letterSpacing: '-0.01em',
            }}>
              {fixture.team1.name}
            </div>
            <div style={{ fontSize: 9, color: '#64748b', fontWeight: 700, letterSpacing: '0.05em', marginTop: 4 }}>
              {isPlaceholderTeam(fixture.team1.name) ? 'RANK: —' : `FIFA RANK #${rank1}`}
            </div>
          </div>
        </div>

        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          width: 110, flexShrink: 0, gap: 2,
        }}>
          {isDone || isLive ? (
            <>
              <span style={{ fontSize: 8, fontWeight: 700, color: '#64748b', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                {isDone ? 'KẾT THÚC' : '⚡ LIVE'}
              </span>
              <div style={{
                fontSize: 34, fontWeight: 900, color: '#0f172a', lineHeight: 1,
                letterSpacing: '0.02em',
              }}>
                {fixture.score1 ?? 0}<span style={{ color: '#cbd5e1', margin: '0 2px' }}>–</span>{fixture.score2 ?? 0}
              </div>
            </>
          ) : (
            <>
              <span style={{ fontSize: 8, fontWeight: 700, color: '#64748b', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                KICK-OFF
              </span>
              <div style={{
                fontSize: 34, fontWeight: 900, color: '#0f172a', lineHeight: 1,
                letterSpacing: '0.01em',
              }}>
                {fixture.matchTime}
              </div>
              <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600, marginTop: 1 }}>
                {shortDate(fixture.matchDate)}
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

        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 14, minWidth: 0 }}>
          <div style={{ minWidth: 0, textAlign: 'right', flex: 1 }}>
            <div style={{
              fontSize: 16, fontWeight: 800, color: '#0f172a', lineHeight: 1.25,
              letterSpacing: '-0.01em',
            }}>
              {fixture.team2.name}
            </div>
            <div style={{ fontSize: 9, color: '#64748b', fontWeight: 700, letterSpacing: '0.05em', marginTop: 4 }}>
              {isPlaceholderTeam(fixture.team2.name) ? 'RANK: —' : `FIFA RANK #${rank2}`}
            </div>
          </div>
          <TeamFlag logo={fixture.team2.logo} name={fixture.team2.name} size={60} />
        </div>

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
            {isPlaceholderTeam(fixture.team1.name) || isPlaceholderTeam(fixture.team2.name) ? '—' : `${aiPct}%`}
          </div>
        </div>
      </div>

      {/* ── WIN PROBABILITY ───────────────────────────────────── */}
      <div style={{ borderTop: '1px solid rgba(15,23,42,0.04)' }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '6px 14px 4px',
        }}>
          <span style={{ fontSize: 9, fontWeight: 900, color: '#10b981', letterSpacing: '0.04em' }}>
            {prob.win}% {label1} WIN
          </span>
          <span style={{ fontSize: 9, fontWeight: 700, color: '#64748b', letterSpacing: '0.04em' }}>
            {prob.draw}% HÒA
          </span>
          <span style={{ fontSize: 9, fontWeight: 900, color: groupColor, letterSpacing: '0.04em' }}>
            {prob.lose}% {label2} WIN
          </span>
        </div>
        {/* Bar */}
        <div style={{ display: 'flex', height: 4 }}>
          <div style={{ width: `${prob.win}%`, background: 'linear-gradient(90deg,#059669,#10b981)' }} />
          <div style={{ width: `${prob.draw}%`, background: '#e2e8f0' }} />
          <div style={{ width: `${prob.lose}%`, background: `linear-gradient(90deg,${groupColor}88,${groupColor})` }} />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// DateSection
// ---------------------------------------------------------------------------
function DateSection({ date, fixtures }: { date: string; fixtures: Fixture[] }) {
  return (
    <div>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        paddingBottom: 12, marginBottom: 10,
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <CalendarDays style={{ width: 14, height: 14, color: '#10b981' }} />
          <span style={{ fontSize: 12, fontWeight: 800, color: '#c4d4e8', letterSpacing: '0.04em' }}>
            {formatViDate(date)}
          </span>
        </div>
        <div style={{
          background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)',
          borderRadius: 99, padding: '3px 12px',
          fontSize: 9, fontWeight: 900, color: '#10b981', letterSpacing: '0.08em',
        }}>
          {fixtures.length} TRẬN
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {fixtures.map(f => <MatchCard key={f.id} fixture={f} />)}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------
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
