import { socket } from '../../socket';
import { useGameStore } from '../../stores/gameStore';

interface Props {
  onAction: (action: string) => void;
}

export function ActionBar({ onAction }: Props) {
  const phase = useGameStore(s => s.phase);
  const myRole = useGameStore(s => s.myRole);
  const currentTurn = useGameStore(s => s.currentTurn);
  const roomCode = useGameStore(s => s.roomCode);
  const myPlayerId = useGameStore(s => s.myPlayerId);
  const objectionsRemaining = useGameStore(s => s.objectionsRemaining);
  const caseInfo = useGameStore(s => s.caseInfo);

  const isMyTurn = currentTurn === myRole;
  const canAct = phase === 'evidence' && isMyTurn;
  const canObject = phase === 'evidence' && !isMyTurn
    && myRole !== 'spectator'
    && objectionsRemaining[myRole as 'prosecution' | 'defense'] > 0;

  const handleEndTurn = () => {
    socket.emit('end-turn', { roomCode, playerId: myPlayerId });
  };

  const handleObjection = () => {
    socket.emit('raise-objection', { roomCode, playerId: myPlayerId });
    onAction('objection');
  };

  return (
    <div style={styles.bar}>
      {canAct && (
        <>
          <button className="btn-primary" onClick={() => onAction('evidence')} style={styles.btn}>
            証拠提出
          </button>
          {(caseInfo?.witnesses?.length ?? 0) > 0 && (
            <button className="btn-primary" onClick={() => onAction('witness')} style={styles.btn}>
              証人招致
            </button>
          )}
          <button onClick={handleEndTurn} style={{ ...styles.btn, background: 'var(--border)' }}>
            ターン終了
          </button>
        </>
      )}
      {canObject && (
        <button className="btn-objection" onClick={handleObjection}>
          異議アリ！ ({objectionsRemaining[myRole as 'prosecution' | 'defense']})
        </button>
      )}
      {!canAct && !canObject && phase === 'evidence' && (
        <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
          {isMyTurn ? '行動を選択してください' : '相手のターンです...'}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  bar: {
    display: 'flex', gap: 10, padding: '10px',
    background: 'var(--bg-secondary)', borderRadius: 8,
    alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' as const,
  },
  btn: { fontSize: 13, padding: '10px 16px' },
};
