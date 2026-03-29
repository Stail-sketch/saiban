import { useRef, useEffect } from 'react';
import { useGameStore } from '../../stores/gameStore';

export function ChatArea() {
  const messages = useGameStore(s => s.chatMessages);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  return (
    <div style={styles.container}>
      <div style={styles.header}>法廷記録</div>
      <div style={styles.messages}>
        {messages.map(msg => (
          <div key={msg.id} style={styles.msg} className="fade-in">
            <span style={{
              fontWeight: 700,
              color: msg.senderRole === 'judge' ? 'var(--judge)'
                   : msg.senderRole === 'prosecution' ? 'var(--prosecution)'
                   : msg.senderRole === 'defense' ? 'var(--defense)'
                   : 'var(--text-secondary)',
              fontSize: 12,
            }}>
              {msg.senderRole === 'judge' ? '裁判長'
               : msg.senderRole === 'prosecution' ? '検察'
               : msg.senderRole === 'defense' ? '弁護'
               : 'システム'}
              ：{msg.sender}
            </span>
            <div style={styles.content}>{msg.content}</div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100%',
    background: 'var(--bg-secondary)',
    borderRadius: 8,
    overflow: 'hidden',
  },
  header: {
    padding: '8px 12px',
    fontWeight: 700,
    fontSize: 13,
    borderBottom: '1px solid var(--border)',
    color: 'var(--text-accent)',
  },
  messages: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: 10,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 8,
  },
  msg: {
    padding: '6px 0',
    borderBottom: '1px solid rgba(42,42,74,0.5)',
  },
  content: {
    fontSize: 14,
    marginTop: 2,
    lineHeight: 1.5,
  },
};
