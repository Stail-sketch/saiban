import { useState } from 'react';
import { socket } from '../../socket';
import { useGameStore } from '../../stores/gameStore';
import { JurorPanel } from '../jurors/JurorPanel';
import type { Evidence } from '../../types/game';

export function JurorPersuasionModal({ onClose }: { onClose: () => void }) {
  const [selectedJuror, setSelectedJuror] = useState<number | null>(null);
  const [selectedEvidence, setSelectedEvidence] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const publicEvidence = useGameStore(s => s.publicEvidence);
  const roomCode = useGameStore(s => s.roomCode);
  const myPlayerId = useGameStore(s => s.myPlayerId);

  const handleSubmit = () => {
    if (selectedJuror === null || !selectedEvidence || !reason.trim()) return;
    socket.emit('persuade-juror', {
      roomCode,
      playerId: myPlayerId,
      jurorIndex: selectedJuror,
      evidenceId: selectedEvidence,
      reason: reason.trim(),
    });
    onClose();
  };

  return (
    <div style={styles.modal}>
      <div style={styles.modalContent}>
        <h3 style={{ color: 'var(--text-accent)', marginBottom: 16 }}>陪審員を説得</h3>

        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 13, marginBottom: 8, fontWeight: 700 }}>1. 説得する陪審員を選択</p>
          <JurorPanel onJurorClick={setSelectedJuror} selectedJuror={selectedJuror} />
        </div>

        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 13, marginBottom: 8, fontWeight: 700 }}>2. 証拠を選択（公開済みのみ）</p>
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
            {publicEvidence.map(ev => (
              <div
                key={ev.id}
                onClick={() => setSelectedEvidence(ev.id)}
                style={{
                  padding: '8px 12px',
                  background: selectedEvidence === ev.id ? 'var(--button-primary)' : 'var(--bg-card)',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 13,
                  border: '1px solid var(--border)',
                }}
              >
                [{ev.id}] {ev.name} — {ev.description}
              </div>
            ))}
            {publicEvidence.length === 0 && (
              <p style={{ color: 'var(--text-secondary)', fontSize: 12 }}>公開済みの証拠がありません</p>
            )}
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 13, marginBottom: 8, fontWeight: 700 }}>3. 説得理由を入力</p>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="この証拠はXXXを示しており、あなたの懸念するYYYを解消します"
            style={{ width: '100%', minHeight: 80, fontSize: 14, padding: 10 }}
            maxLength={300}
          />
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="btn-primary"
            onClick={handleSubmit}
            disabled={selectedJuror === null || !selectedEvidence || !reason.trim()}
            style={{ flex: 1, padding: 12 }}
          >
            説得する
          </button>
          <button onClick={onClose} style={{ background: 'var(--border)', color: 'var(--text-primary)', padding: '12px 20px' }}>
            キャンセル
          </button>
        </div>
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
    background: 'rgba(0,0,0,0.7)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  modalContent: {
    background: 'var(--bg-surface)',
    borderRadius: 12,
    padding: 24,
    width: 500,
    maxWidth: '95vw',
    maxHeight: '90vh',
    overflowY: 'auto' as const,
    border: '1px solid var(--border)',
  },
};
