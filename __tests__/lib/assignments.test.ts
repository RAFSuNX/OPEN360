import { mapAssignments } from '@/lib/assignments'
import { Relationship } from '@prisma/client'

// Org structure:
// ceo (no manager)
//   manager1 (reports to ceo)
//     emp1 (reports to manager1)
//     emp2 (reports to manager1)
//     emp3 (reports to manager1)
//   manager2 (reports to ceo)
//     emp4 (reports to manager2)

const employees = [
  { id: 'ceo', managerId: null },
  { id: 'manager1', managerId: 'ceo' },
  { id: 'manager2', managerId: 'ceo' },
  { id: 'emp1', managerId: 'manager1' },
  { id: 'emp2', managerId: 'manager1' },
  { id: 'emp3', managerId: 'manager1' },
  { id: 'emp4', managerId: 'manager2' },
]

describe('mapAssignments', () => {
  test('1. includes SELF for emp1', () => {
    const result = mapAssignments('emp1', employees)
    expect(result).toContainEqual({ reviewerId: 'emp1', relationship: Relationship.SELF })
  })

  test('2. includes MANAGER (manager1) for emp1', () => {
    const result = mapAssignments('emp1', employees)
    expect(result).toContainEqual({ reviewerId: 'manager1', relationship: Relationship.MANAGER })
  })

  test('3. includes peers emp2 and emp3 for emp1, not emp1 itself', () => {
    const result = mapAssignments('emp1', employees)
    expect(result).toContainEqual({ reviewerId: 'emp2', relationship: Relationship.PEER })
    expect(result).toContainEqual({ reviewerId: 'emp3', relationship: Relationship.PEER })
    const selfAsPeer = result.filter(
      a => a.reviewerId === 'emp1' && a.relationship === Relationship.PEER
    )
    expect(selfAsPeer).toHaveLength(0)
  })

  test('4. does NOT include emp4 as peer for emp1 (different manager)', () => {
    const result = mapAssignments('emp1', employees)
    const emp4AsPeer = result.filter(
      a => a.reviewerId === 'emp4' && a.relationship === Relationship.PEER
    )
    expect(emp4AsPeer).toHaveLength(0)
  })

  test('5. includes direct reports emp1, emp2, emp3 for manager1', () => {
    const result = mapAssignments('manager1', employees)
    expect(result).toContainEqual({ reviewerId: 'emp1', relationship: Relationship.DIRECT_REPORT })
    expect(result).toContainEqual({ reviewerId: 'emp2', relationship: Relationship.DIRECT_REPORT })
    expect(result).toContainEqual({ reviewerId: 'emp3', relationship: Relationship.DIRECT_REPORT })
  })

  test('6. CEO has no MANAGER relationship (no managerId)', () => {
    const result = mapAssignments('ceo', employees)
    const managerEntries = result.filter(a => a.relationship === Relationship.MANAGER)
    expect(managerEntries).toHaveLength(0)
  })

  test('7. CEO has no PEER relationships (no managerId)', () => {
    const result = mapAssignments('ceo', employees)
    const peerEntries = result.filter(a => a.relationship === Relationship.PEER)
    expect(peerEntries).toHaveLength(0)
  })

  test('8. emp4 has no peers with emp1 (different manager)', () => {
    const result = mapAssignments('emp4', employees)
    const emp1AsPeer = result.filter(
      a => a.reviewerId === 'emp1' && a.relationship === Relationship.PEER
    )
    expect(emp1AsPeer).toHaveLength(0)
  })

  test('9. returns empty array for unknown employee ID', () => {
    const result = mapAssignments('unknown-id', employees)
    expect(result).toEqual([])
  })

  test('10. emp with no manager and no direct reports gets only SELF', () => {
    const isolated = [{ id: 'solo', managerId: null }]
    const result = mapAssignments('solo', isolated)
    expect(result).toEqual([{ reviewerId: 'solo', relationship: Relationship.SELF }])
  })
})
