export default function TemplatesLoading() {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div className="skeleton skeleton-title" style={{ width: '120px' }} />
        <div className="skeleton" style={{ width: '140px', height: '36px', borderRadius: '8px' }} />
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
