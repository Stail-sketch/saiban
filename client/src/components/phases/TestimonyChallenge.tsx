import { useState, useEffect } from 'react';
import { socket } from '../../socket';
import { useGameStore } from '../../stores/gameStore';
import { useTimer } from '../../hooks/useTimer';

export function TestimonyDisplay() {
  const statements = useGameStore(s => s.testimonyStatements);
  const witnessName = useGameStore(s => s.currentWitnessName);

  return (
    <div style={styles.container}>
      <div style={styles.witnessHeader}>
        <span style={styles.witnessIcon}>👤</span>
        <span style={styles.witnessName}>証人：{witnessName}</span>
      </div>
      <div style={styles.statementsArea}>
        {statements.map((st, i) => (
          <div key={i} className="slide-in-right" style={{
            ...styles.statementBubble,
            animationDelay: `${i * 0.2}s`,
          }}>
            <span style={styles.stNum}>{i + 1}.</span>
            <span>「{st.text}」</span>
          </div>
        ))}
        {statements.length === 0 && (
          <div style={styles.waiting}>証人が証言を始めます...</div>
        )}
      </div>
    </div>
  );
}

export function TestimonyChallengeUI() {
  const [selectedStatement, setSelectedStatement] = useState<number | null>(null);
  const [selectedEvidence, setSelectedEvidence] = useState<string | null>(null);
  const [mode, setMode] = useState<'select' | 'present'>('select');
  const [pressResponse, setPressResponse] = useState<string | null>(null);
  const statements = useGameStore(s => s.testimonyStatements);
  const witnessName = useGameStore(s => s.currentWitnessName);
  const myEvidence = useGameStore(s => s.myEvidence);
  const publicEvidence = useGameStore(s => s.publicEvidence);
  const roomCode = useGameStore(s => s.roomCode);
  const myPlayerId = useGameStore(s => s.myPlayerId);
  const timer = useTimer();

  // All available evidence (my + public)
  const allEvidence = [...myEvidence.filter(e => !publicEvidence.find(pe => pe.id === e.id)), ...publicEvidence];

  useEffect(() => {
    const handler = (data: { statementIndex: number; response: string; isContradiction: boolean }) => {
      setPressResponse(data.response);
      setTimeout(() => setPressResponse(null), 3000);
    };
    socket.on('testimony-press', handler);
    return () => { socket.off('testimony-press', handler); };
  }, []);

  useEffect(() => {
    const handler = (data: { success: boolean }) => {
      if (data.success) {
        setMode('select');
        setSelectedStatement(null);
        setSelectedEvidence(null);
      }
    };
    socket.on('testimony-break', handler);
    return () => { socket.off('testimony-break', handler); };
  }, []);

  const handlePress = () => {
    if (selectedStatement === null) return;
    socket.emit('press-statement', { roomCode, playerId: myPlayerId, statementIndex: selectedStatement });
  };

  const handlePresent = () => {
    if (selectedStatement === null || !selectedEvidence) return;
    socket.emit('present-evidence', {
      roomCode, playerId: myPlayerId,
      statementIndex: selectedStatement,
      evidenceId: selectedEvidence,
    });
  };

  const handleEndWitness = () => {
    socket.emit('end-witness', { roomCode });
  };

  return (
    <div style={styles.container}>
      <div style={styles.witnessHeader}>
        <span style={styles.witnessIcon}>👤</span>
        <span style={styles.witnessName}>証人：{witnessName}</span>
        <span style={{
          marginLeft: 'auto',
          fontFamily: 'monospace',
          fontWeight: 900,
          fontSize: 18,
          color: timer <= 10 ? 'var(--timer-warn)' : 'var(--text-accent)',
        }}>{timer}秒</span>
      </div>

      {pressResponse && (
        <div className="fade-in" style={styles.pressResponse}>
          {witnessName}：「{pressResponse}」
        </div>
      )}

      {/* Testimony Statements */}
      <div style={styles.statementsArea}>
        {statements.map((st) => (
          <div
            key={st.index}
            onClick={() => { setSelectedStatement(st.index); setMode('select'); }}
            style={{
              ...styles.statementCard,
              borderColor: selectedStatement === st.index ? 'var(--text-accent)'
                         : st.broken ? 'var(--guilty)' : 'var(--border)',
              background: st.broken ? 'rgba(231,76,60,0.15)'
                        : selectedStatement === st.index ? 'rgba(255,215,0,0.1)'
                        : 'var(--bg-card)',
              opacity: st.broken ? 0.6 : 1,
              textDecoration: st.broken ? 'line-through' : 'none',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={styles.stNum}>{st.index + 1}</span>
              <span style={{ fontSize: 14 }}>「{st.text}」</span>
            </div>
            <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
              {st.pressed && <span style={styles.tag}>ゆさぶり済</span>}
              {st.broken && <span style={{ ...styles.tag, background: 'var(--guilty)' }}>崩壊！</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      {selectedStatement !== null && !statements[selectedStatement]?.broken && (
        <div style={styles.actions}>
          {mode === 'select' ? (
            <>
              <button className="btn-primary" onClick={handlePress}
                disabled={statements[selectedStatement]?.pressed}
                style={{ flex: 1, padding: 12 }}>
                ゆさぶる
              </button>
              <button className="btn-objection" onClick={() => setMode('present')}
                style={{ flex: 1, padding: 12, fontSize: 14 }}>
                証拠をつきつける！
              </button>
            </>
          ) : (
            <div style={{ width: '100%' }}>
              <p style={{ fontSize: 12, color: 'var(--text-accent)', marginBottom: 8, fontWeight: 700 }}>
                証言{selectedStatement + 1}に対して、どの証拠をつきつける？
              </p>
              <div style={styles.evidenceList}>
                {allEvidence.map(ev => (
                  <div
                    key={ev.id}
                    onClick={() => setSelectedEvidence(ev.id)}
                    style={{
                      ...styles.evCard,
                      borderColor: selectedEvidence === ev.id ? 'var(--text-accent)' : 'var(--border)',
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: 12 }}>
                      [{ev.id}] {ev.name}
                      {ev.fake && <span style={{ color: 'var(--timer-warn)', marginLeft: 6 }}>[ニセモノ]</span>}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{ev.description}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button className="btn-objection" onClick={handlePresent}
                  disabled={!selectedEvidence} style={{ flex: 1, padding: 12, fontSize: 14 }}>
                  つきつける！
                </button>
                <button onClick={() => setMode('select')}
                  style={{ background: 'var(--border)', color: 'var(--text-primary)', padding: '12px 16px' }}>
                  戻る
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <button onClick={handleEndWitness}
        style={{ background: 'var(--border)', color: 'var(--text-secondary)', padding: '8px', fontSize: 12, alignSelf: 'center' }}>
        証人尋問を終了する
      </button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', flexDirection: 'column' as const, height: '100%', gap: 8, padding: 8 },
  witnessHeader: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '10px 14px', background: 'var(--bg-secondary)', borderRadius: 8,
  },
  witnessIcon: { fontSize: 24 },
  witnessName: { fontWeight: 900, fontSize: 16, color: 'var(--judge)' },
  pressResponse: {
    padding: '10px 14px', background: 'rgba(243,156,18,0.15)',
    borderRadius: 8, border: '1px solid var(--judge)',
    fontSize: 14, fontStyle: 'italic' as const,
  },
  statementsArea: { flex: 1, overflowY: 'auto' as const, display: 'flex', flexDirection: 'column' as const, gap: 6 },
  statementCard: {
    padding: '10px 12px', borderRadius: 8, border: '2px solid',
    cursor: 'pointer', transition: 'all 0.2s',
  },
  statementBubble: {
    padding: '10px 14px', background: 'var(--bg-card)', borderRadius: 8,
    border: '1px solid var(--border)', fontSize: 14,
    display: 'flex', alignItems: 'center', gap: 8,
  },
  stNum: {
    fontWeight: 900, fontSize: 16, color: 'var(--text-accent)',
    flexShrink: 0, width: 24, textAlign: 'center' as const,
  },
  tag: {
    fontSize: 10, padding: '2px 6px', borderRadius: 4,
    background: 'var(--judge)', color: 'white', fontWeight: 700,
  },
  actions: { display: 'flex', gap: 8, flexWrap: 'wrap' as const },
  evidenceList: { display: 'flex', flexDirection: 'column' as const, gap: 4, maxHeight: 150, overflowY: 'auto' as const },
  evCard: {
    padding: '8px 10px', borderRadius: 6, border: '1px solid', cursor: 'pointer',
    background: 'var(--bg-card)', transition: 'border-color 0.2s',
  },
  waiting: { textAlign: 'center' as const, color: 'var(--text-secondary)', padding: 20 },
};
