'use client';

import { Trophy, MapPin, Clock, Tv2 } from 'lucide-react';
import { isPlaceholderTeam } from '@/lib/utils';
import { Fixture } from './types';
import { GROUP_COLORS } from './constants';
import { extractGroup, getProbabilities, getAiPct, getRank, shortDate } from './utils';
import { TeamFlag } from './TeamFlag';

export function MatchCard({ fixture }: { fixture: Fixture }) {
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
