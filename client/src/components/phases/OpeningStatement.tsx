import { useState } from 'react';
import { socket } from '../../socket';
import { useGameStore } from '../../stores/gameStore';
import { useTimer } from '../../hooks/useTimer';

export function OpeningStatement() {
  const [text, setText] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const phase = useGameStore(s => s.phase);
  const myRole = useGameStore(s => s.myRole);
  const roomCode = useGameStore(s => s.roomCode);
  const myPlayerId = useGameStore(s => s.myPlayerId);
  const caseInfo = useGameStore(s => s.caseInfo);
  const timer = useTimer();

  const isProsecution = phase === 'opening_prosecution';
  const isMyTurn = (isProsecution && myRole === 'prosecution') || (!isProsecution && myRole === 'defense');

  const handleSubmit = () => {
    if (!text.trim() || submitted) return;
    socket.emit('submit-statement', { roomCode, playerId: myPlayerId, content: text.trim() });
    setSubmitted(true);
  };

  return (
    <div style={styles.container}>
      <div style={styles.caseInfo}>
        <h3 style={{ color: 'var(--text-accent)', marginBottom: 8 }}>
          {caseInfo?.case_title}
        </h3>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{caseInfo?.summary}</p>
        <div style={{ marginTop: 8, fontSize: 13 }}>
          <div><strong>被告：</strong>{caseInfo?.defendant.name}（{caseInfo?.defendant.occupation}、{caseInfo?.defendant.age}歳）</div>
          <div style={{ marginTop: 4 }}>{caseInfo?.defendant.background}</div>
        </div>
      </div>

      <div style={styles.phaseLabel}>
        {isProsecution ? '検察官 冒頭陳述' : '弁護人 冒頭陳述'}
        <span style={{ marginLeft: 12, color: timer <= 10 ? 'var(--timer-warn)' : 'var(--text-accent)' }}>
          {timer}秒
        </span>
      </div>

      {isMyTurn && !submitted ? (
        <div style={styles.inputArea}>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={isProsecution
              ? `検察の主張：${caseInfo?.prosecution_theory || ''}`
              : `弁護の主張：${caseInfo?.defense_theory || ''}`}
            style={styles.textarea}
            maxLength={500}
          />
          <button className={isProsecution ? 'btn-prosecution' : 'btn-defense'} onClick={handleSubmit} style={{ width: '100%', padding: 14 }}>
            冒頭陳述を行う
          </button>
        </div>
      ) : isMyTurn && submitted ? (
        <div style={styles.waiting}>陳述を送信しました。陪審員の反応を待っています...</div>
      ) : (
        <div style={styles.waiting}>
          {isProsecution ? '検察官' : '弁護人'}の冒頭陳述を待っています...
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
  caseInfo: {
    background: 'var(--bg-card)',
    padding: 16,
    borderRadius: 8,
    border: '1px solid var(--border)',
  },
  phaseLabel: {
    fontSize: 18,
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
    minHeight: 120,
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
