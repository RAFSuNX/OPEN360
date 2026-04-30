export default function AdminLoading() {
  return (
    <div>
      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
        {[0, 1, 2].map(i => (
          <div key={i} className="skeleton-card" style={{ padding: '20px' }}>
            <div className="skeleton skeleton-text" style={{ width: '80px', marginBottom: '12px' }} />
            <div className="skeleton skeleton-title" style={{ width: '50px' }} />
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="skeleton-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--hairline)', display: 'flex', gap: '32px', overflowX: 'hidden' }}>
          {[80, 120, 100, 90].map((w, i) => (
            <div key={i} className="skeleton skeleton-text" style={{ width: `${w}px`, flexShrink: 0 }} />
          ))}
        </div>
        {[0, 1, 2, 3, 4].map(i => (
          <div key={i} style={{ padding: '14px 16px', borderBottom: '1px solid var(--hairline-soft)', display: 'flex', gap: '32px', overflowX: 'hidden' }}>
            {[120, 160, 80, 60].map((w, j) => (
              <div key={j} className="skeleton skeleton-text" style={{ width: `${w}px`, flexShrink: 0 }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
