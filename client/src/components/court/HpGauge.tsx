import { useGameStore } from '../../stores/gameStore';

export function HpGauge() {
  const hp = useGameStore(s => s.hp);

  return (
    <div style={styles.container}>
      <GaugeBar label="検察" hp={hp.prosecution} color="var(--prosecution)" />
      <GaugeBar label="弁護" hp={hp.defense} color="var(--defense)" />
    </div>
  );
}

function GaugeBar({ label, hp, color }: { label: string; hp: number; color: string }) {
  const maxHp = 5;
  const pct = (hp / maxHp) * 100;

  return (
    <div style={styles.gauge}>
      <span style={{ ...styles.label, color }}>{label}</span>
      <div style={styles.barBg}>
        <div style={{
          ...styles.barFill,
          width: `${pct}%`,
          background: hp <= 1 ? 'var(--timer-warn)' : color,
        }} className={hp <= 1 ? 'pulse' : ''} />
      </div>
      <span style={{ ...styles.hpText, color: hp <= 1 ? 'var(--timer-warn)' : 'var(--text-primary)' }}>
        {hp}/{maxHp}
      </span>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    gap: 16,
    padding: '6px 0',
  },
  gauge: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontWeight: 900,
    fontSize: 12,
    width: 30,
  },
  barBg: {
    flex: 1,
    height: 12,
    background: 'var(--bg-card)',
    borderRadius: 6,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 6,
    transition: 'width 0.5s ease, background 0.3s',
  },
  hpText: {
    fontSize: 13,
    fontWeight: 900,
    fontFamily: 'monospace',
    width: 30,
    textAlign: 'right' as const,
  },
};
