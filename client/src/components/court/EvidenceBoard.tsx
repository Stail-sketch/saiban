import { useGameStore } from '../../stores/gameStore';
import type { Evidence } from '../../types/game';

interface Props {
  onSelect?: (evidence: Evidence) => void;
  selectedId?: string | null;
}

export function EvidenceBoard({ onSelect, selectedId }: Props) {
  const publicEvidence = useGameStore(s => s.publicEvidence);

  return (
    <div style={styles.container}>
      <div style={styles.header}>公開証拠ボード ({publicEvidence.length})</div>
      <div style={styles.list}>
        {publicEvidence.length === 0 && (
          <p style={{ color: 'var(--text-secondary)', fontSize: 12, padding: 10 }}>
            まだ証拠は提出されていません
          </p>
        )}
        {publicEvidence.map(ev => (
          <div
            key={ev.id}
            onClick={() => onSelect?.(ev)}
            className="fade-in"
            style={{
              ...styles.card,
              borderColor: selectedId === ev.id ? 'var(--text-accent)'
                         : ev.side === 'prosecution' ? 'var(--prosecution)' : 'var(--defense)',
              cursor: onSelect ? 'pointer' : 'default',
            }}
          >
            <div style={styles.evHeader}>
              <span style={{
                fontSize: 11,
                fontWeight: 700,
                color: ev.side === 'prosecution' ? 'var(--prosecution)' : 'var(--defense)',
              }}>
                [{ev.id}] {ev.name}
              </span>
              <span style={{
                fontSize: 10,
                padding: '2px 6px',
                borderRadius: 4,
                background: ev.strength === 'strong' ? '#c0392b'
                           : ev.strength === 'medium' ? '#f39c12'
                           : '#7f8c8d',
                color: 'white',
              }}>
                {ev.strength}
              </span>
            </div>
            <div style={styles.evType}>{ev.type}</div>
            <div style={styles.evDesc}>{ev.description}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    background: 'var(--bg-secondary)',
    borderRadius: 8,
    overflow: 'hidden',
    maxHeight: 200,
  },
  header: {
    padding: '8px 12px',
    fontWeight: 700,
    fontSize: 13,
    borderBottom: '1px solid var(--border)',
    color: 'var(--text-accent)',
  },
  list: {
    overflowY: 'auto' as const,
    padding: 8,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 6,
  },
  card: {
    padding: '8px 10px',
    background: 'var(--bg-card)',
    borderRadius: 6,
    border: '1px solid',
  },
  evHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  evType: {
    fontSize: 10,
    color: 'var(--text-secondary)',
  },
  evDesc: {
    fontSize: 12,
    marginTop: 2,
  },
};
