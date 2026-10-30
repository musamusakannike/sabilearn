import dotenv from 'dotenv';
dotenv.config();

import nodemailer from 'nodemailer';
import { Resend } from 'resend';

const DEFAULT_FROM = 'SabiLearn <noreply@contact.sabilearn.online>';

function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is required to send email');
  }
  return new Resend(apiKey);
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<void> {
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS?.replace(/\s+/g, '');

  if (smtpHost && smtpUser && smtpPass) {
    try {
      const port = Number(process.env.SMTP_PORT || 587);
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port,
        secure: process.env.SMTP_SECURE === 'true' || port === 465,
        auth: { user: smtpUser, pass: smtpPass },
      });
      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.EMAIL_FROM || DEFAULT_FROM,
        to,
        subject,
        html,
        ...(text ? { text } : {}),
      });
      return;
    } catch (smtpError) {
      console.error('[Email] SMTP delivery failed; trying Resend:', smtpError);
    }
  }

  const from = process.env.EMAIL_FROM || DEFAULT_FROM;
  const resend = getResendClient();
  const { error } = await resend.emails.send({
    from,
    to,
    subject,
    html,
    ...(text ? { text } : {}),
  });
  if (error) {
    throw new Error(`Resend failed: ${error.message}`);
  }
}
