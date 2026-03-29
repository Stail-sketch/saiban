import { useGameStore } from '../../stores/gameStore';
import { JurorCard } from './JurorCard';

interface Props {
  onJurorClick?: (index: number) => void;
  selectedJuror?: number | null;
}

export function JurorPanel({ onJurorClick, selectedJuror }: Props) {
  const jurors = useGameStore(s => s.jurors);
  const guiltyCount = jurors.filter(j => j.vote === '有罪').length;
  const notGuiltyCount = jurors.filter(j => j.vote === '無罪').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
      <div style={{
        textAlign: 'center' as const, padding: '10px 16px',
        background: 'linear-gradient(180deg, #1e1e36, #14142a)',
        borderRadius: 8, border: '1px solid var(--border-gold)',
      }}>
        <div style={{ fontSize: 10, color: 'var(--text-secondary)', letterSpacing: 3, marginBottom: 4 }}>JURY VOTES</div>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 24, color: 'var(--guilty)' }}>
            {guiltyCount}
          </span>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>vs</span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 24, color: 'var(--not-guilty)' }}>
            {notGuiltyCount}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginTop: 4 }}>
          {jurors.map(j => (
            <div key={j.index} style={{
              width: 12, height: 12, borderRadius: 2,
              background: j.vote === '有罪' ? 'var(--guilty)' : 'var(--not-guilty)',
              transition: 'background 0.3s',
            }} />
          ))}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
        {jurors.map(j => (
          <JurorCard key={j.index} juror={j}
            onClick={onJurorClick ? () => onJurorClick(j.index) : undefined}
            selected={selectedJuror === j.index} />
        ))}
      </div>
    </div>
  );
}
