import { useState } from 'react';
import { socket } from '../../socket';
import { useGameStore } from '../../stores/gameStore';
import { useTimer } from '../../hooks/useTimer';

export function OpeningStatement() {
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const phase = useGameStore(s => s.phase);
  const myRole = useGameStore(s => s.myRole);
  const roomCode = useGameStore(s => s.roomCode);
  const myPlayerId = useGameStore(s => s.myPlayerId);
  const caseInfo = useGameStore(s => s.caseInfo);
  const timer = useTimer();

  const isProsecution = phase === 'opening_prosecution';
  const isMyTurn = (isProsecution && myRole === 'prosecution') || (!isProsecution && myRole === 'defense');
  const choices = caseInfo?.openings || [];

  const handleSubmit = () => {
    if (!selected || submitted) return;
    socket.emit('select-statement', { roomCode, playerId: myPlayerId, choiceId: selected });
    setSubmitted(true);
  };

  return (
    <div style={styles.container}>
      <div style={styles.caseInfo}>
        <h3 style={{ color: 'var(--text-accent)', marginBottom: 6 }}>{caseInfo?.case_title}</h3>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{caseInfo?.summary}</p>
        <div style={{ marginTop: 6, fontSize: 13 }}>
          <strong>被告：</strong>{caseInfo?.defendant.name}（{caseInfo?.defendant.occupation}、{caseInfo?.defendant.age}歳）
        </div>
      </div>

      <div style={styles.phaseLabel}>
        {isProsecution ? '検察官 冒頭陳述' : '弁護人 冒頭陳述'}
        <span style={{ marginLeft: 12, color: timer <= 10 ? 'var(--timer-warn)' : 'var(--text-accent)', fontFamily: 'monospace' }}>
          {timer}秒
        </span>
      </div>

      {isMyTurn && !submitted ? (
        <div style={styles.choices}>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>
            冒頭陳述を選んでください（インパクトが異なります）
          </p>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: c.impact === 'strong' ? '#e74c3c' : c.impact === 'medium' ? '#f39c12' : '#95a5a6',
                }}>
                  {c.impact === 'strong' ? '攻撃的' : c.impact === 'medium' ? 'バランス型' : '慎重'}
                </span>
              </div>
              <div style={{ fontSize: 14 }}>「{c.text}」</div>
            </div>
          ))}
          <button
            className={isProsecution ? 'btn-prosecution' : 'btn-defense'}
            onClick={handleSubmit}
            disabled={!selected}
            style={{ width: '100%', padding: 14, fontSize: 16, marginTop: 8 }}
          >
            この陳述で行く！
          </button>
        </div>
      ) : isMyTurn && submitted ? (
        <div style={styles.waiting}>陳述を送信しました。陪審員の反応を待っています...</div>
      ) : (
        <div style={styles.waiting}>
          {isProsecution ? '検察官' : '弁護人'}が冒頭陳述を選んでいます...
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { padding: 16, display: 'flex', flexDirection: 'column' as const, gap: 12, height: '100%', overflow: 'auto' },
  caseInfo: { background: 'var(--bg-card)', padding: 14, borderRadius: 8, border: '1px solid var(--border)' },
  phaseLabel: { fontSize: 18, fontWeight: 900, textAlign: 'center' as const },
  choices: { display: 'flex', flexDirection: 'column' as const, gap: 8, flex: 1 },
  choiceCard: { padding: '12px 14px', borderRadius: 8, border: '2px solid', cursor: 'pointer', transition: 'all 0.2s' },
  waiting: { textAlign: 'center' as const, color: 'var(--text-secondary)', padding: 40, fontSize: 16 },
};
