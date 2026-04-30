import { buildReviewInviteEmail, buildReminderEmail, buildResultsReadyEmail } from '@/lib/email'

describe('email templates', () => {
  describe('buildReviewInviteEmail', () => {
    const params = {
      reviewerName: 'Alice',
      revieweeName: 'Bob',
      cycleTitle: 'Q1 2025 Review',
      appUrl: 'https://app.example.com',
      assignmentId: 'test-assignment-id',
    }

    it('includes cycle title in subject', () => {
      const { subject } = buildReviewInviteEmail(params)
      expect(subject).toContain(params.cycleTitle)
    })

    it('includes reviewer name in html', () => {
      const { html } = buildReviewInviteEmail(params)
      expect(html).toContain(params.reviewerName)
    })

    it('includes reviewee name in html', () => {
      const { html } = buildReviewInviteEmail(params)
      expect(html).toContain(params.revieweeName)
    })

    it('includes app url in html', () => {
      const { html } = buildReviewInviteEmail(params)
      expect(html).toContain(params.appUrl)
    })
  })

  describe('buildReminderEmail', () => {
    const params = {
      reviewerName: 'Alice',
      cycleTitle: 'Q1 2025 Review',
      endDate: '2025-03-31',
      appUrl: 'https://app.example.com',
      assignmentId: 'test-assignment-id',
    }

    it('includes "reminder" in subject', () => {
      const { subject } = buildReminderEmail(params)
      expect(subject.toLowerCase()).toContain('reminder')
    })

    it('includes end date in html', () => {
      const { html } = buildReminderEmail(params)
      expect(html).toContain(params.endDate)
    })

    it('includes app url in html', () => {
      const { html } = buildReminderEmail(params)
      expect(html).toContain(params.appUrl)
    })
  })

  describe('buildResultsReadyEmail', () => {
    const params = {
      employeeName: 'Bob',
      cycleTitle: 'Q1 2025 Review',
      appUrl: 'https://app.example.com',
    }

    it('includes cycle title in subject', () => {
      const { subject } = buildResultsReadyEmail(params)
      expect(subject).toContain(params.cycleTitle)
    })

    it('includes employee name in html', () => {
      const { html } = buildResultsReadyEmail(params)
      expect(html).toContain(params.employeeName)
    })

    it('includes app url in html', () => {
      const { html } = buildResultsReadyEmail(params)
      expect(html).toContain(params.appUrl)
    })
  })
})
