import { useState, useEffect } from 'react';
import { socket } from '../../socket';

export function ObjectionRuling() {
  const [ruling, setRuling] = useState<{ sustained: boolean; comment: string } | null>(null);

  useEffect(() => {
    const handler = (data: { sustained: boolean; comment: string }) => {
      setRuling(data);
      setTimeout(() => setRuling(null), 4000);
    };
    socket.on('objection-ruled', handler);
    return () => { socket.off('objection-ruled', handler); };
  }, []);

  if (!ruling) return null;

  return (
    <div className="fade-in" style={styles.container}>
      <div className="gavel-strike" style={{
        ...styles.verdict,
        color: ruling.sustained ? 'var(--not-guilty)' : 'var(--guilty)',
      }}>
        {ruling.sustained ? '採用！' : '却下！'}
      </div>
      <div style={styles.comment}>
        ニシキ裁判長：「{ruling.comment}」
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'fixed' as const,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    background: 'var(--bg-surface)',
    borderRadius: 16,
    padding: '32px 48px',
    textAlign: 'center' as const,
    zIndex: 300,
    boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
    border: '2px solid var(--judge)',
  },
  verdict: {
    fontSize: 48,
    fontWeight: 900,
    marginBottom: 12,
  },
  comment: {
    fontSize: 16,
    color: 'var(--judge)',
    maxWidth: 400,
  },
};
