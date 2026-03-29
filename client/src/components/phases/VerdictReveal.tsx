import { useGameStore } from '../../stores/gameStore';

export function VerdictReveal() {
  const verdictRevealed = useGameStore(s => s.verdictRevealed);
  const winner = useGameStore(s => s.winner);
  const jurors = useGameStore(s => s.jurors);

  const guiltyCount = verdictRevealed.filter(v => v.vote === '有罪').length;
  const notGuiltyCount = verdictRevealed.filter(v => v.vote === '無罪').length;

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>評決</h2>

      <div style={styles.jurorGrid}>
        {jurors.map((j, i) => {
          const revealed = verdictRevealed.find(v => v.index === i);
          return (
            <div key={i} className={revealed ? 'card-reveal' : ''} style={{
              ...styles.jurorCard,
              background: !revealed ? 'var(--bg-card)'
                        : revealed.vote === '有罪' ? 'rgba(231,76,60,0.3)' : 'rgba(46,204,113,0.3)',
              border: revealed ? `2px solid ${revealed.vote === '有罪' ? 'var(--guilty)' : 'var(--not-guilty)'}` : '2px solid var(--border)',
            }}>
              <div style={styles.jurorName}>{j.nickname}</div>
              {revealed ? (
                <div style={{
                  fontSize: 24,
                  fontWeight: 900,
                  color: revealed.vote === '有罪' ? 'var(--guilty)' : 'var(--not-guilty)',
                }}>
                  {revealed.vote}
                </div>
              ) : (
                <div style={{ fontSize: 24, color: 'var(--text-secondary)' }}>？</div>
              )}
            </div>
          );
        })}
      </div>

      <div style={styles.tally}>
        <span style={{ color: 'var(--guilty)', fontSize: 28, fontWeight: 900 }}>有罪 {guiltyCount}</span>
        <span style={{ color: 'var(--text-secondary)', fontSize: 20 }}> — </span>
        <span style={{ color: 'var(--not-guilty)', fontSize: 28, fontWeight: 900 }}>無罪 {notGuiltyCount}</span>
      </div>

      {winner && (
        <div className="verdict-appear" style={{
          ...styles.verdict,
          color: guiltyCount >= 4 ? 'var(--guilty)' : 'var(--not-guilty)',
        }}>
          {guiltyCount >= 4 ? '有 罪' : '無 罪'}
        </div>
      )}

      {winner && (
        <div className="fade-in" style={styles.winnerText}>
          {winner === 'prosecution' ? '検察官の勝利！' : '弁護人の勝利！'}
        </div>
      )}
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
    gap: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 900,
    color: 'var(--text-accent)',
  },
  jurorGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 12,
    width: '100%',
    maxWidth: 500,
  },
  jurorCard: {
    padding: '16px',
    borderRadius: 10,
    textAlign: 'center' as const,
  },
  jurorName: {
    fontSize: 13,
    fontWeight: 700,
    marginBottom: 8,
  },
  tally: {
    textAlign: 'center' as const,
    padding: '12px 24px',
    background: 'var(--bg-secondary)',
    borderRadius: 8,
  },
  verdict: {
    fontSize: 64,
    fontWeight: 900,
    letterSpacing: 16,
    textShadow: '0 4px 20px rgba(0,0,0,0.5)',
  },
  winnerText: {
    fontSize: 20,
    fontWeight: 700,
    color: 'var(--text-accent)',
  },
};
