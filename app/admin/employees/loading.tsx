export default function EmployeesLoading() {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div className="skeleton skeleton-title" style={{ width: '120px' }} />
        <div style={{ display: 'flex', gap: '8px' }}>
          <div className="skeleton" style={{ width: '100px', height: '36px', borderRadius: '8px' }} />
          <div className="skeleton" style={{ width: '120px', height: '36px', borderRadius: '8px' }} />
        </div>
      </div>
      <div className="skeleton-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '10px 16px', background: 'var(--canvas-soft)', borderBottom: '1px solid var(--hairline)', display: 'flex', gap: '40px', overflowX: 'hidden' }}>
          {[100, 150, 80, 100, 80].map((w, i) => (
            <div key={i} className="skeleton skeleton-text" style={{ width: `${w}px`, flexShrink: 0 }} />
          ))}
        </div>
        {[0,1,2,3,4,5].map(i => (
          <div key={i} style={{ padding: '14px 16px', borderBottom: '1px solid var(--hairline-soft)', display: 'flex', gap: '40px', alignItems: 'center', overflowX: 'hidden' }}>
            {[140, 180, 70, 90, 60].map((w, j) => (
              <div key={j} className="skeleton skeleton-text" style={{ width: `${w}px`, flexShrink: 0 }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
