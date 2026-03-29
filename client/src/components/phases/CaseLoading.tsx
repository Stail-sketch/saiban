export function CaseLoading() {
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div className="spinner" style={{ margin: '0 auto 20px' }} />
        <h2 style={styles.title}>事件資料を作成中...</h2>
        <p style={styles.sub}>陪審員を召喚しています</p>
        <div className="suspense-dots" style={styles.dots}>
          <span>.</span><span>.</span><span>.</span>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
  },
  card: {
    textAlign: 'center' as const,
    padding: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 900,
    color: 'var(--text-accent)',
    marginBottom: 8,
  },
  sub: {
    color: 'var(--text-secondary)',
    fontSize: 14,
  },
  dots: {
    fontSize: 32,
    color: 'var(--text-accent)',
    marginTop: 12,
  },
};
