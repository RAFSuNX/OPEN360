export default function CyclesLoading() {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div className="skeleton skeleton-title" style={{ width: '100px' }} />
        <div className="skeleton" style={{ width: '120px', height: '36px', borderRadius: '8px' }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {[0,1,2,3].map(i => (
          <div key={i} className="skeleton-card" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div className="skeleton skeleton-text" style={{ width: '160px' }} />
              <div className="skeleton skeleton-text" style={{ width: '100px' }} />
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <div className="skeleton" style={{ width: '60px', height: '22px', borderRadius: '9999px' }} />
              <div className="skeleton" style={{ width: '80px', height: '32px', borderRadius: '8px' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
