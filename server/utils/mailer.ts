import nodemailer from 'nodemailer'
import type Mail from 'nodemailer/lib/mailer'
import { isThaibulkEmailConfigured, sendThaibulkTemplateEmail } from '~~/server/utils/thaibulkEmail'

export type MailAttachment = {
  filename: string
  content: Buffer
  contentType?: string
}

export function isSmtpConfigured() {
  const config = useRuntimeConfig()
  return Boolean(config.smtpHost && config.smtpFrom && config.smtpUser && config.smtpPass)
}

/** SMTP หรือ ThaiBulkSMS Email พร้อมส่งได้ */
export function isMailConfigured() {
  return isThaibulkEmailConfigured() || isSmtpConfigured()
}

function createTransport() {
  const config = useRuntimeConfig()
  if (!config.smtpHost || !config.smtpFrom) {
    throw createError({ statusCode: 503, message: 'ระบบส่งอีเมลยังไม่ได้ตั้งค่า' })
  }

  const port = Number(config.smtpPort) || 587
  const secure = port === 465

  return nodemailer.createTransport({
    host: config.smtpHost,
    port,
    secure,
    auth: config.smtpUser
      ? {
          user: config.smtpUser,
          pass: config.smtpPass || '',
        }
      : undefined,
  })
}

export async function sendMail(options: {
  to: string
  subject: string
  text: string
  html?: string
  attachments?: MailAttachment[]
}) {
  if (isThaibulkEmailConfigured()) {
    await sendThaibulkTemplateEmail({
      to: options.to,
      subject: options.subject,
      payload: {
        OPTION_1: options.text,
      },
      attachments: options.attachments,
    })
    return
  }

  const config = useRuntimeConfig()
  const transport = createTransport()

  const mail: Mail.Options = {
    from: config.smtpFrom,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
    attachments: options.attachments?.map(att => ({
      filename: att.filename,
      content: att.content,
      contentType: att.contentType ?? 'application/pdf',
    })),
  }

  await transport.sendMail(mail)
}
