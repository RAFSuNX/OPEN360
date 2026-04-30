import nodemailer from 'nodemailer'

export function createTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
}

export async function sendEmail(options: { to: string; subject: string; html: string }): Promise<void> {
  const transporter = createTransport()
  await transporter.sendMail({
    from: process.env.SMTP_USER,
    ...options,
  })
}
