import { useState, useRef, useEffect } from 'react';
import { socket } from '../../socket';
import { useGameStore } from '../../stores/gameStore';

export function WitnessExam() {
  const [question, setQuestion] = useState('');
  const witnessOnStand = useGameStore(s => s.witnessOnStand);
  const witnessChat = useGameStore(s => s.witnessChat);
  const roomCode = useGameStore(s => s.roomCode);
  const myPlayerId = useGameStore(s => s.myPlayerId);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [witnessChat.length]);

  if (!witnessOnStand) return null;

  const handleAsk = () => {
    if (!question.trim()) return;
    socket.emit('ask-witness', { roomCode, playerId: myPlayerId, question: question.trim() });
    setQuestion('');
  };

  const handleDismiss = () => {
    socket.emit('dismiss-witness', { roomCode });
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={{ fontWeight: 900, color: 'var(--text-accent)' }}>
          証人尋問：{witnessOnStand.name}
        </span>
        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
          {witnessOnStand.occupation}
        </span>
      </div>

      <div style={styles.testimony}>
        「{witnessOnStand.testimony}」
      </div>

      <div style={styles.chatArea}>
        {witnessChat.map((entry, i) => (
          <div key={i} className="fade-in" style={{
            ...styles.chatBubble,
            alignSelf: entry.role === 'witness' ? 'flex-start' : 'flex-end',
            background: entry.role === 'witness' ? 'var(--bg-card)' : 'var(--button-primary)',
          }}>
            <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
              {entry.role === 'witness' ? witnessOnStand.name : '質問'}
            </span>
            <div>{entry.content}</div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div style={styles.inputRow}>
        <input
          type="text"
          value={question}
          onChange={e => setQuestion(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAsk()}
          placeholder="証人への質問..."
          style={{ flex: 1 }}
        />
        <button className="btn-primary" onClick={handleAsk} style={{ padding: '10px 20px' }}>
          質問
        </button>
        <button onClick={handleDismiss} style={{ background: 'var(--border)', color: 'var(--text-primary)', padding: '10px 16px' }}>
          終了
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100%',
    background: 'var(--bg-secondary)',
    borderRadius: 8,
    overflow: 'hidden',
  },
  header: {
    padding: '10px 14px',
    borderBottom: '1px solid var(--border)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  testimony: {
    padding: '10px 14px',
    fontSize: 13,
    fontStyle: 'italic' as const,
    color: 'var(--text-secondary)',
    borderBottom: '1px solid var(--border)',
  },
  chatArea: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: 12,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 8,
  },
  chatBubble: {
    padding: '8px 12px',
    borderRadius: 8,
    maxWidth: '80%',
    fontSize: 14,
  },
  inputRow: {
    display: 'flex',
    gap: 8,
    padding: 10,
    borderTop: '1px solid var(--border)',
  },
};
