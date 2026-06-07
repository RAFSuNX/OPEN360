export default function AnalyticsLoading() {
  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <div style={{ height: '12px', width: '60px', background: 'var(--hairline)', borderRadius: '4px', marginBottom: '12px' }} />
        <div style={{ height: '28px', width: '180px', background: 'var(--hairline)', borderRadius: '6px' }} />
      </div>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '32px' }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="card" style={{ padding: '20px 24px', flex: '1 1 160px', minHeight: '80px', animation: 'pulse 1.5s ease-in-out infinite' }} />
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
        {[1, 2].map(i => (
          <div key={i} className="card" style={{ padding: '24px', minHeight: '240px', animation: 'pulse 1.5s ease-in-out infinite' }} />
        ))}
      </div>
    </div>
  )
}
