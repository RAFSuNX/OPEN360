import { Relationship } from '@prisma/client'

interface EmployeeNode {
  id: string
  managerId: string | null
}

interface Assignment {
  reviewerId: string
  relationship: Relationship
}

export function mapAssignments(revieweeId: string, employees: EmployeeNode[]): Assignment[] {
  const reviewee = employees.find(e => e.id === revieweeId)
  if (!reviewee) return []

  const assignments: Assignment[] = []

  // Self
  assignments.push({ reviewerId: revieweeId, relationship: Relationship.SELF })

  // Manager
  if (reviewee.managerId) {
    assignments.push({ reviewerId: reviewee.managerId, relationship: Relationship.MANAGER })
  }

  // Peers: same manager, not self, only if manager exists
  if (reviewee.managerId) {
    const peers = employees.filter(e => e.managerId === reviewee.managerId && e.id !== revieweeId)
    peers.forEach(p => assignments.push({ reviewerId: p.id, relationship: Relationship.PEER }))
  }

  // Direct reports: employees whose managerId points to reviewee
  const directReports = employees.filter(e => e.managerId === revieweeId)
  directReports.forEach(d => assignments.push({ reviewerId: d.id, relationship: Relationship.DIRECT_REPORT }))

  return assignments
}
