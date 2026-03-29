export function CaseLoading() {
  return (
    <div style={{
      display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%',
      background: 'radial-gradient(ellipse at center, #1a1028 0%, #0a0a12 70%)',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>&#x2696;</div>
        <div className="spinner" style={{ margin: '0 auto 20px' }} />
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--text-accent)', letterSpacing: 4, marginBottom: 8 }}>
          事件資料を作成中
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>陪審員を召喚しています</p>
        <div className="suspense-dots" style={{ fontSize: 36, color: 'var(--text-accent)', marginTop: 8 }}>
          <span>.</span><span>.</span><span>.</span>
        </div>
      </div>
    </div>
  );
}
