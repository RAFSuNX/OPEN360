const TZ = 'Asia/Dhaka' // UTC+6

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', timeZone: TZ,
  }) // e.g. "08 Sep 2026"
}

export function formatDateTime(date: Date | string): string {
  const d = new Date(date)
  const datePart = d.toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', timeZone: TZ,
  })
  const timePart = d.toLocaleTimeString('en-GB', {
    hour: '2-digit', minute: '2-digit', timeZone: TZ,
  })
  return `${datePart}, ${timePart} GMT+6`
}
