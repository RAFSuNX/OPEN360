export default function Loading() {
  return (
    <div>
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="skeleton skeleton-text" style={{ width: '60px', marginBottom: '10px' }} />
          <div className="skeleton skeleton-title" style={{ width: '200px' }} />
        </div>
        <div className="skeleton" style={{ width: '120px', height: '36px', borderRadius: '8px' }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {[0, 1, 2].map(i => (
          <div key={i} className="skeleton-card" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div className="skeleton skeleton-text" style={{ width: '160px' }} />
              <div className="skeleton skeleton-text" style={{ width: '80px' }} />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div className="skeleton" style={{ width: '60px', height: '32px', borderRadius: '8px' }} />
              <div className="skeleton" style={{ width: '60px', height: '32px', borderRadius: '8px' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
