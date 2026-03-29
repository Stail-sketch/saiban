import { useGameStore } from '../../stores/gameStore';

export function ResultScreen() {
  const winner = useGameStore(s => s.winner);
  const myRole = useGameStore(s => s.myRole);
  const truth = useGameStore(s => s.truth);
  const jurors = useGameStore(s => s.jurors);
  const reset = useGameStore(s => s.reset);

  const guiltyCount = jurors.filter(j => j.vote === '有罪').length;
  const notGuiltyCount = jurors.filter(j => j.vote === '無罪').length;
  const isWinner = winner === myRole;
  const verdictMatchesTruth = truth
    ? (guiltyCount >= 4 && truth.guilty) || (guiltyCount < 4 && !truth.guilty)
    : false;

  const handlePlayAgain = () => {
    sessionStorage.removeItem('roomCode');
    sessionStorage.removeItem('playerId');
    reset();
  };

  return (
    <div style={styles.container}>
      <div className="verdict-appear" style={styles.card}>
        <h1 style={{
          ...styles.result,
          color: isWinner ? 'var(--text-accent)' : 'var(--prosecution)',
        }}>
          {myRole === 'spectator' ? (winner === 'prosecution' ? '検察官の勝利' : '弁護人の勝利')
           : isWinner ? '勝利！' : '敗北...'}
        </h1>

        <div style={styles.stats}>
          <div style={styles.statRow}>
            <span>評決</span>
            <span style={{ fontWeight: 900, color: guiltyCount >= 4 ? 'var(--guilty)' : 'var(--not-guilty)' }}>
              {guiltyCount >= 4 ? '有罪' : '無罪'} ({guiltyCount} - {notGuiltyCount})
            </span>
          </div>
          {truth && (
            <>
              <div style={styles.statRow}>
                <span>真相</span>
                <span style={{ fontWeight: 900, color: truth.guilty ? 'var(--guilty)' : 'var(--not-guilty)' }}>
                  被告は{truth.guilty ? '犯人だった' : '無実だった'}
                </span>
              </div>
              <div style={styles.statRow}>
                <span>正義の実現</span>
                <span style={{ fontWeight: 900, color: verdictMatchesTruth ? 'var(--not-guilty)' : 'var(--guilty)' }}>
                  {verdictMatchesTruth ? '正しい判決！' : '冤罪 or 犯人を逃した...'}
                </span>
              </div>
            </>
          )}
        </div>

        <button className="btn-primary" onClick={handlePlayAgain} style={{ width: '100%', padding: 16, fontSize: 18, marginTop: 20 }}>
          もう一度遊ぶ
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
  },
  card: {
    background: 'var(--bg-surface)',
    borderRadius: 16,
    padding: '40px 36px',
    width: 420,
    maxWidth: '90vw',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    border: '1px solid var(--border)',
    textAlign: 'center' as const,
  },
  result: {
    fontSize: 36,
    fontWeight: 900,
    marginBottom: 24,
  },
  stats: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 12,
  },
  statRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '10px 16px',
    background: 'var(--bg-card)',
    borderRadius: 8,
    fontSize: 14,
  },
};
