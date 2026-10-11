import dotenv from 'dotenv';
dotenv.config();

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
