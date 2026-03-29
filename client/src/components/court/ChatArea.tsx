import { useRef, useEffect } from 'react';
import { useGameStore } from '../../stores/gameStore';

export function ChatArea() {
  const messages = useGameStore(s => s.chatMessages);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const roleStyle = (role: string) => {
    switch (role) {
      case 'judge': return { color: 'var(--judge)', icon: '&#x2696;' };
      case 'prosecution': return { color: 'var(--prosecution)', icon: '&#x1F525;' };
      case 'defense': return { color: 'var(--defense)', icon: '&#x1F6E1;' };
      case 'witness': return { color: '#cc88ff', icon: '&#x1F464;' };
      default: return { color: 'var(--text-secondary)', icon: '&#x2139;' };
    }
  };

  const roleLabel = (role: string) => {
    switch (role) {
      case 'judge': return '裁判長'; case 'prosecution': return '検察';
      case 'defense': return '弁護'; case 'witness': return '証人';
      default: return 'SYS';
    }
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column' as const, height: '100%',
      background: 'linear-gradient(180deg, #12121e, #0e0e18)',
      borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)',
    }}>
      <div style={{
        padding: '6px 12px', fontFamily: 'var(--font-display)', fontSize: 11,
        color: 'var(--text-accent)', letterSpacing: 2,
        borderBottom: '1px solid var(--border)', background: 'rgba(255,215,0,0.03)',
      }}>
        COURT RECORD
      </div>
      <div style={{ flex: 1, overflowY: 'auto' as const, padding: 8, display: 'flex', flexDirection: 'column' as const, gap: 4 }}>
        {messages.map(msg => {
          const rs = roleStyle(msg.senderRole);
          const isSpecial = msg.type === 'hp_change' || msg.type === 'testimony_break' || msg.type === 'bluff_caught';
          return (
            <div key={msg.id} className="fade-in" style={{
              padding: '5px 8px', borderRadius: 4,
              borderLeft: `3px solid ${rs.color}`,
              background: isSpecial ? 'rgba(255,68,68,0.08)' : 'transparent',
            }}>
              <span style={{ fontWeight: 900, fontSize: 11, color: rs.color }}>
                [{roleLabel(msg.senderRole)}] {msg.sender}
              </span>
              <div style={{ fontSize: 13, marginTop: 1, lineHeight: 1.5 }}>{msg.content}</div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
