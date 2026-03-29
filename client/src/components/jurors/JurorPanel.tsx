import { useGameStore } from '../../stores/gameStore';
import { JurorCard } from './JurorCard';

interface Props {
  onJurorClick?: (index: number) => void;
  selectedJuror?: number | null;
}

export function JurorPanel({ onJurorClick, selectedJuror }: Props) {
  const jurors = useGameStore(s => s.jurors);
  const guiltyCount = jurors.filter(j => j.vote === '有罪').length;
  const notGuiltyCount = jurors.filter(j => j.vote === '無罪').length;

  return (
    <div style={styles.panel}>
      <div style={styles.counter}>
        <span style={{ color: 'var(--guilty)', fontWeight: 900, fontSize: 20 }}>有罪 {guiltyCount}</span>
        <span style={{ color: 'var(--text-secondary)', fontSize: 16 }}> — </span>
        <span style={{ color: 'var(--not-guilty)', fontWeight: 900, fontSize: 20 }}>無罪 {notGuiltyCount}</span>
      </div>
      <div style={styles.grid}>
        {jurors.map(j => (
          <JurorCard
            key={j.index}
            juror={j}
            onClick={onJurorClick ? () => onJurorClick(j.index) : undefined}
            selected={selectedJuror === j.index}
          />
        ))}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  panel: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 10,
  },
  counter: {
    textAlign: 'center' as const,
    padding: '8px',
    background: 'var(--bg-secondary)',
    borderRadius: 8,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 8,
  },
};
