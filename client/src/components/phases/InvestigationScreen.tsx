import { useState } from 'react';
import { socket } from '../../socket';
import { useGameStore } from '../../stores/gameStore';

export function InvestigationScreen() {
  const roomCode = useGameStore(s => s.roomCode);
  const locations = useGameStore(s => s.locations);
  const currentLocation = useGameStore(s => s.currentLocation);
  const evidence = useGameStore(s => s.evidence);
  const dialogue = useGameStore(s => s.dialogue);
  const [showEvidence, setShowEvidence] = useState(false);

  const handleGoTo = (locationId: string) => {
    socket.emit('go-to-location', { roomCode, locationId });
  };

  const handleTalk = (personName: string) => {
    socket.emit('talk-to', { roomCode, locationId: currentLocation.id, personName });
  };

  const handleExamine = (evidenceId: string) => {
    socket.emit('examine-clue', { roomCode, locationId: currentLocation.id, evidenceId });
  };

  const handleEndInvestigation = () => {
    socket.emit('end-investigation', { roomCode });
  };

  return (
    <div style={styles.bg}>
      {/* Top bar */}
      <div style={styles.topBar}>
        <span style={styles.phaseLabel}>探偵パート</span>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => setShowEvidence(!showEvidence)} style={styles.smallBtn}>
            {showEvidence ? '閉じる' : `法廷記録 (${evidence.length})`}
          </button>
          <button className="btn-prosecution" onClick={handleEndInvestigation} style={styles.smallBtn}>
            法廷へ向かう
          </button>
        </div>
      </div>

      <div style={styles.main}>
        {/* Left: Location or Dialogue */}
        <div style={styles.leftPanel}>
          {!currentLocation ? (
            <div style={styles.locationList}>
              <h3 style={styles.sectionTitle}>行き先を選べ</h3>
              {locations.map(loc => (
                <div key={loc.id} onClick={() => handleGoTo(loc.id)} style={styles.locationCard}>
                  <div style={{ fontWeight: 900, fontSize: 16 }}>{loc.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>{loc.description}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-accent)', marginTop: 4 }}>
                    {loc.people.length > 0 && `人物: ${loc.people.join(', ')}`}
                    {loc.clueCount > 0 && ` / 手がかり: ${loc.clueCount}件`}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={styles.locationDetail}>
              <div style={styles.locationHeader}>
                <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--text-accent)' }}>{currentLocation.name}</h3>
                <button onClick={() => useGameStore.getState().setCurrentLocation(null)} style={styles.backBtn}>
                  戻る
                </button>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>{currentLocation.description}</p>

              {currentLocation.people?.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <h4 style={styles.subTitle}>話す</h4>
                  {currentLocation.people.map((p: any) => (
                    <button key={p.name} onClick={() => handleTalk(p.name)} className="btn-primary" style={{ marginRight: 8, marginBottom: 6 }}>
                      {p.name}
                    </button>
                  ))}
                </div>
              )}

              {currentLocation.clues?.length > 0 && (
                <div>
                  <h4 style={styles.subTitle}>調べる</h4>
                  {currentLocation.clues.map((c: any) => (
                    <button key={c.evidenceId} onClick={() => handleExamine(c.evidenceId)}
                      disabled={c.found} className="btn-defense"
                      style={{ marginRight: 8, marginBottom: 6, opacity: c.found ? 0.4 : 1 }}>
                      {c.found ? '(発見済み)' : '調べる'}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Dialogue log */}
          <div style={styles.dialogueLog}>
            {dialogue.slice(-8).map(d => (
              <div key={d.id} className="fade-in" style={{
                ...styles.dialogueLine,
                borderLeftColor: d.speakerType === 'witness' ? 'var(--judge)' : d.speakerType === 'system' ? 'var(--defense)' : 'var(--text-secondary)',
              }}>
                <span style={{ fontWeight: 900, fontSize: 11, color: 'var(--judge)' }}>{d.speaker}</span>
                <div style={{ fontSize: 13 }}>{d.content}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Evidence list */}
        {showEvidence && (
          <div style={styles.evidencePanel}>
            <h3 style={styles.sectionTitle}>法廷記録</h3>
            {evidence.map(ev => (
              <div key={ev.id} style={styles.evidenceCard}>
                <div style={{ fontSize: 20 }}>{ev.sprite}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{ev.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{ev.description}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  bg: { height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' },
  topBar: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '8px 16px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)',
  },
  phaseLabel: { fontFamily: 'var(--font-display)', fontSize: 14, color: 'var(--text-accent)', letterSpacing: 2 },
  smallBtn: { padding: '8px 16px', fontSize: 12 },
  main: { flex: 1, display: 'flex', overflow: 'hidden', gap: 12, padding: 12 },
  leftPanel: { flex: 1, display: 'flex', flexDirection: 'column', gap: 8, overflow: 'hidden' },
  locationList: { flex: 1, overflow: 'auto' },
  sectionTitle: { fontFamily: 'var(--font-display)', color: 'var(--text-accent)', fontSize: 14, letterSpacing: 2, marginBottom: 12 },
  subTitle: { fontSize: 12, color: 'var(--text-accent)', marginBottom: 6, fontWeight: 900 },
  locationCard: {
    padding: '14px 16px', background: 'var(--bg-card)', borderRadius: 8, marginBottom: 8,
    border: '1px solid var(--border)', cursor: 'pointer', transition: 'border-color 0.2s',
  },
  locationDetail: { flex: 1, overflow: 'auto', padding: 4 },
  locationHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  backBtn: { background: 'var(--border)', color: 'var(--text-primary)', padding: '6px 12px', fontSize: 12 },
  dialogueLog: {
    maxHeight: 200, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 4,
    padding: 8, background: 'var(--bg-secondary)', borderRadius: 8,
  },
  dialogueLine: { padding: '4px 8px', borderLeft: '3px solid', fontSize: 13 },
  evidencePanel: {
    width: 280, overflow: 'auto', padding: 12,
    background: 'var(--bg-secondary)', borderRadius: 8, border: '1px solid var(--border-gold)',
  },
  evidenceCard: {
    display: 'flex', gap: 10, alignItems: 'center', padding: '8px 10px',
    background: 'var(--bg-card)', borderRadius: 6, marginBottom: 6, border: '1px solid var(--border)',
  },
};
