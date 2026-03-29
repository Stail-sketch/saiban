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
      const t = setTimeout(() => setAnimating(false), 600);
      return () => clearTimeout(t);
    }
  }, [flipped, juror.vote]);

  const isGuilty = juror.vote === '有罪';

  return (
    <div
      onClick={onClick}
      className={animating ? 'vote-flip' : ''}
      style={{
        ...styles.card,
        borderColor: selected ? 'var(--text-accent)' : isGuilty ? 'var(--guilty)' : 'var(--not-guilty)',
        cursor: onClick ? 'pointer' : 'default',
        opacity: juror.locked ? 0.6 : 1,
      }}
    >
      <div style={styles.header}>
        <span style={styles.name}>{juror.nickname}</span>
        <span style={{ ...styles.type, fontSize: 10 }}>({juror.type})</span>
      </div>
      <div style={{
        ...styles.vote,
        background: isGuilty ? 'var(--guilty)' : 'var(--not-guilty)',
      }}>
        {juror.vote}
      </div>
      <div style={styles.comment}>
        「{juror.comment || '...'}」
      </div>
      {juror.locked && <div style={styles.locked}>LOCKED</div>}
      <div style={styles.stars}>
        {'★'.repeat(juror.persuadability)}{'☆'.repeat(5 - juror.persuadability)}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    background: 'var(--bg-card)',
    borderRadius: 8,
    padding: '10px 12px',
    border: '2px solid',
    transition: 'all 0.3s',
    position: 'relative',
    minWidth: 0,
  },
  header: {
    marginBottom: 6,
  },
  name: {
    fontWeight: 700,
    fontSize: 13,
    display: 'block',
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  type: {
    color: 'var(--text-secondary)',
  },
  vote: {
    textAlign: 'center' as const,
    padding: '4px 8px',
    borderRadius: 4,
    fontWeight: 900,
    fontSize: 14,
    color: 'white',
    marginBottom: 6,
  },
  comment: {
    fontSize: 11,
    color: 'var(--text-secondary)',
    lineHeight: 1.4,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  locked: {
    position: 'absolute' as const,
    top: 4,
    right: 4,
    fontSize: 9,
    color: 'var(--timer-warn)',
    fontWeight: 900,
  },
  stars: {
    fontSize: 10,
    color: 'var(--text-accent)',
    marginTop: 4,
  },
};
