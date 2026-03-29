import { useState, useEffect } from 'react';
import { socket } from '../../socket';

export function ObjectionOverlay() {
  const [visible, setVisible] = useState(false);
  const [side, setSide] = useState<string>('');

  useEffect(() => {
    const handler = (data: { side: string }) => {
      setSide(data.side);
      setVisible(true);
      setTimeout(() => setVisible(false), 2500);
    };
    socket.on('objection-raised', handler);
    return () => { socket.off('objection-raised', handler); };
  }, []);

  if (!visible) return null;

  return (
    <div className="objection-overlay" style={styles.overlay}>
      <div className="objection-text" style={styles.text}>
        異議アリ！
      </div>
      <div style={{
        ...styles.side,
        color: side === 'prosecution' ? 'var(--prosecution)' : 'var(--defense)',
      }}>
        — {side === 'prosecution' ? '検察官' : '弁護人'}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    background: 'rgba(255, 0, 0, 0.9)',
  },
  text: {
    fontSize: 72,
    fontWeight: 900,
    color: 'white',
    textShadow: '0 4px 30px rgba(0,0,0,0.5), 0 0 60px rgba(255,255,255,0.3)',
    letterSpacing: 8,
  },
  side: {
    fontSize: 24,
    fontWeight: 700,
    marginTop: 12,
  },
};
