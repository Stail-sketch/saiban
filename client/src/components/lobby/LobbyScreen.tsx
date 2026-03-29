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

  const handleCreate = () => { if (name.trim()) socket.emit('create-room', { name: name.trim() }); };
  const handleJoin = () => { if (name.trim() && joinCode.trim()) socket.emit('join-room', { code: joinCode.trim().toUpperCase(), name: name.trim() }); };
  const handleSelectRole = (role: string) => socket.emit('select-role', { roomCode, playerId: myPlayerId, role });
  const handleStart = () => socket.emit('start-game', { roomCode });

  if (roomCode) {
    const hasProsecution = players.some(p => p.role === 'prosecution');
    const hasDefense = players.some(p => p.role === 'defense');
    const canStart = hasProsecution && hasDefense;
    const isHost = players[0]?.id === myPlayerId;

    return (
      <div style={s.bg}>
        <div style={s.card}>
          <div style={s.logoArea}>
            <div style={s.gavel}>&#x2696;</div>
            <h1 style={s.title}>異議アリ！</h1>
          </div>
          <div style={s.codeBox}>
            <span style={s.codeLabel}>ROOM CODE</span>
            <span style={s.codeValue}>{roomCode}</span>
          </div>

          <div style={{ marginBottom: 20 }}>
            <p style={s.sectionTitle}>役割を選択</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className={myRole === 'prosecution' ? 'btn-prosecution' : 'btn-primary'}
                onClick={() => handleSelectRole('prosecution')}
                disabled={hasProsecution && myRole !== 'prosecution'}
                style={{ flex: 1, padding: 14, fontSize: 16 }}>
                &#x1F525; 検察官
              </button>
              <button className={myRole === 'defense' ? 'btn-defense' : 'btn-primary'}
                onClick={() => handleSelectRole('defense')}
                disabled={hasDefense && myRole !== 'defense'}
                style={{ flex: 1, padding: 14, fontSize: 16 }}>
                &#x1F6E1; 弁護人
              </button>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <p style={s.sectionTitle}>参加者</p>
            {players.map(p => (
              <div key={p.id} style={s.playerRow}>
                <span style={{ fontWeight: 700 }}>{p.name}</span>
                <span style={{
                  fontWeight: 900, fontSize: 13,
                  color: p.role === 'prosecution' ? 'var(--prosecution)' : p.role === 'defense' ? 'var(--defense)' : 'var(--text-secondary)',
                }}>
                  {p.role === 'prosecution' ? '検察官' : p.role === 'defense' ? '弁護人' : '未選択'}
                </span>
              </div>
            ))}
          </div>

          {isHost && (
            <button className="btn-objection" onClick={handleStart} disabled={!canStart}
              style={{ width: '100%', padding: 16, fontSize: 22 }}>
              開　廷　！
            </button>
          )}
          {!canStart && <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: 12, marginTop: 8 }}>検察官と弁護人が揃うと開廷できます</p>}
        </div>
      </div>
    );
  }

  return (
    <div style={s.bg}>
      <div style={s.card}>
        <div style={s.logoArea}>
          <div style={s.gavel}>&#x2696;</div>
          <h1 style={s.title}>異議アリ！</h1>
          <p style={s.subtitle}>OBJECTION! — Court Battle Game</p>
        </div>

        {mode === 'menu' && (
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
            <button className="btn-prosecution" onClick={() => setMode('create')} style={s.bigBtn}>
              部屋を作成する
            </button>
            <button className="btn-defense" onClick={() => setMode('join')} style={s.bigBtn}>
              部屋に参加する
            </button>
          </div>
        )}

        {mode === 'create' && (
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
            <input type="text" placeholder="あなたの名前" value={name} onChange={e => setName(e.target.value)}
              maxLength={12} style={{ padding: 14, fontSize: 16, textAlign: 'center' }} />
            <button className="btn-prosecution" onClick={handleCreate} style={s.bigBtn}>作成する</button>
            <button onClick={() => setMode('menu')} style={s.backBtn}>&#x2190; 戻る</button>
          </div>
        )}

        {mode === 'join' && (
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
            <input type="text" placeholder="あなたの名前" value={name} onChange={e => setName(e.target.value)}
              maxLength={12} style={{ padding: 14, fontSize: 16, textAlign: 'center' }} />
            <input type="text" placeholder="部屋コード" value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase())} maxLength={6}
              style={{ padding: 14, fontSize: 24, textAlign: 'center', letterSpacing: 8, fontFamily: 'var(--font-display)' }} />
            <button className="btn-defense" onClick={handleJoin} style={s.bigBtn}>参加する</button>
            <button onClick={() => setMode('menu')} style={s.backBtn}>&#x2190; 戻る</button>
          </div>
        )}
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
    borderRadius: 16, padding: '36px 32px', width: 440, maxWidth: '92vw',
    boxShadow: '0 0 60px rgba(255, 215, 0, 0.05), 0 8px 32px rgba(0,0,0,0.6)',
    border: '1px solid var(--border-gold)',
  },
  logoArea: { textAlign: 'center' as const, marginBottom: 28 },
  gavel: { fontSize: 48, marginBottom: 4 },
  title: {
    fontFamily: 'var(--font-display)', fontSize: 38, color: 'var(--text-accent)',
    letterSpacing: 6, textShadow: '0 0 30px rgba(255, 215, 0, 0.3)',
  },
  subtitle: { color: 'var(--text-secondary)', fontSize: 12, letterSpacing: 2, marginTop: 4 },
  bigBtn: { width: '100%', padding: 16, fontSize: 18 },
  backBtn: { background: 'transparent', color: 'var(--text-secondary)', padding: 8, fontSize: 14 },
  codeBox: { textAlign: 'center' as const, marginBottom: 24, padding: '16px', background: 'var(--bg-card)', borderRadius: 10, border: '1px solid var(--border-gold)' },
  codeLabel: { display: 'block', fontSize: 11, color: 'var(--text-secondary)', letterSpacing: 3, marginBottom: 4 },
  codeValue: { fontFamily: 'var(--font-display)', fontSize: 36, color: 'var(--text-accent)', letterSpacing: 8, textShadow: '0 0 20px rgba(255,215,0,0.3)' },
  sectionTitle: { fontSize: 13, fontWeight: 900, color: 'var(--text-accent)', marginBottom: 8, letterSpacing: 1 },
  playerRow: { display: 'flex', justifyContent: 'space-between', padding: '10px 12px', borderBottom: '1px solid var(--border)', fontSize: 14 },
};
