import { useGameStore } from '../../stores/gameStore';

export function HpGauge() {
  const hp = useGameStore(s => s.hp);

  return (
    <div style={{ display: 'flex', gap: 20, padding: '4px 0' }}>
      <Bar label="検察" hp={hp.prosecution} color="var(--prosecution)" />
      <Bar label="弁護" hp={hp.defense} color="var(--defense)" />
    </div>
  );
}

function Bar({ label, hp, color }: { label: string; hp: number; color: string }) {
  const max = 5;
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontFamily: 'var(--font-display)', fontSize: 11, color, width: 28 }}>{label}</span>
      <div style={{ flex: 1, display: 'flex', gap: 3 }}>
        {Array.from({ length: max }).map((_, i) => (
          <div key={i} style={{
            flex: 1, height: 10, borderRadius: 2,
            background: i < hp ? color : 'var(--bg-card)',
            boxShadow: i < hp ? `0 0 6px ${color}40` : 'none',
            transition: 'all 0.4s',
            opacity: i < hp ? 1 : 0.3,
          }} className={hp <= 1 && i < hp ? 'pulse' : ''} />
        ))}
      </div>
      <span style={{
        fontFamily: 'monospace', fontWeight: 900, fontSize: 12, width: 20, textAlign: 'right' as const,
        color: hp <= 1 ? 'var(--timer-warn)' : 'var(--text-primary)',
      }}>{hp}</span>
    </div>
  );
}
