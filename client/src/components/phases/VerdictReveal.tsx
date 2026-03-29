import { useGameStore } from '../../stores/gameStore';

export function VerdictReveal() {
  const verdictRevealed = useGameStore(s => s.verdictRevealed);
  const winner = useGameStore(s => s.winner);
  const jurors = useGameStore(s => s.jurors);

  const guiltyCount = verdictRevealed.filter(v => v.vote === '有罪').length;
  const notGuiltyCount = verdictRevealed.filter(v => v.vote === '無罪').length;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center',
      height: '100%', padding: 20, gap: 20,
      background: 'radial-gradient(ellipse at center, #1a1028 0%, #0a0a12 70%)',
    }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, color: 'var(--text-accent)', letterSpacing: 6 }}>
        評　決
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, width: '100%', maxWidth: 480 }}>
        {jurors.map((j, i) => {
          const rev = verdictRevealed.find(v => v.index === i);
          return (
            <div key={i} className={rev ? 'card-reveal' : ''} style={{
              padding: 16, borderRadius: 10, textAlign: 'center' as const,
              background: !rev ? 'var(--bg-card)' : rev.vote === '有罪' ? 'rgba(255,51,51,0.15)' : 'rgba(51,204,119,0.15)',
              border: rev ? `2px solid ${rev.vote === '有罪' ? 'var(--guilty)' : 'var(--not-guilty)'}` : '2px solid var(--border)',
              boxShadow: rev ? `0 0 20px ${rev.vote === '有罪' ? 'rgba(255,51,51,0.2)' : 'rgba(51,204,119,0.2)'}` : 'none',
            }}>
              <div style={{ fontWeight: 900, fontSize: 13, marginBottom: 6 }}>{j.nickname}</div>
              {rev ? (
                <div style={{
                  fontFamily: 'var(--font-display)', fontSize: 22,
                  color: rev.vote === '有罪' ? 'var(--guilty)' : 'var(--not-guilty)',
                }}>{rev.vote}</div>
              ) : (
                <div style={{ fontSize: 28, color: 'var(--text-secondary)' }}>?</div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{
        textAlign: 'center' as const, padding: '12px 32px',
        background: 'var(--bg-secondary)', borderRadius: 8, border: '1px solid var(--border-gold)',
      }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--guilty)' }}>{guiltyCount}</span>
        <span style={{ margin: '0 12px', color: 'var(--text-secondary)' }}>vs</span>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--not-guilty)' }}>{notGuiltyCount}</span>
      </div>

      {winner && (
        <>
          <div className="verdict-appear" style={{
            fontFamily: 'var(--font-display)', fontSize: 72, letterSpacing: 20,
            color: guiltyCount >= 4 ? 'var(--guilty)' : 'var(--not-guilty)',
            textShadow: `0 0 40px ${guiltyCount >= 4 ? 'rgba(255,51,51,0.5)' : 'rgba(51,204,119,0.5)'}`,
          }}>
            {guiltyCount >= 4 ? '有罪' : '無罪'}
          </div>
          <div className="fade-in" style={{
            fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--text-accent)', letterSpacing: 4,
          }}>
            {winner === 'prosecution' ? '検察官の勝利' : '弁護人の勝利'}
          </div>
        </>
      )}
    </div>
  );
}
