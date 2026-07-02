'use client';

import { useState } from 'react';

export function TeamFlag({ logo, name, size = 60 }: { logo: string; name: string; size?: number }) {
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
