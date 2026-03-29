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
    <div className="objection-overlay" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      display: 'flex', flexDirection: 'column' as const,
      justifyContent: 'center', alignItems: 'center', zIndex: 9999,
      background: 'linear-gradient(135deg, rgba(200,0,0,0.95), rgba(150,0,0,0.98))',
    }}>
      <div className="objection-text" style={{
        fontFamily: 'var(--font-display)',
        fontSize: 80,
        color: 'white',
        textShadow: '0 4px 40px rgba(0,0,0,0.7), 0 0 80px rgba(255,200,0,0.4), 0 0 120px rgba(255,100,0,0.3)',
        letterSpacing: 12,
      }}>
        異議アリ！
      </div>
      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: 20,
        color: side === 'prosecution' ? '#ffaaaa' : '#aaffcc',
        marginTop: 8,
        letterSpacing: 4,
      }}>
        — {side === 'prosecution' ? '検察官' : '弁護人'}
      </div>
    </div>
  );
}
