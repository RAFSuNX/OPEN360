export default function Loading() {
  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <div className="skeleton skeleton-text" style={{ width: '80px', marginBottom: '12px' }} />
        <div className="skeleton skeleton-title" style={{ width: '220px' }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {[0, 1, 2].map(i => (
          <div key={i} className="skeleton-card" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div className="skeleton skeleton-text" style={{ width: '180px' }} />
              <div className="skeleton skeleton-text" style={{ width: '120px' }} />
            </div>
            <div className="skeleton" style={{ width: '60px', height: '24px', borderRadius: '12px' }} />
          </div>
        ))}
      </div>
    </div>
  )
}
