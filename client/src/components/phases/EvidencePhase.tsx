import { useState } from 'react';
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
        {available.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>提出可能な証拠がありません</p>}
        {available.map(ev => (
          <div key={ev.id} style={styles.evCard} onClick={() => handleSubmit(ev)}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>[{ev.id}] {ev.name}</div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{ev.type} / {ev.strength}</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>{ev.description}</div>
          </div>
        ))}
        <button onClick={onClose} style={{ marginTop: 12, background: 'var(--border)', color: 'var(--text-primary)', width: '100%', padding: 10 }}>
          キャンセル
        </button>
      </div>
    </div>
  );
}

export function WitnessSummonModal({ onClose }: { onClose: () => void }) {
  const caseInfo = useGameStore(s => s.caseInfo);
  const roomCode = useGameStore(s => s.roomCode);
  const myPlayerId = useGameStore(s => s.myPlayerId);

  const handleSummon = (name: string) => {
    socket.emit('summon-witness', { roomCode, playerId: myPlayerId, witnessName: name });
    onClose();
  };

  return (
    <div style={styles.modal}>
      <div style={styles.modalContent}>
        <h3 style={{ color: 'var(--text-accent)', marginBottom: 12 }}>証人を選択</h3>
        {caseInfo?.witnesses.map(w => (
          <div key={w.name} style={styles.evCard} onClick={() => handleSummon(w.name)}>
            <div style={{ fontWeight: 700 }}>{w.name}</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{w.occupation} / {w.relation}</div>
          </div>
        ))}
        <button onClick={onClose} style={{ marginTop: 12, background: 'var(--border)', color: 'var(--text-primary)', width: '100%', padding: 10 }}>
          キャンセル
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
    width: 400,
    maxWidth: '90vw',
    maxHeight: '80vh',
    overflowY: 'auto' as const,
    border: '1px solid var(--border)',
  },
  evCard: {
    background: 'var(--bg-card)',
    padding: '12px',
    borderRadius: 8,
    marginBottom: 8,
    cursor: 'pointer',
    border: '1px solid var(--border)',
    transition: 'border-color 0.2s',
  },
};
