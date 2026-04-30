export default function DashboardLoading() {
  return (
    <div>
      {/* Profile card skeleton */}
      <div className="skeleton-card" style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div className="skeleton skeleton-text" style={{ width: '80px' }} />
            <div className="skeleton skeleton-title" style={{ width: '180px' }} />
            <div className="skeleton skeleton-text" style={{ width: '120px', marginTop: '2px' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 32px' }}>
            {[100, 120, 140, 90].map((w, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div className="skeleton skeleton-text" style={{ width: '60px' }} />
                <div className="skeleton skeleton-text" style={{ width: `${w}px` }} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pending reviews skeleton */}
      <section style={{ marginBottom: '40px' }}>
        <div className="skeleton skeleton-text" style={{ width: '110px', marginBottom: '16px' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[0, 1, 2].map(i => (
            <div key={i} className="skeleton-card" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div className="skeleton skeleton-text" style={{ width: '160px' }} />
                <div className="skeleton skeleton-text" style={{ width: '100px' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
                <div className="skeleton skeleton-text" style={{ width: '30px' }} />
                <div className="skeleton skeleton-text" style={{ width: '70px' }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Results skeleton */}
      <section>
        <div className="skeleton skeleton-text" style={{ width: '80px', marginBottom: '16px' }} />
        {[0, 1].map(i => (
          <div key={i} className="skeleton-card" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div className="skeleton skeleton-text" style={{ width: '140px' }} />
            <div className="skeleton skeleton-text" style={{ width: '80px' }} />
          </div>
        ))}
      </section>
    </div>
  )
}
