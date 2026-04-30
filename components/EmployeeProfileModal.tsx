'use client'
import { useEffect, useState } from 'react'

interface EmployeeProfile {
  id: string; name: string; email: string
  employeeId: string | null; department: string | null; role: string | null
  manager: { id: string; name: string; role: string | null } | null
  directReports: { id: string; name: string; role: string | null }[]
}

interface Props {
  employeeId: string
  onClose: () => void
}

export function EmployeeProfileModal({ employeeId, onClose }: Props) {
  const [profile, setProfile] = useState<EmployeeProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/employees/${employeeId}`)
      .then(r => r.json())
      .then(setProfile)
      .finally(() => setLoading(false))
  }, [employeeId])

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(38,37,30,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '24px' }}
      onClick={onClose}
    >
      <div className="card" style={{ width: '100%', maxWidth: '420px', padding: '28px' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            {loading ? (
              <p style={{ color: 'var(--muted)', fontSize: '14px' }}>Loading...</p>
            ) : profile ? (
              <>
                <p style={{ fontSize: '20px', fontWeight: '400', color: 'var(--ink)', letterSpacing: '-0.2px', margin: '0 0 4px' }}>{profile.name}</p>
                <p style={{ fontSize: '13px', color: 'var(--muted)', margin: 0 }}>{profile.role ?? 'No role set'}</p>
              </>
            ) : (
              <p style={{ color: 'var(--semantic-error)', fontSize: '14px' }}>Employee not found</p>
            )}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: '20px', lineHeight: 1 }}>×</button>
        </div>

        {profile && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {[
                { label: 'Employee ID', value: profile.employeeId },
                { label: 'Department', value: profile.department },
                { label: 'Email', value: profile.email },
                { label: 'Role', value: profile.role },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="section-label" style={{ marginBottom: '2px', fontSize: '10px' }}>{label}</p>
                  <p style={{ fontSize: '13px', color: value ? 'var(--ink)' : 'var(--muted)', margin: 0, fontFamily: label === 'Email' || label === 'Employee ID' ? "'JetBrains Mono', monospace" : 'inherit', wordBreak: 'break-all' as const }}>
                    {value ?? '—'}
                  </p>
                </div>
              ))}
            </div>

            {profile.manager && (
              <div style={{ paddingTop: '12px', borderTop: '1px solid var(--hairline-soft)' }}>
                <p className="section-label" style={{ marginBottom: '6px' }}>Manager</p>
                <p style={{ fontSize: '13px', color: 'var(--ink)', margin: 0 }}>{profile.manager.name}</p>
                {profile.manager.role && <p style={{ fontSize: '12px', color: 'var(--muted)', margin: '2px 0 0' }}>{profile.manager.role}</p>}
              </div>
            )}

            {profile.directReports.length > 0 && (
              <div style={{ paddingTop: '12px', borderTop: '1px solid var(--hairline-soft)' }}>
                <p className="section-label" style={{ marginBottom: '8px' }}>Direct Reports ({profile.directReports.length})</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {profile.directReports.map(r => (
                    <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <p style={{ fontSize: '13px', color: 'var(--ink)', margin: 0 }}>{r.name}</p>
                      <p style={{ fontSize: '12px', color: 'var(--muted)', margin: 0 }}>{r.role ?? ''}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
