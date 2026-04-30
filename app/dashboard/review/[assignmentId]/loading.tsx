export default function ReviewLoading() {
  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div className="skeleton skeleton-text" style={{ width: '80px', marginBottom: '10px' }} />
        <div className="skeleton skeleton-title" style={{ width: '240px', marginBottom: '8px' }} />
        <div className="skeleton skeleton-text" style={{ width: '180px' }} />
      </div>

      {/* Question cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {[0, 1, 2, 3, 4].map(i => (
          <div key={i} className="skeleton-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div className="skeleton skeleton-text" style={{ width: '20px', flexShrink: 0, marginTop: '2px' }} />
              <div style={{ flex: 1 }}>
                <div className="skeleton skeleton-text" style={{ width: '60px', marginBottom: '10px' }} />
                <div className="skeleton skeleton-text" style={{ width: '100%', marginBottom: '6px' }} />
                <div className="skeleton skeleton-text" style={{ width: '70%', marginBottom: '16px' }} />
                {i % 2 === 0 ? (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {[1,2,3,4,5].map(n => (
                      <div key={n} className="skeleton" style={{ width: '36px', height: '36px', borderRadius: '8px' }} />
                    ))}
                  </div>
                ) : (
                  <div className="skeleton" style={{ width: '100%', height: '80px', borderRadius: '8px' }} />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
