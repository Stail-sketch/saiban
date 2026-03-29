import { useGameStore } from '../../stores/gameStore';

export function ResultScreen() {
  const verdict = useGameStore(s => s.verdict);
  const caseTitle = useGameStore(s => s.caseTitle);
  const defendant = useGameStore(s => s.defendant);
  const dialogue = useGameStore(s => s.dialogue);
  const reset = useGameStore(s => s.reset);

  const won = verdict === 'not_guilty';

  const handlePlayAgain = () => {
    sessionStorage.removeItem('roomCode');
    sessionStorage.removeItem('playerId');
    reset();
  };

  // Find truth summary from dialogue
  const truthLine = dialogue.find(d => d.speaker === 'ナレーター' && d.content.startsWith('真相'));

  return (
    <div style={styles.bg}>
      <div className="verdict-appear" style={styles.card}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>{won ? '⚖️' : '💀'}</div>
        <h1 style={{
          ...styles.title,
          color: won ? 'var(--not-guilty)' : 'var(--guilty)',
        }}>
          {won ? '無罪勝ち取り！' : '弁護失敗...'}
        </h1>

        <div style={styles.caseTitle}>{caseTitle}</div>

        <div style={styles.statBox}>
          <div style={styles.statRow}>
            <span>被告人</span>
            <span>{defendant?.name}</span>
          </div>
          <div style={styles.statRow}>
            <span>判決</span>
            <span style={{ fontWeight: 900, color: won ? 'var(--not-guilty)' : 'var(--guilty)' }}>
              {won ? '無罪' : '有罪'}
            </span>
          </div>
        </div>

        {truthLine && (
          <div style={styles.truthBox}>
            <div style={{ fontSize: 11, color: 'var(--text-accent)', marginBottom: 4, fontWeight: 900 }}>真相</div>
            <div style={{ fontSize: 13, lineHeight: 1.6 }}>{truthLine.content.replace('真相：', '')}</div>
          </div>
        )}

        <button className="btn-primary" onClick={handlePlayAgain}
          style={{ width: '100%', padding: 16, fontSize: 18, marginTop: 16 }}>
          次の事件へ
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  bg: {
    display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh',
    background: 'radial-gradient(ellipse at center, #1a1028 0%, #0a0a12 70%)',
  },
  card: {
    background: 'linear-gradient(180deg, #16142a, #0e0e1a)', borderRadius: 16,
    padding: '36px 32px', width: 440, maxWidth: '92vw', textAlign: 'center',
    boxShadow: '0 0 60px rgba(255,215,0,0.05)', border: '1px solid var(--border-gold)',
  },
  title: { fontFamily: 'var(--font-display)', fontSize: 28, letterSpacing: 4, marginBottom: 12 },
  caseTitle: { fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16 },
  statBox: { display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 },
  statRow: {
    display: 'flex', justifyContent: 'space-between', padding: '10px 14px',
    background: 'var(--bg-card)', borderRadius: 6, fontSize: 14,
  },
  truthBox: {
    padding: '12px 14px', background: 'rgba(255,215,0,0.05)',
    borderRadius: 8, border: '1px solid var(--border-gold)', textAlign: 'left',
  },
};
