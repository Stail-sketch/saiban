import { useState } from 'react';
import { socket } from '../../socket';
import { useGameStore } from '../../stores/gameStore';

export function LobbyScreen() {
  const [name, setName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [mode, setMode] = useState<'menu' | 'create' | 'join'>('menu');
  const roomCode = useGameStore(s => s.roomCode);
  const players = useGameStore(s => s.players);
  const myPlayerId = useGameStore(s => s.myPlayerId);
  const myRole = useGameStore(s => s.myRole);

  const handleCreate = () => {
    if (!name.trim()) return;
    socket.emit('create-room', { name: name.trim() });
  };

  const handleJoin = () => {
    if (!name.trim() || !joinCode.trim()) return;
    socket.emit('join-room', { code: joinCode.trim().toUpperCase(), name: name.trim() });
  };

  const handleSelectRole = (role: string) => {
    socket.emit('select-role', { roomCode, playerId: myPlayerId, role });
  };

  const handleStart = () => {
    socket.emit('start-game', { roomCode });
  };

  // In room view
  if (roomCode) {
    const hasProsecution = players.some(p => p.role === 'prosecution');
    const hasDefense = players.some(p => p.role === 'defense');
    const canStart = hasProsecution && hasDefense;
    const isHost = players[0]?.id === myPlayerId;

    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.title}>異議アリ！</h1>
          <div style={styles.roomInfo}>
            <span style={styles.label}>部屋コード</span>
            <span style={styles.code}>{roomCode}</span>
          </div>

          <div style={styles.roleSelect}>
            <h3 style={{ marginBottom: 12 }}>役割を選択</h3>
            <div style={styles.roleButtons}>
              <button
                className={myRole === 'prosecution' ? 'btn-prosecution' : 'btn-primary'}
                onClick={() => handleSelectRole('prosecution')}
                disabled={hasProsecution && myRole !== 'prosecution'}
                style={styles.roleBtn}
              >
                検察官
                {hasProsecution && myRole !== 'prosecution' && ' (選択済)'}
              </button>
              <button
                className={myRole === 'defense' ? 'btn-defense' : 'btn-primary'}
                onClick={() => handleSelectRole('defense')}
                disabled={hasDefense && myRole !== 'defense'}
                style={styles.roleBtn}
              >
                弁護人
                {hasDefense && myRole !== 'defense' && ' (選択済)'}
              </button>
            </div>
          </div>

          <div style={styles.playerList}>
            <h3 style={{ marginBottom: 8 }}>参加者</h3>
            {players.map(p => (
              <div key={p.id} style={styles.playerItem}>
                <span>{p.name}</span>
                <span style={{
                  color: p.role === 'prosecution' ? 'var(--prosecution)'
                       : p.role === 'defense' ? 'var(--defense)'
                       : 'var(--text-secondary)',
                  fontWeight: 600,
                }}>
                  {p.role === 'prosecution' ? '検察官'
                   : p.role === 'defense' ? '弁護人'
                   : '観戦'}
                </span>
              </div>
            ))}
          </div>

          {isHost && (
            <button
              className="btn-primary"
              onClick={handleStart}
              disabled={!canStart}
              style={{ width: '100%', marginTop: 16, padding: '14px', fontSize: 18, fontWeight: 900 }}
            >
              開廷！
            </button>
          )}
          {!canStart && <p style={styles.hint}>検察官と弁護人が揃うと開始できます</p>}
        </div>
      </div>
    );
  }

  // Menu view
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>異議アリ！</h1>
        <p style={styles.subtitle}>ブラウザ対戦型法廷バトルゲーム</p>

        {mode === 'menu' && (
          <div style={styles.menuButtons}>
            <button className="btn-primary" onClick={() => setMode('create')} style={styles.menuBtn}>
              部屋を作成
            </button>
            <button className="btn-primary" onClick={() => setMode('join')} style={styles.menuBtn}>
              部屋に参加
            </button>
          </div>
        )}

        {mode === 'create' && (
          <div style={styles.form}>
            <input
              type="text"
              placeholder="あなたの名前"
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={12}
              style={styles.input}
            />
            <button className="btn-primary" onClick={handleCreate} style={styles.menuBtn}>
              作成する
            </button>
            <button onClick={() => setMode('menu')} style={styles.backBtn}>戻る</button>
          </div>
        )}

        {mode === 'join' && (
          <div style={styles.form}>
            <input
              type="text"
              placeholder="あなたの名前"
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={12}
              style={styles.input}
            />
            <input
              type="text"
              placeholder="部屋コード (6文字)"
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase())}
              maxLength={6}
              style={{ ...styles.input, letterSpacing: 4, textAlign: 'center' as const, fontSize: 20 }}
            />
            <button className="btn-primary" onClick={handleJoin} style={styles.menuBtn}>
              参加する
            </button>
            <button onClick={() => setMode('menu')} style={styles.backBtn}>戻る</button>
          </div>
        )}
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
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
  },
  card: {
    background: 'var(--bg-surface)',
    borderRadius: 16,
    padding: '40px 36px',
    width: 420,
    maxWidth: '90vw',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    border: '1px solid var(--border)',
  },
  title: {
    fontSize: 36,
    fontWeight: 900,
    textAlign: 'center' as const,
    color: 'var(--text-accent)',
    letterSpacing: 4,
    marginBottom: 4,
  },
  subtitle: {
    textAlign: 'center' as const,
    color: 'var(--text-secondary)',
    marginBottom: 28,
    fontSize: 14,
  },
  menuButtons: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 12,
  },
  menuBtn: {
    width: '100%',
    padding: '14px',
    fontSize: 16,
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 12,
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    fontSize: 16,
  },
  backBtn: {
    background: 'transparent',
    color: 'var(--text-secondary)',
    padding: '8px',
  },
  roomInfo: {
    textAlign: 'center' as const,
    marginBottom: 20,
  },
  label: {
    display: 'block',
    color: 'var(--text-secondary)',
    fontSize: 12,
    marginBottom: 4,
  },
  code: {
    fontSize: 32,
    fontWeight: 900,
    letterSpacing: 6,
    color: 'var(--text-accent)',
  },
  roleSelect: {
    marginBottom: 20,
  },
  roleButtons: {
    display: 'flex',
    gap: 12,
  },
  roleBtn: {
    flex: 1,
    padding: '12px',
    fontSize: 16,
  },
  playerList: {
    borderTop: '1px solid var(--border)',
    paddingTop: 16,
  },
  playerItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: '1px solid var(--border)',
  },
  hint: {
    textAlign: 'center' as const,
    color: 'var(--text-secondary)',
    fontSize: 12,
    marginTop: 8,
  },
};
