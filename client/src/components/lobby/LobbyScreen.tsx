import { useState } from 'react';
import { socket } from '../../socket';
import { useGameStore } from '../../stores/gameStore';

export function LobbyScreen() {
  const [name, setName] = useState('');
  const roomCode = useGameStore(s => s.roomCode);

  const handleStart = () => {
    if (!name.trim()) return;
    useGameStore.getState().setPlayerName(name.trim());
    socket.emit('create-room', { name: name.trim() });
    // Auto-start after room is created
    const unsub = useGameStore.subscribe((state) => {
      if (state.roomCode && state.roomCode !== '') {
        socket.emit('start-game', { roomCode: state.roomCode });
        unsub();
      }
    });
  };

  if (roomCode) {
    return (
      <div style={s.bg}>
        <div style={s.card}>
          <div style={s.logoArea}>
            <div style={{ fontSize: 48 }}>&#x2696;</div>
            <h1 style={s.title}>AI逆転裁判</h1>
            <p style={s.subtitle}>事件を生成中...</p>
          </div>
          <div className="spinner" style={{ margin: '20px auto' }} />
        </div>
      </div>
    );
  }

  return (
    <div style={s.bg}>
      <div style={s.card}>
        <div style={s.logoArea}>
          <div style={{ fontSize: 56, marginBottom: 8 }}>&#x2696;</div>
          <h1 style={s.title}>AI逆転裁判</h1>
          <p style={s.subtitle}>AIが生成する事件を、弁護士として解け</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12, marginTop: 24 }}>
          <input
            type="text"
            placeholder="弁護士の名前を入力"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleStart()}
            maxLength={12}
            style={{ padding: 14, fontSize: 16, textAlign: 'center' }}
          />
          <button className="btn-objection" onClick={handleStart} disabled={!name.trim()}
            style={{ width: '100%', padding: 16, fontSize: 20 }}>
            事件に挑む
          </button>
        </div>

        <div style={s.features}>
          <div style={s.feature}>&#x1F50D; AIが毎回ユニークな事件を生成</div>
          <div style={s.feature}>&#x1F4AC; 証人をゆさぶり、矛盾を暴け</div>
          <div style={s.feature}>&#x2757; 「異議あり！」で証拠をつきつけろ</div>
        </div>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  bg: {
    display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%',
    background: 'radial-gradient(ellipse at center, #1a1028 0%, #0a0a12 70%)',
  },
  card: {
    background: 'linear-gradient(180deg, #16142a 0%, #0e0e1a 100%)',
    borderRadius: 16, padding: '40px 32px', width: 460, maxWidth: '92vw',
    boxShadow: '0 0 60px rgba(255, 215, 0, 0.05), 0 8px 32px rgba(0,0,0,0.6)',
    border: '1px solid var(--border-gold)',
  },
  logoArea: { textAlign: 'center' as const },
  title: {
    fontFamily: 'var(--font-display)', fontSize: 36, color: 'var(--text-accent)',
    letterSpacing: 4, textShadow: '0 0 30px rgba(255, 215, 0, 0.3)',
  },
  subtitle: { color: 'var(--text-secondary)', fontSize: 13, letterSpacing: 1, marginTop: 6 },
  features: { marginTop: 24, display: 'flex', flexDirection: 'column' as const, gap: 8 },
  feature: {
    fontSize: 13, color: 'var(--text-secondary)', padding: '8px 12px',
    background: 'rgba(255,255,255,0.02)', borderRadius: 6,
  },
};
