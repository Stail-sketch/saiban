import { useTimer } from '../../hooks/useTimer';
import { useGameStore } from '../../stores/gameStore';

export function PhaseTimer() {
  const timer = useTimer();
  const phase = useGameStore(s => s.phase);
  const currentTurn = useGameStore(s => s.currentTurn);
  const turnNumber = useGameStore(s => s.turnNumber);

  if (timer <= 0 && phase !== 'evidence') return null;

  const minutes = Math.floor(timer / 60);
  const seconds = timer % 60;
  const isLow = timer <= 10 && timer > 0;

  const phaseLabel: Record<string, string> = {
    opening_prosecution: '冒頭陳述 — 検察官',
    opening_defense: '冒頭陳述 — 弁護人',
    evidence: `証拠調べ #${turnNumber}`,
    witness_testimony: '証人尋問',
    witness_challenge: '証言を崩せ！',
    closing_prosecution: '最終弁論 — 検察官',
    closing_defense: '最終弁論 — 弁護人',
  };

  const turnLabel = phase === 'evidence'
    ? currentTurn === 'prosecution' ? '検察ターン' : '弁護ターン'
    : '';

  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '6px 16px', borderRadius: 6,
      background: 'linear-gradient(90deg, rgba(30,30,54,0.8), rgba(20,20,42,0.8))',
      border: '1px solid var(--border)',
    }}>
      <div>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: 'var(--text-accent)', letterSpacing: 1 }}>
          {phaseLabel[phase] || phase}
        </span>
        {turnLabel && (
          <span style={{
            marginLeft: 10, fontSize: 12, fontWeight: 900,
            color: currentTurn === 'prosecution' ? 'var(--prosecution)' : 'var(--defense)',
          }}>
            {turnLabel}
          </span>
        )}
      </div>
      {timer > 0 && (
        <span style={{
          fontFamily: 'monospace', fontWeight: 900, fontSize: 22, letterSpacing: 2,
          color: isLow ? 'var(--timer-warn)' : 'var(--text-accent)',
          textShadow: isLow ? '0 0 10px rgba(255,68,68,0.5)' : 'none',
        }} className={isLow ? 'pulse' : ''}>
          {minutes}:{seconds.toString().padStart(2, '0')}
        </span>
      )}
    </div>
  );
}
