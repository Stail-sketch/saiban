import { useTimer } from '../../hooks/useTimer';
import { useGameStore } from '../../stores/gameStore';

export function PhaseTimer() {
  const timer = useTimer();
  const phase = useGameStore(s => s.phase);
  const currentTurn = useGameStore(s => s.currentTurn);

  if (timer <= 0) return null;

  const minutes = Math.floor(timer / 60);
  const seconds = timer % 60;
  const isLow = timer <= 10;

  const phaseLabel: Record<string, string> = {
    opening_prosecution: '検察官 冒頭陳述',
    opening_defense: '弁護人 冒頭陳述',
    evidence: `証拠・尋問 (${currentTurn === 'prosecution' ? '検察ターン' : '弁護ターン'})`,
    closing_prosecution: '検察官 最終弁論',
    closing_defense: '弁護人 最終弁論',
  };

  return (
    <div style={styles.container}>
      <span style={styles.phase}>{phaseLabel[phase] || phase}</span>
      <span style={{
        ...styles.time,
        color: isLow ? 'var(--timer-warn)' : 'var(--text-accent)',
      }} className={isLow ? 'pulse' : ''}>
        {minutes}:{seconds.toString().padStart(2, '0')}
      </span>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 16px',
    background: 'var(--bg-secondary)',
    borderRadius: 8,
  },
  phase: {
    fontWeight: 700,
    fontSize: 14,
  },
  time: {
    fontWeight: 900,
    fontSize: 24,
    fontFamily: 'monospace',
  },
};
