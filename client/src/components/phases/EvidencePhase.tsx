import { socket } from '../../socket';
import { useGameStore } from '../../stores/gameStore';
import type { Evidence } from '../../types/game';

export function EvidenceSubmitModal({ onClose }: { onClose: () => void }) {
  const myEvidence = useGameStore(s => s.myEvidence);
  const publicEvidence = useGameStore(s => s.publicEvidence);
  const roomCode = useGameStore(s => s.roomCode);
  const myPlayerId = useGameStore(s => s.myPlayerId);

  const available = myEvidence.filter(e => !publicEvidence.find(pe => pe.id === e.id));

  const handleSubmit = (ev: Evidence) => {
    socket.emit('submit-evidence', { roomCode, playerId: myPlayerId, evidenceId: ev.id });
    onClose();
  };

  return (
    <div style={styles.modal}>
      <div style={styles.modalContent}>
        <h3 style={{ color: 'var(--text-accent)', marginBottom: 12 }}>証拠を選択</h3>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10 }}>
          ニセモノ証拠も出せる！ただし「偽証」で見抜かれると大ダメージ...
        </p>
        {available.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>提出可能な証拠がありません</p>}
        {available.map(ev => (
          <div key={ev.id} style={styles.evCard} onClick={() => handleSubmit(ev)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: 14 }}>[{ev.id}] {ev.name}</span>
              {ev.fake && <span style={styles.fakeTag}>ニセモノ</span>}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{ev.type} / {ev.strength}</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>{ev.description}</div>
            {ev.fake && ev.fakeReason && (
              <div style={{ fontSize: 11, color: 'var(--timer-warn)', marginTop: 4 }}>
                ※偽の理由: {ev.fakeReason}
              </div>
            )}
          </div>
        ))}
        <button onClick={onClose} style={styles.cancelBtn}>キャンセル</button>
      </div>
    </div>
  );
}

export function WitnessSummonModal({ onClose }: { onClose: () => void }) {
  const caseInfo = useGameStore(s => s.caseInfo);
  const roomCode = useGameStore(s => s.roomCode);
  const myPlayerId = useGameStore(s => s.myPlayerId);

  const handleSummon = (index: number) => {
    socket.emit('summon-witness', { roomCode, playerId: myPlayerId, witnessIndex: index });
    onClose();
  };

  return (
    <div style={styles.modal}>
      <div style={styles.modalContent}>
        <h3 style={{ color: 'var(--text-accent)', marginBottom: 12 }}>証人を招致</h3>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10 }}>
          証言を聞き、矛盾を見つけて証拠で崩せ！
        </p>
        {caseInfo?.witnesses.map((w, i) => (
          <div key={i} style={styles.evCard} onClick={() => handleSummon(i)}>
            <div style={{ fontWeight: 700 }}>{w.name}</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{w.occupation} / {w.relation}</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{w.personality}</div>
          </div>
        ))}
        <button onClick={onClose} style={styles.cancelBtn}>キャンセル</button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  modal: {
    position: 'fixed' as const, top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center',
    alignItems: 'center', zIndex: 100,
  },
  modalContent: {
    background: 'var(--bg-surface)', borderRadius: 12, padding: 24,
    width: 400, maxWidth: '90vw', maxHeight: '80vh', overflowY: 'auto' as const,
    border: '1px solid var(--border)',
  },
  evCard: {
    background: 'var(--bg-card)', padding: '12px', borderRadius: 8,
    marginBottom: 8, cursor: 'pointer', border: '1px solid var(--border)',
    transition: 'border-color 0.2s',
  },
  fakeTag: {
    fontSize: 10, padding: '2px 8px', borderRadius: 4,
    background: 'var(--timer-warn)', color: 'white', fontWeight: 700,
  },
  cancelBtn: {
    marginTop: 12, background: 'var(--border)', color: 'var(--text-primary)',
    width: '100%', padding: 10, borderRadius: 8,
  },
};
