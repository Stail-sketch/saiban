import { useState, useEffect } from 'react';
import type { JurorState } from '../../types/game';

interface Props {
  juror: JurorState;
  flipped?: boolean;
  onClick?: () => void;
  selected?: boolean;
}

export function JurorCard({ juror, flipped, onClick, selected }: Props) {
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (flipped) {
      setAnimating(true);
      const t = setTimeout(() => setAnimating(false), 700);
      return () => clearTimeout(t);
    }
  }, [flipped, juror.vote]);

  const isGuilty = juror.vote === '有罪';

  return (
    <div
      onClick={onClick}
      className={animating ? 'vote-flip' : ''}
      style={{
        background: 'linear-gradient(180deg, #1e1e36 0%, #14142a 100%)',
        borderRadius: 8,
        padding: '8px 10px',
        border: `2px solid ${selected ? 'var(--text-accent)' : isGuilty ? 'rgba(255,51,51,0.5)' : 'rgba(51,204,119,0.5)'}`,
        cursor: onClick ? 'pointer' : 'default',
        opacity: juror.locked ? 0.5 : 1,
        transition: 'all 0.3s',
        position: 'relative' as const,
        boxShadow: selected ? '0 0 15px rgba(255,215,0,0.2)' : 'none',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{ fontWeight: 900, fontSize: 12, color: 'var(--text-primary)' }}>
          {juror.name}
        </span>
        <span style={{ fontSize: 9, color: 'var(--text-secondary)', background: 'var(--bg-card)', padding: '1px 5px', borderRadius: 3 }}>
          {juror.type}
        </span>
      </div>
      <div style={{
        textAlign: 'center' as const,
        padding: '3px 0',
        borderRadius: 4,
        fontFamily: 'var(--font-display)',
        fontSize: 13,
        color: 'white',
        background: isGuilty
          ? 'linear-gradient(90deg, #cc2222, #ff3333)'
          : 'linear-gradient(90deg, #22aa66, #33cc77)',
        boxShadow: isGuilty ? '0 2px 8px rgba(255,51,51,0.3)' : '0 2px 8px rgba(51,204,119,0.3)',
        marginBottom: 4,
      }}>
        {juror.vote}
      </div>
      <div style={{ fontSize: 10, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
        {juror.comment || '...'}
      </div>
      {juror.locked && (
        <div style={{ position: 'absolute' as const, top: 3, right: 5, fontSize: 8, color: 'var(--timer-warn)', fontWeight: 900, letterSpacing: 1 }}>
          LOCK
        </div>
      )}
      <div style={{ fontSize: 9, color: 'var(--text-accent)', marginTop: 2, letterSpacing: 1 }}>
        {'★'.repeat(juror.persuadability)}{'☆'.repeat(5 - juror.persuadability)}
      </div>
    </div>
  );
}
