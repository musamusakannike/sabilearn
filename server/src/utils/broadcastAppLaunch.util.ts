import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import mongoose from 'mongoose';
import nodemailer from 'nodemailer';
import { Resend } from 'resend';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const DEFAULT_FROM = 'SabiLearn <noreply@contact.sabilearn.online>';
const RESEND_FROM = process.env.EMAIL_FROM || DEFAULT_FROM;
const SMTP_FROM = process.env.SMTP_FROM || process.env.EMAIL_FROM || DEFAULT_FROM;
const LOG = '/tmp/course-request-broadcast.log';
const SUBJECT = 'What would you like to learn next on SabiLearn?';
const SAMPLE = 'musamusakannike@gmail.com';
const REQUEST_URL = 'https://sabilearn.online/request-course';
const TEXT = `What skill or course would you like to see on SabiLearn?\n\nTell us what you want to learn here: ${REQUEST_URL}\n\nWe’ll do our best to add requested courses within two weeks. Share your idea and help shape what we build next.\n\nLearn a skill. Sabi it for life.\nSabiLearn`;
const HTML = `<!doctype html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="X-UA-Compatible" content="IE=edge"><title>${SUBJECT}</title>
<!--[if mso]><style>body,table,td,p,a{font-family:Arial,Helvetica,sans-serif!important}</style><![endif]-->
<style>@media only screen and (max-width:600px){.outer{padding:16px 8px!important}.card{width:100%!important}.pad{padding-left:20px!important;padding-right:20px!important}.headline{font-size:32px!important;line-height:38px!important}}</style>
</head>
<body style="margin:0;padding:0;background-color:#ECE8DF;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0E0E1A;-webkit-font-smoothing:antialiased">
<div style="display:none;font-size:1px;color:#ECE8DF;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden">Help us choose what to build next. Suggest a course for SabiLearn.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="outer" style="background:#ECE8DF;margin:0;padding:32px 16px"><tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%"><tr><td align="center" style="padding:0 0 16px;font-size:12px;line-height:18px;color:#55555F">Help shape what comes next on SabiLearn. <a href="https://sabilearn.online" style="color:#55555F">Visit SabiLearn</a></td></tr></table>
<table role="presentation" class="card" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#FFFFFF;border:1px solid #DEDAD0">
<tr><td class="pad" style="padding:24px 40px;border-bottom:1px solid #DEDAD0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="font-size:22px;font-weight:800;letter-spacing:-.02em;color:#0E0E1A">SabiLearn</td><td align="right"><a href="https://sabilearn.online/dashboard" style="font-size:13px;font-weight:600;color:#0E0E1A;text-decoration:none">Open web app</a></td></tr></table></td></tr>
<tr><td class="pad" style="padding:48px 40px 8px"><div style="font-size:12px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:#5B4FE8">Built around what you want to learn</div><h1 class="headline" style="margin:16px 0 0;font-size:40px;line-height:46px;letter-spacing:-.03em;font-weight:800;color:#0E0E1A">What should we teach next?</h1><p style="margin:16px 0 0;font-size:16px;line-height:26px;color:#3D3D4A">Hi there, we’re planning new courses for SabiLearn and want your input. What skill, subject, or specific course would you like to learn?</p></td></tr>
<tr><td class="pad" style="padding:24px 40px 8px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#FBDDB0"><tr><td style="padding:28px 30px"><div style="font-size:21px;line-height:28px;font-weight:800;color:#0E0E1A">Your idea could be our next course.</div><div style="font-size:15px;line-height:24px;color:#3D3D4A;margin-top:8px">We’ll do our best to add requested courses within two weeks. Tell us what you want to see and help us decide what to build next.</div></td></tr></table></td></tr>
<tr><td class="pad" style="padding:28px 40px 8px"><a href="${REQUEST_URL}" style="display:inline-block;background:#0E0E1A;color:#FFFFFF;font-size:14px;line-height:20px;font-weight:700;padding:14px 24px;text-decoration:none">Suggest a course</a><p style="margin:18px 0 0;font-size:14px;line-height:22px;color:#3D3D4A">Have a specific course in mind? Share the name or describe the skill you want to master. Every suggestion helps.</p></td></tr>
<tr><td class="pad" style="padding:32px 40px 40px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F2A900"><tr><td style="padding:28px 30px"><div style="font-size:21px;line-height:28px;font-weight:800;color:#0E0E1A">What would you love to sabi?</div><div style="font-size:14px;line-height:22px;color:#0E0E1A;margin-top:8px">Take a moment to send us your course request. We’re listening.</div><div style="margin-top:16px"><a href="${REQUEST_URL}" style="display:inline-block;background:#0E0E1A;color:#FFFFFF;font-size:14px;font-weight:700;padding:14px 24px;text-decoration:none">Share your idea</a></div></td></tr></table></td></tr>
<tr><td style="padding:32px 40px;background:#0E0E1A"><div style="font-size:16px;font-weight:800;color:#FFFFFF">SabiLearn</div><div style="font-size:13px;line-height:20px;color:#D6D3CA;margin-top:8px">Learn a skill. Sabi it for life.</div><div style="font-size:13px;line-height:20px;color:#D6D3CA;margin-top:8px"><a href="https://sabilearn.online/terms" style="color:#FBDDB0">Terms</a> &nbsp;|&nbsp; <a href="https://sabilearn.online/privacy" style="color:#FBDDB0">Privacy</a> &nbsp;|&nbsp; <a href="https://sabilearn.online/dashboard" style="color:#FBDDB0">Open web app</a></div><div style="font-size:12px;line-height:18px;color:#A9A7A0;margin-top:12px">You are receiving this because you have a SabiLearn account.</div><div style="font-size:12px;line-height:18px;color:#A9A7A0;margin-top:4px">© 2026 SabiLearn. Made in Nigeria. Built by Codiac.</div></td></tr>
</table></td></tr></table></body></html>`;

function log(msg: string) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(LOG, `${line}\n`);
}

function getTransport() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS?.replace(/\s+/g, '');
  if (!host || !user || !pass) throw new Error('SMTP_HOST, SMTP_USER, and SMTP_PASS are required');
  const port = Number(process.env.SMTP_PORT || 587);
  return nodemailer.createTransport({
    host,
    port,
    secure: process.env.SMTP_SECURE === 'true' || port === 465,
    auth: { user, pass },
  });
}

async function sendWithSMTP(emails: string[]): Promise<{ queued: number; failed: string[] }> {
  const transporter = getTransport();
  const failed: string[] = [];
  let queued = 0;
  try {
    for (const to of emails) {
      try {
        await transporter.sendMail({ from: SMTP_FROM, to, subject: SUBJECT, html: HTML, text: TEXT });
        queued++;
      } catch (error) {
        failed.push(to);
        log(`SMTP fallback failed for ${to}: ${(error as Error).message}`);
      }
    }
  } finally {
    await transporter.close();
  }
  return { queued, failed };
}

async function main() {
  const mode = process.argv[2];
  if (mode !== '--sample' && mode !== '--all') {
    throw new Error('Choose --sample or --all explicitly');
  }
  fs.writeFileSync(LOG, '');
  if (mode === '--sample') {
    const transporter = getTransport();
    log(`SMTP configured; sender: ${SMTP_FROM}`);
    const result = await transporter.sendMail({ from: SMTP_FROM, to: SAMPLE, subject: SUBJECT, html: HTML, text: TEXT });
    log(`Sample accepted by SMTP for ${SAMPLE}; messageId=${result.messageId}`);
    await transporter.close();
    return;
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) throw new Error('RESEND_API_KEY missing');
  const resend = new Resend(resendKey);
  log(`Resend configured; sender: ${RESEND_FROM}`);

  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI missing');
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  if (!db) throw new Error('No db');

  const users = await db.collection('users').find(
    { $or: [
      { 'settings.emailNotifications': true },
      { 'settings.emailNotifications': { $exists: false } },
    ] },
    { projection: { email: 1 } },
  ).toArray();

  const blocked = new Set(['example.com', 'test.com', 'localhost']);
  const emails = [...new Set(users.map((u) => String(u.email || '').trim().toLowerCase()).filter((email) => {
    const domain = email.split('@')[1] || '';
    return email.includes('@') && !blocked.has(domain);
  }))];

  log(`Eligible unique emails: ${emails.length} (from ${users.length} user docs)`);
  let queued = 0;
  let failed = 0;
  const batchSize = 100;
  for (let i = 0; i < emails.length; i += batchSize) {
    const chunk = emails.slice(i, i + batchSize);
    try {
      const { data, error } = await resend.batch.send(chunk.map((to) => ({
        from: RESEND_FROM,
        to: [to],
        subject: SUBJECT,
        html: HTML,
        text: TEXT,
      })), { batchValidation: 'permissive' });
      if (error) throw new Error(`${error.name || 'ResendError'} (${error.statusCode ?? 'unknown'}): ${error.message}`);

      const results = data?.data || [];
      const rejected = data?.errors || [];
      queued += results.length;
      let fallbackQueued = 0;
      if (rejected.length) {
        const rejectedEmails = rejected.map((item) => chunk[item.index]).filter(Boolean);
        for (const item of rejected) log(`Rejected ${chunk[item.index] || `batch index ${item.index}`}: ${item.message}`);
        const fallback = await sendWithSMTP(rejectedEmails);
        queued += fallback.queued;
        fallbackQueued = fallback.queued;
        failed += fallback.failed.length;
        if (fallback.failed.length) {
          fs.appendFileSync('/tmp/course-request-broadcast-failures.txt', `${fallback.failed.join('\n')}\n`);
        }
      }
      log(`Batch ${Math.floor(i / batchSize) + 1}: Resend accepted ${results.length}, SMTP fallback accepted ${fallbackQueued}; total ${queued}/${emails.length}`);
      if (i === 0 && queued === 0) {
        log('PAUSED: initial Resend batch had zero successful sends; no further batches attempted.');
        break;
      }
    } catch (error) {
      log(`Batch failed at offset ${i}: ${(error as Error).message}`);
      if (i === 0 && queued === 0) {
        failed += chunk.length;
        fs.appendFileSync('/tmp/course-request-broadcast-failures.txt', `${chunk.join('\n')}\n`);
        log('PAUSED: initial Resend batch had zero successful sends; no further batches attempted.');
        break;
      }
      const fallback = await sendWithSMTP(chunk);
      queued += fallback.queued;
      failed += fallback.failed.length;
      if (fallback.failed.length) {
        fs.appendFileSync('/tmp/course-request-broadcast-failures.txt', `${fallback.failed.join('\n')}\n`);
      }
      log(`SMTP fallback for batch ${Math.floor(i / batchSize) + 1}: queued ${fallback.queued}, failed ${fallback.failed.length}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
  log(`DONE queued=${queued} failed=${failed} total=${emails.length}`);
  await mongoose.disconnect();
  if (failed > 0) process.exit(1);
}

main().catch((error) => {
  log(`FATAL ${error.stack || error.message}`);
  process.exit(1);
});
