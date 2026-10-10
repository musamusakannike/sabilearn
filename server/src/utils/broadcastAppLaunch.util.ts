import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import mongoose from 'mongoose';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const API_KEY = process.env.RESEND_API_KEY;
const FROM = process.env.EMAIL_FROM || 'SabiLearn <noreply@contact.sabilearn.online>';
const HTML_PATH = '/tmp/app-launch-email.html';
const LOG = '/tmp/app-launch-broadcast.log';
const SUBJECT = 'SabiLearn is now on Play Store and App Store';
const BATCH = 100;
const TEXT = `The SabiLearn app is officially live on Google Play and the App Store.

Google Play: https://play.google.com/store/apps/details?id=com.codiac.sabilearn
App Store: https://apps.apple.com/us/app/sabilearn/id6800027018

Sign in with your existing account. Your progress, streaks and courses are already there.

Learn a skill. Sabi it for life.
SabiLearn`;

function log(msg: string) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(LOG, `${line}\n`);
}

async function sendBatch(items: unknown[], attempt = 1): Promise<{ data?: unknown[] }> {
  const res = await fetch('https://api.resend.com/emails/batch', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(items),
  });
  const body = await res.text();
  if (res.status === 429 && attempt < 6) {
    const wait = attempt * 2000;
    log(`429 rate limit, retrying in ${wait}ms (attempt ${attempt})`);
    await new Promise((r) => setTimeout(r, wait));
    return sendBatch(items, attempt + 1);
  }
  if (!res.ok) {
    throw new Error(`Resend ${res.status}: ${body.slice(0, 800)}`);
  }
  return JSON.parse(body) as { data?: unknown[] };
}

async function main() {
  if (!API_KEY) throw new Error('RESEND_API_KEY missing');
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI missing');
  const html = fs.readFileSync(HTML_PATH, 'utf8');
  fs.writeFileSync(LOG, '');
  log(`From: ${FROM}`);

  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  if (!db) throw new Error('No db');

  const users = await db.collection('users').find(
    {
      $or: [
        { 'settings.emailNotifications': true },
        { 'settings.emailNotifications': { $exists: false } },
      ],
    },
    { projection: { email: 1 } },
  ).toArray();

  const blocked = new Set(['example.com', 'test.com', 'localhost']);
  const emails = [...new Set(
    users
      .map((u) => String(u.email || '').trim().toLowerCase())
      .filter((e) => {
        const domain = e.split('@')[1] || '';
        return e.includes('@') && !blocked.has(domain);
      }),
  )];

  log(`Eligible unique emails: ${emails.length} (from ${users.length} user docs)`);

  let sent = 0;
  let failed = 0;
  for (let i = 0; i < emails.length; i += BATCH) {
    const chunk = emails.slice(i, i + BATCH);
    const payload = chunk.map((to) => ({
      from: FROM,
      to: [to],
      subject: SUBJECT,
      html,
      text: TEXT,
    }));
    try {
      const result = await sendBatch(payload);
      const ids = Array.isArray(result?.data) ? result.data.length : chunk.length;
      sent += chunk.length;
      log(`Batch ${Math.floor(i / BATCH) + 1}: queued ${ids}/${chunk.length} (total ${sent}/${emails.length})`);
    } catch (err) {
      failed += chunk.length;
      log(`Batch failed at offset ${i}: ${(err as Error).message}`);
      fs.appendFileSync('/tmp/app-launch-broadcast-failures.txt', `${chunk.join('\n')}\n`);
    }
    await new Promise((r) => setTimeout(r, 400));
  }

  log(`DONE sent=${sent} failed=${failed} total=${emails.length}`);
  await mongoose.disconnect();
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  log(`FATAL ${err.stack || err.message}`);
  process.exit(1);
});
