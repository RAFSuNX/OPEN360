export interface EmailContent {
  subject: string
  html: string
}

export function buildReviewInviteEmail(params: {
  reviewerName: string
  revieweeName: string
  cycleTitle: string
  appUrl: string
  assignmentId: string
}): EmailContent {
  const { reviewerName, revieweeName, cycleTitle, appUrl, assignmentId } = params
  const url = `${appUrl}/dashboard/review/${assignmentId}`
  return {
    subject: `Review request: ${revieweeName} — ${cycleTitle}`,
    html: `
      <p>Hi ${reviewerName},</p>
      <p>You have been asked to provide a review for <strong>${revieweeName}</strong> as part of <strong>${cycleTitle}</strong>.</p>
      <p>Your responses are completely anonymous.</p>
      <p><a href="${url}">Complete your review</a></p>
      <p style="font-size:12px;color:#807d72;">Or copy this link: ${url}</p>
    `,
  }
}

export function buildReminderEmail(params: {
  reviewerName: string
  cycleTitle: string
  endDate: string
  appUrl: string
  assignmentId: string
}): EmailContent {
  const { reviewerName, cycleTitle, endDate, appUrl, assignmentId } = params
  const url = `${appUrl}/dashboard/review/${assignmentId}`
  return {
    subject: `Reminder: complete your review for ${cycleTitle}`,
    html: `
      <p>Hi ${reviewerName},</p>
      <p>This is a reminder that the <strong>${cycleTitle}</strong> review closes on <strong>${endDate}</strong>.</p>
      <p><a href="${url}">Complete your review now</a></p>
      <p style="font-size:12px;color:#807d72;">Or copy this link: ${url}</p>
    `,
  }
}

export function buildResultsReadyEmail(params: {
  employeeName: string
  cycleTitle: string
  appUrl: string
}): EmailContent {
  const { employeeName, cycleTitle, appUrl } = params
  return {
    subject: `Your review results are ready — ${cycleTitle}`,
    html: `
      <p>Hi ${employeeName},</p>
      <p>Your review results for <strong>${cycleTitle}</strong> are now available.</p>
      <p><a href="${appUrl}/dashboard">View your results</a></p>
    `,
  }
}
