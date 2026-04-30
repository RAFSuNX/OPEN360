export interface EmailContent {
  subject: string
  html: string
}

export function buildReviewInviteEmail(params: {
  reviewerName: string
  revieweeName: string
  cycleTitle: string
  appUrl: string
}): EmailContent {
  const { reviewerName, revieweeName, cycleTitle, appUrl } = params
  return {
    subject: `You have been invited to review for ${cycleTitle}`,
    html: `
      <p>Hi ${reviewerName},</p>
      <p>You have been asked to provide a review for <strong>${revieweeName}</strong> as part of the <strong>${cycleTitle}</strong> cycle.</p>
      <p><a href="${appUrl}">Click here to complete your review</a></p>
    `,
  }
}

export function buildReminderEmail(params: {
  reviewerName: string
  cycleTitle: string
  endDate: string
  appUrl: string
}): EmailContent {
  const { reviewerName, cycleTitle, endDate, appUrl } = params
  return {
    subject: `Reminder: ${cycleTitle} review deadline approaching`,
    html: `
      <p>Hi ${reviewerName},</p>
      <p>This is a reminder that the <strong>${cycleTitle}</strong> review cycle ends on <strong>${endDate}</strong>.</p>
      <p><a href="${appUrl}">Complete your review now</a></p>
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
    subject: `Your results for ${cycleTitle} are ready`,
    html: `
      <p>Hi ${employeeName},</p>
      <p>Your review results for the <strong>${cycleTitle}</strong> cycle are now available.</p>
      <p><a href="${appUrl}">View your results</a></p>
    `,
  }
}
