import nodemailer from 'nodemailer'

let cachedTransport: nodemailer.Transporter | null = null

function getTransport(): nodemailer.Transporter {
  if (!cachedTransport) {
    const port = Number(process.env.SMTP_PORT ?? 587)
    cachedTransport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  }
  return cachedTransport
}

export async function sendEmail(options: { to: string; subject: string; html: string }): Promise<void> {
  await getTransport().sendMail({
    from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
    ...options,
  })
}
