export interface EmailContent {
  subject: string
  html: string
}

export interface OrgBranding {
  orgName?: string
  orgLogoUrl?: string
  orgTagline?: string
}

function emailHeader(org: OrgBranding): string {
  const name = org.orgName || 'OPEN360'
  const logo = org.orgLogoUrl
    ? `<img src="${org.orgLogoUrl}" alt="${name}" style="height:36px;max-width:160px;object-fit:contain;display:block;" />`
    : `<span style="font-size:18px;font-weight:600;color:#26251e;">${name}</span>`
  return `
    <div style="border-bottom:1px solid #e6e5e0;padding:20px 32px;background:#f7f7f4;">
      ${logo}
      ${org.orgTagline ? `<p style="font-size:12px;color:#807d72;margin:4px 0 0;">${org.orgTagline}</p>` : ''}
    </div>
  `
}

function emailWrapper(content: string, org: OrgBranding): string {
  return `
    <div style="font-family:'Inter',system-ui,sans-serif;max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e6e5e0;border-radius:12px;overflow:hidden;">
      ${emailHeader(org)}
      <div style="padding:32px;color:#26251e;font-size:15px;line-height:1.6;">
        ${content}
      </div>
      <div style="padding:16px 32px;border-top:1px solid #e6e5e0;background:#f7f7f4;">
        <p style="font-size:12px;color:#a09c92;margin:0;">Sent by ${org.orgName || 'OPEN360'} · Responses are completely anonymous</p>
      </div>
    </div>
  `
}

export function buildReviewInviteEmail(params: {
  reviewerName: string
  revieweeName: string
  cycleTitle: string
  appUrl: string
  assignmentId: string
  org?: OrgBranding
}): EmailContent {
  const { reviewerName, revieweeName, cycleTitle, appUrl, assignmentId, org = {} } = params
  const url = `${appUrl}/dashboard/review/${assignmentId}`
  return {
    subject: `Review request: ${revieweeName} - ${cycleTitle}`,
    html: emailWrapper(`
      <p style="margin:0 0 16px;">Hi <strong>${reviewerName}</strong>,</p>
      <p style="margin:0 0 16px;">You have been asked to provide feedback for <strong>${revieweeName}</strong> as part of <strong>${cycleTitle}</strong>.</p>
      <p style="margin:0 0 24px;color:#5a5852;">Your responses are completely anonymous - no one will know what you wrote.</p>
      <a href="${url}" style="display:inline-block;background:#f54e00;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:500;font-size:14px;">Complete your review</a>
      <p style="margin:20px 0 0;font-size:12px;color:#a09c92;">Or copy: ${url}</p>
    `, org),
  }
}

export function buildReminderEmail(params: {
  reviewerName: string
  cycleTitle: string
  endDate: string
  appUrl: string
  assignmentId: string
  org?: OrgBranding
}): EmailContent {
  const { reviewerName, cycleTitle, endDate, appUrl, assignmentId, org = {} } = params
  const url = `${appUrl}/dashboard/review/${assignmentId}`
  return {
    subject: `Reminder: complete your review for ${cycleTitle}`,
    html: emailWrapper(`
      <p style="margin:0 0 16px;">Hi <strong>${reviewerName}</strong>,</p>
      <p style="margin:0 0 16px;">This is a reminder that the <strong>${cycleTitle}</strong> review closes on <strong>${endDate}</strong>.</p>
      <a href="${url}" style="display:inline-block;background:#f54e00;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:500;font-size:14px;">Complete your review</a>
      <p style="margin:20px 0 0;font-size:12px;color:#a09c92;">Or copy: ${url}</p>
    `, org),
  }
}

export function buildResultsReadyEmail(params: {
  employeeName: string
  cycleTitle: string
  appUrl: string
  org?: OrgBranding
}): EmailContent {
  const { employeeName, cycleTitle, appUrl, org = {} } = params
  return {
    subject: `Your review results are ready - ${cycleTitle}`,
    html: emailWrapper(`
      <p style="margin:0 0 16px;">Hi <strong>${employeeName}</strong>,</p>
      <p style="margin:0 0 24px;">Your review results for <strong>${cycleTitle}</strong> are now available.</p>
      <a href="${appUrl}/dashboard" style="display:inline-block;background:#f54e00;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:500;font-size:14px;">View your results</a>
    `, org),
  }
}
