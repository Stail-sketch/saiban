import { useState } from 'react';
import { socket } from '../../socket';
import { useGameStore } from '../../stores/gameStore';
import { useTimer } from '../../hooks/useTimer';

export function ClosingArgument() {
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const phase = useGameStore(s => s.phase);
  const myRole = useGameStore(s => s.myRole);
  const roomCode = useGameStore(s => s.roomCode);
  const myPlayerId = useGameStore(s => s.myPlayerId);
  const caseInfo = useGameStore(s => s.caseInfo);
  const timer = useTimer();

  const isProsecution = phase === 'closing_prosecution';
  const isMyTurn = (isProsecution && myRole === 'prosecution') || (!isProsecution && myRole === 'defense');
  const choices = caseInfo?.closings || [];

  const handleSubmit = () => {
    if (!selected || submitted) return;
    socket.emit('select-statement', { roomCode, playerId: myPlayerId, choiceId: selected });
    setSubmitted(true);
  };

  return (
    <div style={styles.container}>
      <div style={styles.phaseLabel}>
        {isProsecution ? '検察官 最終弁論' : '弁護人 最終弁論'}
        <span style={{ marginLeft: 12, color: timer <= 5 ? 'var(--timer-warn)' : 'var(--text-accent)', fontFamily: 'monospace' }}>
          {timer}秒
        </span>
      </div>

      <p style={{ fontSize: 13, color: 'var(--text-secondary)', textAlign: 'center' }}>
        最後の訴えかけ。流され屋・退屈な人・感情屋が大きく動く可能性あり！
      </p>

      {isMyTurn && !submitted ? (
        <div style={styles.choices}>
          {choices.map(c => (
            <div
              key={c.id}
              onClick={() => setSelected(c.id)}
              style={{
                ...styles.choiceCard,
                borderColor: selected === c.id ? 'var(--text-accent)' : 'var(--border)',
                background: selected === c.id ? 'rgba(255,215,0,0.1)' : 'var(--bg-card)',
              }}
            >
              <span style={{
                fontSize: 11, fontWeight: 700,
                color: c.impact === 'strong' ? '#e74c3c' : c.impact === 'medium' ? '#f39c12' : '#95a5a6',
              }}>
                {c.impact === 'strong' ? '渾身の一撃' : c.impact === 'medium' ? '堅実' : '控えめ'}
              </span>
              <div style={{ fontSize: 14, marginTop: 4 }}>「{c.text}」</div>
            </div>
          ))}
          <button
            className={isProsecution ? 'btn-prosecution' : 'btn-defense'}
            onClick={handleSubmit}
            disabled={!selected}
            style={{ width: '100%', padding: 14, fontSize: 16 }}
          >
            最終弁論を行う！
          </button>
        </div>
      ) : isMyTurn && submitted ? (
        <div style={styles.waiting}>弁論を送信しました...</div>
      ) : (
        <div style={styles.waiting}>{isProsecution ? '検察官' : '弁護人'}が最終弁論を選んでいます...</div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { padding: 16, display: 'flex', flexDirection: 'column' as const, gap: 12, height: '100%' },
  phaseLabel: { fontSize: 20, fontWeight: 900, textAlign: 'center' as const },
  choices: { display: 'flex', flexDirection: 'column' as const, gap: 8, flex: 1 },
  choiceCard: { padding: '12px 14px', borderRadius: 8, border: '2px solid', cursor: 'pointer', transition: 'all 0.2s' },
  waiting: { textAlign: 'center' as const, color: 'var(--text-secondary)', padding: 40, fontSize: 16 },
};
