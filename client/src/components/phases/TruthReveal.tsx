import { useGameStore } from '../../stores/gameStore';

export function TruthReveal() {
  const truth = useGameStore(s => s.truth);
  const winner = useGameStore(s => s.winner);

  if (!truth) {
    return (
      <div style={styles.container}>
        <h2 style={styles.title}>真相を明かします</h2>
        <div className="suspense-dots" style={{ fontSize: 48, color: 'var(--text-accent)' }}>
          <span>.</span><span>.</span><span>.</span>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>真相</h2>
      <div className="verdict-appear" style={{
        ...styles.truth,
        color: truth.guilty ? 'var(--guilty)' : 'var(--not-guilty)',
      }}>
        被告は{truth.guilty ? '犯人だった' : '無実だった'}
      </div>
      <div className="fade-in" style={styles.reason}>
        {truth.reason}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    padding: 20,
    gap: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 900,
    color: 'var(--judge)',
  },
  truth: {
    fontSize: 36,
    fontWeight: 900,
    textShadow: '0 4px 20px rgba(0,0,0,0.5)',
  },
  reason: {
    fontSize: 16,
    color: 'var(--text-secondary)',
    textAlign: 'center' as const,
    maxWidth: 500,
    lineHeight: 1.8,
  },
};
