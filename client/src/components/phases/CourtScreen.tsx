import { useState, useRef, useEffect } from 'react';
import { socket } from '../../socket';
import { useGameStore } from '../../stores/gameStore';

export function CourtScreen() {
  const [selectedStatement, setSelectedStatement] = useState<number | null>(null);
  const [selectedEvidence, setSelectedEvidence] = useState<string | null>(null);
  const [showEvidencePanel, setShowEvidencePanel] = useState(false);
  const [presenting, setPresenting] = useState(false);
  const phase = useGameStore(s => s.phase);
  const roomCode = useGameStore(s => s.roomCode);
  const dialogue = useGameStore(s => s.dialogue);
  const statements = useGameStore(s => s.testimonyStatements);
  const witnessName = useGameStore(s => s.currentWitnessName);
  const witnessAppearance = useGameStore(s => s.currentWitnessAppearance);
  const evidence = useGameStore(s => s.evidence);
  const hp = useGameStore(s => s.hp);
  const maxHp = useGameStore(s => s.maxHp);
  const verdict = useGameStore(s => s.verdict);
  const prosecutor = useGameStore(s => s.prosecutor);
  const dialogueEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dialogueEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [dialogue.length]);

  const handlePress = () => {
    if (selectedStatement === null) return;
    socket.emit('press', { roomCode, statementIndex: selectedStatement });
  };

  const handlePresent = () => {
    if (selectedStatement === null || !selectedEvidence) return;
    socket.emit('present-evidence', { roomCode, statementIndex: selectedStatement, evidenceId: selectedEvidence });
    setPresenting(false);
    setSelectedEvidence(null);
  };

  const handleStartTestimony = () => {
    socket.emit('start-testimony', { roomCode });
  };

  // HP bar
  const renderHp = () => (
    <div style={st.hpBar}>
      {Array.from({ length: maxHp }).map((_, i) => (
        <div key={i} style={{
          ...st.hpBlock,
          background: i < hp ? 'var(--defense)' : 'var(--bg-card)',
          boxShadow: i < hp ? '0 0 6px rgba(68,204,136,0.4)' : 'none',
        }} className={hp <= 1 && i < hp ? 'pulse' : ''} />
      ))}
    </div>
  );

  // Objection moment overlay
  if (phase === 'objection_moment') {
    return (
      <div style={st.bg}>
        <div className="objection-overlay" style={st.objectionOverlay}>
          <div className="objection-text" style={st.objectionText}>待った！</div>
        </div>
      </div>
    );
  }

  // Breakdown overlay
  if (phase === 'breakdown') {
    return (
      <div style={st.bg}>
        <div style={st.breakdownOverlay}>
          <div className="verdict-appear" style={st.breakdownTitle}>証人崩壊</div>
          <div style={st.breakdownDialogue}>
            {dialogue.filter(d => d.emotion === 'breakdown').map(d => (
              <div key={d.id} className="fade-in" style={st.breakdownLine}>{d.content}</div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Verdict
  if (phase === 'verdict' && verdict) {
    return (
      <div style={st.bg}>
        <div className="verdict-appear" style={{
          ...st.verdictText,
          color: verdict === 'not_guilty' ? 'var(--not-guilty)' : 'var(--guilty)',
        }}>
          {verdict === 'not_guilty' ? '無　罪' : '有　罪'}
        </div>
        <div className="fade-in" style={st.verdictSub}>
          {verdict === 'not_guilty' ? '被告人は無罪です！' : '弁護に失敗した...'}
        </div>
      </div>
    );
  }

  return (
    <div style={st.bg}>
      {/* Top bar */}
      <div style={st.topBar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={st.phaseLabel}>
            {phase === 'court_ready' ? '法廷' : phase === 'testimony' ? '証言中' : phase === 'cross_exam' ? '尋問' : '法廷'}
          </span>
          {witnessName && <span style={{ fontSize: 13, color: 'var(--judge)' }}>証人: {witnessName}</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {renderHp()}
          <button onClick={() => setShowEvidencePanel(!showEvidencePanel)} style={st.recordBtn}>
            法廷記録
          </button>
        </div>
      </div>

      <div style={st.main}>
        {/* Left: Dialogue + Testimony */}
        <div style={st.leftPanel}>
          {/* Testimony statements (during cross exam) */}
          {phase === 'cross_exam' && statements.length > 0 && (
            <div style={st.testimonyPanel}>
              {statements.map(s => (
                <div key={s.index} onClick={() => !s.broken && setSelectedStatement(s.index)}
                  style={{
                    ...st.stCard,
                    borderColor: selectedStatement === s.index ? 'var(--text-accent)' : s.broken ? 'var(--guilty)' : 'var(--border)',
                    background: s.broken ? 'rgba(255,51,51,0.1)' : selectedStatement === s.index ? 'rgba(255,215,0,0.08)' : 'var(--bg-card)',
                    opacity: s.broken ? 0.5 : 1,
                    textDecoration: s.broken ? 'line-through' : 'none',
                    cursor: s.broken ? 'default' : 'pointer',
                  }}>
                  <span style={st.stNum}>{s.index + 1}</span>
                  <span style={{ fontSize: 14 }}>「{s.text}」</span>
                  {s.pressed && !s.broken && <span style={st.pressedTag}>ゆさぶり済</span>}
                  {s.broken && <span style={{ ...st.pressedTag, background: 'var(--guilty)' }}>崩壊！</span>}
                </div>
              ))}
            </div>
          )}

          {/* Dialogue log */}
          <div style={st.dialogueArea}>
            {dialogue.map(d => (
              <div key={d.id} className="fade-in" style={{
                ...st.dialogueLine,
                borderLeftColor: d.speakerType === 'judge' ? 'var(--judge)'
                  : d.speakerType === 'prosecutor' ? 'var(--prosecution)'
                  : d.speakerType === 'witness' ? '#cc88ff'
                  : d.speakerType === 'defense' ? 'var(--defense)'
                  : 'var(--text-secondary)',
              }}>
                <span style={{ fontWeight: 900, fontSize: 11, color: 'var(--judge)' }}>{d.speaker}</span>
                <div style={{ fontSize: 14, lineHeight: 1.6 }}>{d.content}</div>
              </div>
            ))}
            <div ref={dialogueEndRef} />
          </div>

          {/* Action buttons */}
          <div style={st.actionBar}>
            {phase === 'court_ready' && (
              <button className="btn-primary" onClick={handleStartTestimony} style={st.actionBtn}>
                証言を聞く
              </button>
            )}
            {phase === 'cross_exam' && !presenting && (
              <>
                <button className="btn-defense" onClick={handlePress}
                  disabled={selectedStatement === null || statements[selectedStatement]?.pressed || statements[selectedStatement]?.broken}
                  style={st.actionBtn}>
                  ゆさぶる
                </button>
                <button className="btn-objection" onClick={() => setPresenting(true)}
                  disabled={selectedStatement === null || statements[selectedStatement]?.broken}
                  style={{ ...st.actionBtn, fontSize: 16 }}>
                  つきつける！
                </button>
              </>
            )}
            {phase === 'cross_exam' && presenting && (
              <div style={st.presentPanel}>
                <p style={{ fontSize: 12, color: 'var(--text-accent)', fontWeight: 700, marginBottom: 6 }}>
                  証言 {(selectedStatement ?? 0) + 1} に対して証拠を選べ！
                </p>
                <div style={st.evGrid}>
                  {evidence.map(ev => (
                    <div key={ev.id} onClick={() => setSelectedEvidence(ev.id)}
                      style={{
                        ...st.evMini,
                        borderColor: selectedEvidence === ev.id ? 'var(--text-accent)' : 'var(--border)',
                      }}>
                      <span style={{ fontSize: 18 }}>{ev.sprite}</span>
                      <span style={{ fontSize: 12, fontWeight: 700 }}>{ev.name}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button className="btn-objection" onClick={handlePresent} disabled={!selectedEvidence}
                    style={{ flex: 1, padding: 12, fontSize: 14 }}>
                    異議あり！
                  </button>
                  <button onClick={() => { setPresenting(false); setSelectedEvidence(null); }}
                    style={{ background: 'var(--border)', color: 'var(--text-primary)', padding: '12px 16px' }}>
                    戻る
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Evidence panel */}
        {showEvidencePanel && (
          <div style={st.evidencePanel}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 12, color: 'var(--text-accent)', letterSpacing: 2, marginBottom: 8 }}>
              法廷記録
            </h3>
            {evidence.map(ev => (
              <div key={ev.id} style={st.evCard}>
                <div style={{ fontSize: 24 }}>{ev.sprite}</div>
                <div>
                  <div style={{ fontWeight: 900, fontSize: 13 }}>{ev.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{ev.description}</div>
                  <div style={{ fontSize: 10, color: 'var(--judge)', marginTop: 2 }}>{ev.detail}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const st: Record<string, React.CSSProperties> = {
  bg: {
    height: '100vh', display: 'flex', flexDirection: 'column',
    background: 'var(--bg-primary)', overflow: 'hidden',
  },
  topBar: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '6px 16px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)',
  },
  phaseLabel: { fontFamily: 'var(--font-display)', fontSize: 14, color: 'var(--text-accent)', letterSpacing: 2 },
  hpBar: { display: 'flex', gap: 3 },
  hpBlock: { width: 16, height: 10, borderRadius: 2, transition: 'all 0.4s' },
  recordBtn: { background: 'var(--bg-card)', color: 'var(--text-accent)', padding: '6px 12px', fontSize: 11, border: '1px solid var(--border-gold)' },
  main: { flex: 1, display: 'flex', overflow: 'hidden', gap: 0 },
  leftPanel: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  testimonyPanel: {
    padding: 8, background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)',
    display: 'flex', flexDirection: 'column', gap: 4, maxHeight: '35vh', overflow: 'auto',
  },
  stCard: {
    display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
    borderRadius: 6, border: '2px solid', transition: 'all 0.2s', position: 'relative',
  },
  stNum: { fontFamily: 'var(--font-display)', fontSize: 14, color: 'var(--text-accent)', width: 20, textAlign: 'center', flexShrink: 0 },
  pressedTag: { fontSize: 9, padding: '2px 6px', borderRadius: 3, background: 'var(--judge)', color: 'white', fontWeight: 700, marginLeft: 'auto', flexShrink: 0 },
  dialogueArea: {
    flex: 1, overflow: 'auto', padding: '8px 12px',
    display: 'flex', flexDirection: 'column', gap: 6,
  },
  dialogueLine: { padding: '4px 10px', borderLeft: '3px solid', borderRadius: '0 4px 4px 0' },
  actionBar: {
    display: 'flex', gap: 10, padding: '10px 12px',
    borderTop: '1px solid var(--border)', background: 'var(--bg-secondary)',
    justifyContent: 'center', flexWrap: 'wrap',
  },
  actionBtn: { padding: '12px 24px', fontSize: 14 },
  presentPanel: { width: '100%' },
  evGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 6, maxHeight: 140, overflow: 'auto' },
  evMini: {
    display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px',
    background: 'var(--bg-card)', borderRadius: 6, border: '2px solid', cursor: 'pointer', transition: 'border-color 0.2s',
  },
  evidencePanel: {
    width: 280, overflow: 'auto', padding: 12,
    background: 'var(--bg-secondary)', borderLeft: '1px solid var(--border)',
  },
  evCard: {
    display: 'flex', gap: 10, alignItems: 'flex-start', padding: '8px 10px',
    background: 'var(--bg-card)', borderRadius: 6, marginBottom: 6, border: '1px solid var(--border)',
  },
  objectionOverlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999,
    background: 'linear-gradient(135deg, rgba(200,0,0,0.95), rgba(150,0,0,0.98))',
  },
  objectionText: {
    fontFamily: 'var(--font-display)', fontSize: 80, color: 'white',
    textShadow: '0 4px 40px rgba(0,0,0,0.7), 0 0 80px rgba(255,200,0,0.4)',
    letterSpacing: 12,
  },
  breakdownOverlay: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    height: '100%', gap: 20,
  },
  breakdownTitle: {
    fontFamily: 'var(--font-display)', fontSize: 36, color: 'var(--prosecution)',
    textShadow: '0 0 30px rgba(255,68,68,0.5)', letterSpacing: 8,
  },
  breakdownDialogue: { display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 500 },
  breakdownLine: { fontSize: 18, color: 'var(--text-primary)', textAlign: 'center', lineHeight: 1.8 },
  verdictText: {
    fontFamily: 'var(--font-display)', fontSize: 80, letterSpacing: 24,
    textShadow: '0 0 50px currentColor',
  },
  verdictSub: { fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--text-accent)', letterSpacing: 4, marginTop: 16 },
};
