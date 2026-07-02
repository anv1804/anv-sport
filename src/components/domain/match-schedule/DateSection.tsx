import { CalendarDays } from 'lucide-react';
import { Fixture } from './types';
import { formatViDate } from './utils';
import { MatchCard } from './MatchCard';

export function DateSection({ date, fixtures }: { date: string; fixtures: Fixture[] }) {
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
