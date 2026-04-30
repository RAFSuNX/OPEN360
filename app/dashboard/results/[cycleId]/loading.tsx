export default function ResultsLoading() {
  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <div className="skeleton skeleton-text" style={{ width: '80px', marginBottom: '10px' }} />
        <div className="skeleton skeleton-title" style={{ width: '220px', marginBottom: '6px' }} />
        <div className="skeleton skeleton-text" style={{ width: '140px' }} />
      </div>
      {[0, 1, 2, 3].map(i => (
        <div key={i} className="skeleton-card" style={{ marginBottom: '16px', padding: '24px' }}>
          <div className="skeleton skeleton-text" style={{ width: '100px', marginBottom: '16px' }} />
          {[0, 1, 2].map(j => (
            <div key={j} style={{ marginBottom: '16px' }}>
              <div className="skeleton skeleton-text" style={{ width: '90%', marginBottom: '8px' }} />
              <div className="skeleton" style={{ height: '32px', borderRadius: '8px', width: '60%' }} />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
