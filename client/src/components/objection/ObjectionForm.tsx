import { useState, useEffect } from 'react';
import { socket } from '../../socket';
import { useGameStore } from '../../stores/gameStore';

export function ObjectionForm({ onClose }: { onClose: () => void }) {
  const [type, setType] = useState('矛盾');
  const [reason, setReason] = useState('');
  const [timer, setTimerState] = useState(15);
  const roomCode = useGameStore(s => s.roomCode);
  const myPlayerId = useGameStore(s => s.myPlayerId);
  const chatMessages = useGameStore(s => s.chatMessages);

  // Last opponent message as target
  const lastMessage = chatMessages[chatMessages.length - 1]?.content || '';

  useEffect(() => {
    const interval = setInterval(() => {
      setTimerState(t => {
        if (t <= 1) {
          clearInterval(interval);
          handleSubmit();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = () => {
    socket.emit('submit-objection', {
      roomCode,
      playerId: myPlayerId,
      type,
      reason: reason.trim() || type,
      targetContent: lastMessage,
    });
    onClose();
  };

  const types = ['矛盾', '関係なし', '誘導尋問', '根拠なし', 'その他'];

  return (
    <div style={styles.modal}>
      <div style={styles.content}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ color: 'var(--objection-red)', fontWeight: 900 }}>異議の理由</h3>
          <span style={{
            fontSize: 24,
            fontWeight: 900,
            color: timer <= 5 ? 'var(--timer-warn)' : 'var(--text-accent)',
          }}>{timer}秒</span>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const, marginTop: 12 }}>
          {types.map(t => (
            <button
              key={t}
              onClick={() => setType(t)}
              style={{
                ...styles.typeBtn,
                background: type === t ? 'var(--objection-red)' : 'var(--bg-card)',
                color: type === t ? 'white' : 'var(--text-primary)',
              }}
            >
              {t}
            </button>
          ))}
        </div>

        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="異議の理由を具体的に..."
          style={{ width: '100%', minHeight: 60, marginTop: 12, fontSize: 14, padding: 10 }}
          maxLength={200}
        />

        <button className="btn-objection" onClick={handleSubmit} style={{ width: '100%', marginTop: 12 }}>
          異議を申し立てる！
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  modal: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.8)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 200,
  },
  content: {
    background: 'var(--bg-surface)',
    borderRadius: 12,
    padding: 24,
    width: 400,
    maxWidth: '90vw',
    border: '2px solid var(--objection-red)',
  },
  typeBtn: {
    padding: '8px 14px',
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 600,
  },
};
