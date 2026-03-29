import { useState } from 'react';
import { socket } from '../../socket';
import { useGameStore } from '../../stores/gameStore';
import { useTimer } from '../../hooks/useTimer';

export function ClosingArgument() {
  const [text, setText] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const phase = useGameStore(s => s.phase);
  const myRole = useGameStore(s => s.myRole);
  const roomCode = useGameStore(s => s.roomCode);
  const myPlayerId = useGameStore(s => s.myPlayerId);
  const timer = useTimer();

  const isProsecution = phase === 'closing_prosecution';
  const isMyTurn = (isProsecution && myRole === 'prosecution') || (!isProsecution && myRole === 'defense');

  const handleSubmit = () => {
    if (!text.trim() || submitted) return;
    socket.emit('submit-statement', { roomCode, playerId: myPlayerId, content: text.trim() });
    setSubmitted(true);
  };

  return (
    <div style={styles.container}>
      <div style={styles.phaseLabel}>
        {isProsecution ? '検察官 最終弁論' : '弁護人 最終弁論'}
        <span style={{ marginLeft: 12, color: timer <= 10 ? 'var(--timer-warn)' : 'var(--text-accent)' }}>
          {timer}秒
        </span>
      </div>

      {isMyTurn && !submitted ? (
        <div style={styles.inputArea}>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>
            陪審員への最後の訴えかけです。感情屋・流され屋・退屈な人が大きく動く可能性があります。
          </p>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="最終弁論を入力..."
            style={styles.textarea}
            maxLength={800}
          />
          <button
            className={isProsecution ? 'btn-prosecution' : 'btn-defense'}
            onClick={handleSubmit}
            style={{ width: '100%', padding: 14, fontSize: 16 }}
          >
            最終弁論を行う
          </button>
        </div>
      ) : isMyTurn && submitted ? (
        <div style={styles.waiting}>弁論を送信しました。陪審員の最終反応を待っています...</div>
      ) : (
        <div style={styles.waiting}>
          {isProsecution ? '検察官' : '弁護人'}の最終弁論を待っています...
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: 20,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 16,
    height: '100%',
  },
  phaseLabel: {
    fontSize: 20,
    fontWeight: 900,
    textAlign: 'center' as const,
  },
  inputArea: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 12,
    flex: 1,
  },
  textarea: {
    flex: 1,
    minHeight: 150,
    fontSize: 14,
    lineHeight: 1.6,
    padding: 14,
  },
  waiting: {
    textAlign: 'center' as const,
    color: 'var(--text-secondary)',
    padding: 40,
    fontSize: 16,
  },
};
