import { useGameStore } from '../../stores/gameStore';
import { socket } from '../../socket';
import { DialogueBox } from '../court/DialogueBox';

export function IntroScreen() {
  const caseTitle = useGameStore(s => s.caseTitle);
  const defendant = useGameStore(s => s.defendant);
  const victim = useGameStore(s => s.victim);
  const roomCode = useGameStore(s => s.roomCode);
  const dialogue = useGameStore(s => s.dialogue);

  return (
    <div style={styles.bg}>
      <div className="fade-in" style={styles.titleCard}>
        <div style={styles.caseNum}>CASE 1</div>
        <h1 style={styles.title}>{caseTitle}</h1>
      </div>

      <div style={styles.dialogueArea}>
        {dialogue.map(d => (
          <div key={d.id} className="fade-in" style={styles.line}>
            {d.content}
          </div>
        ))}
      </div>

      {dialogue.length >= 3 && (
        <button className="btn-primary" onClick={() => socket.emit('intro-done', { roomCode })}
          style={styles.proceedBtn}>
          探偵パートへ進む
        </button>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  bg: {
    height: '100vh', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', gap: 24, padding: 24,
    background: 'radial-gradient(ellipse at center, #1a1028 0%, #0a0a12 70%)',
  },
  titleCard: { textAlign: 'center' },
  caseNum: {
    fontFamily: 'var(--font-display)', fontSize: 14, color: 'var(--prosecution)',
    letterSpacing: 6, marginBottom: 8,
  },
  title: {
    fontFamily: 'var(--font-display)', fontSize: 32, color: 'var(--text-accent)',
    letterSpacing: 4, textShadow: '0 0 30px rgba(255,215,0,0.3)',
  },
  dialogueArea: {
    maxWidth: 600, width: '100%', display: 'flex', flexDirection: 'column', gap: 12,
  },
  line: {
    fontSize: 15, lineHeight: 1.8, color: 'var(--text-primary)',
    padding: '10px 16px', background: 'rgba(255,255,255,0.03)',
    borderRadius: 6, borderLeft: '3px solid var(--judge)',
  },
  proceedBtn: { padding: '14px 40px', fontSize: 16 },
};
