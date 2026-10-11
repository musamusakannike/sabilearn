const HOME_URL = 'https://sabilearn.online';
const LOGO_URL = 'https://pub-25cf731b17e245559cf292c270f8e8a1.r2.dev/assets/sabilearn-logo.png';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function bannerBlock(bannerUrl?: string, alt = 'Course'): string {
  if (!bannerUrl) return '';
  return `
          <tr>
            <td style="padding: 0 32px 20px 32px;">
              <img src="${escapeHtml(bannerUrl)}" alt="${escapeHtml(alt)}" width="496" style="display: block; width: 100%; max-width: 496px; height: auto; border-radius: 12px; border: 1px solid #E5E1D8;" />
            </td>
          </tr>`;
}

function wrapEmail({
  title,
  preheader,
  bannerUrl,
  bannerAlt,
  bodyHtml,
}: {
  title: string;
  preheader: string;
  bannerUrl?: string;
  bannerAlt?: string;
  bodyHtml: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${escapeHtml(title)}</title>
  <style type="text/css">
    @media only screen and (max-width: 600px) {
      .email-wrapper { padding: 16px 8px !important; }
      .email-card { width: 100% !important; border-radius: 16px !important; }
      .email-header { padding: 24px 20px 16px 20px !important; }
      .email-body { padding: 0 20px 28px 20px !important; }
      .cta-btn { display: block !important; width: 100% !important; text-align: center !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #FAF9F7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #35354A;">
  <div style="display: none; font-size: 1px; color: #FAF9F7; line-height: 1px; max-height: 0; max-width: 0; opacity: 0; overflow: hidden;">
    ${escapeHtml(preheader)}
    &#847; &zwnj; &nbsp; &#8199; &shy;
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="email-wrapper" style="background-color: #FAF9F7; margin: 0; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" class="email-card" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width: 560px; width: 100%; background-color: #FFFFFF; border-radius: 20px; border: 1px solid #E5E1D8; overflow: hidden;">
          <tr>
            <td height="4" style="background-color: #F2A900; font-size: 0; line-height: 0;">&nbsp;</td>
          </tr>
          <tr>
            <td class="email-header" style="padding: 32px 32px 20px 32px; text-align: center;">
              <a href="${HOME_URL}" target="_blank" style="text-decoration: none; display: inline-block;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
                  <tr>
                    <td style="vertical-align: middle;">
                      <img src="${LOGO_URL}" alt="SabiLearn" width="30" height="30" style="display: block; width: 30px; height: 30px; border-radius: 6px; margin-right: 8px;" />
                    </td>
                    <td style="vertical-align: middle;">
                      <span style="font-size: 20px; font-weight: 800; color: #0E0E1A; letter-spacing: -0.4px;">
                        Sabi<span style="color: #F2A900;">Learn</span>
                      </span>
                    </td>
                  </tr>
                </table>
              </a>
            </td>
          </tr>
          ${bannerBlock(bannerUrl, bannerAlt)}
          <tr>
            <td class="email-body" style="padding: 0 32px 32px 32px;">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td height="1" style="background-color: #EAE6DF; font-size: 0; line-height: 0;">&nbsp;</td>
          </tr>
          <tr>
            <td style="padding: 20px 32px; background-color: #FAF9F7; text-align: center;">
              <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 600; color: #0E0E1A;">
                SabiLearn &mdash; Learn a skill. Sabi it for life.
              </p>
              <p style="margin: 0 0 10px 0; font-size: 12px; color: #8C8C9E;">
                <a href="${HOME_URL}" target="_blank" style="color: #6B6B80; text-decoration: none;">sabilearn.online</a>
              </p>
              <p style="margin: 0; font-size: 11px; color: #B0AFC0;">
                &copy; 2026 SabiLearn. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function ctaButton(href: string, label: string): string {
  return `
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin: 24px auto 0 auto;">
                <tr>
                  <td align="center" bgcolor="#F2A900" style="border-radius: 12px;">
                    <a class="cta-btn" href="${escapeHtml(href)}" target="_blank" style="display: inline-block; padding: 14px 28px; font-size: 15px; font-weight: 700; color: #0E0E1A; text-decoration: none; border-radius: 12px;">
                      ${escapeHtml(label)}
                    </a>
                  </td>
                </tr>
              </table>`;
}

export function incompleteFirstTopicHtml(props: {
  name: string;
  courseTitle: string;
  topicTitle: string;
  bannerUrl?: string;
  learnUrl: string;
}): string {
  const name = escapeHtml(props.name);
  const courseTitle = escapeHtml(props.courseTitle);
  const topicTitle = escapeHtml(props.topicTitle);
  return wrapEmail({
    title: `Still interested in ${props.topicTitle}?`,
    preheader: `You started ${props.topicTitle} in ${props.courseTitle}. Finish it when you are ready.`,
    bannerUrl: props.bannerUrl,
    bannerAlt: props.courseTitle,
    bodyHtml: `
              <p style="margin: 0 0 12px 0; font-size: 16px; color: #35354A;">Hi ${name},</p>
              <h1 style="margin: 0 0 12px 0; font-size: 22px; line-height: 1.3; color: #0E0E1A; font-weight: 800;">
                Want to finish “${topicTitle}”?
              </h1>
              <p style="margin: 0 0 8px 0; font-size: 15px; line-height: 1.6; color: #35354A;">
                You opened the first lesson in <strong>${courseTitle}</strong> and left it mid-way. If you are still interested, it is waiting for you — pick it up whenever you have a few minutes.
              </p>
              ${ctaButton(props.learnUrl, 'Continue the lesson')}
    `,
  });
}

export function incompleteFirstTopicText(props: {
  name: string;
  courseTitle: string;
  topicTitle: string;
  learnUrl: string;
}): string {
  return `Hi ${props.name},

You opened “${props.topicTitle}” in ${props.courseTitle} and have not finished it yet. If you still want to, you can pick it up here:

${props.learnUrl}

SabiLearn — Learn a skill. Sabi it for life.
${HOME_URL}`;
}

export function streakRiskHtml(props: {
  name: string;
  streak: number;
  courseTitle?: string;
  bannerUrl?: string;
  learnUrl: string;
}): string {
  const name = escapeHtml(props.name);
  const courseLine = props.courseTitle
    ? ` A short session in <strong>${escapeHtml(props.courseTitle)}</strong> today keeps it going.`
    : ' Finish a topic today and it stays intact.';
  return wrapEmail({
    title: `Your ${props.streak}-day streak is open until tonight`,
    preheader: `Complete a topic today to keep your ${props.streak}-day streak.`,
    bannerUrl: props.bannerUrl,
    bannerAlt: props.courseTitle,
    bodyHtml: `
              <p style="margin: 0 0 12px 0; font-size: 16px; color: #35354A;">Hi ${name},</p>
              <h1 style="margin: 0 0 12px 0; font-size: 22px; line-height: 1.3; color: #0E0E1A; font-weight: 800;">
                Your ${props.streak}-day streak is open until tonight
              </h1>
              <p style="margin: 0 0 8px 0; font-size: 15px; line-height: 1.6; color: #35354A;">
                You have not marked a study session yet today.${courseLine}
              </p>
              ${ctaButton(props.learnUrl, 'Keep the streak')}
    `,
  });
}

export function streakRiskText(props: {
  name: string;
  streak: number;
  courseTitle?: string;
  learnUrl: string;
}): string {
  const courseLine = props.courseTitle
    ? ` Continue ${props.courseTitle} here: ${props.learnUrl}`
    : ` Continue here: ${props.learnUrl}`;
  return `Hi ${props.name},

Your ${props.streak}-day streak stays alive if you complete a topic today.${courseLine}

SabiLearn — Learn a skill. Sabi it for life.
${HOME_URL}`;
}

export function weeklyProgressHtml(props: {
  name: string;
  streak: number;
  topicsCompleted: number;
  sessions: number;
  courseTitle?: string;
  bannerUrl?: string;
  learnUrl: string;
}): string {
  const name = escapeHtml(props.name);
  const courseBit = props.courseTitle
    ? ` Next up: <strong>${escapeHtml(props.courseTitle)}</strong>.`
    : '';
  return wrapEmail({
    title: 'Your week on SabiLearn',
    preheader: `${props.topicsCompleted} topics, ${props.sessions} sessions, ${props.streak}-day streak.`,
    bannerUrl: props.bannerUrl,
    bannerAlt: props.courseTitle,
    bodyHtml: `
              <p style="margin: 0 0 12px 0; font-size: 16px; color: #35354A;">Hi ${name},</p>
              <h1 style="margin: 0 0 12px 0; font-size: 22px; line-height: 1.3; color: #0E0E1A; font-weight: 800;">
                Your week on SabiLearn
              </h1>
              <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #35354A;">
                ${props.topicsCompleted} topic${props.topicsCompleted === 1 ? '' : 's'} finished, ${props.sessions} study session${props.sessions === 1 ? '' : 's'}, and a ${props.streak}-day streak.${courseBit}
              </p>
              ${ctaButton(props.learnUrl, 'Continue learning')}
    `,
  });
}

export function weeklyProgressText(props: {
  name: string;
  streak: number;
  topicsCompleted: number;
  sessions: number;
  courseTitle?: string;
  learnUrl: string;
}): string {
  const courseBit = props.courseTitle ? ` Next: ${props.courseTitle}.` : '';
  return `Hi ${props.name},

This week: ${props.topicsCompleted} topics, ${props.sessions} sessions, ${props.streak}-day streak.${courseBit}

${props.learnUrl}

SabiLearn — Learn a skill. Sabi it for life.
${HOME_URL}`;
}

export const SITE_HOME = HOME_URL;
export const LEARN_URL = (courseId: string, topicId: string) =>
  `${HOME_URL}/dashboard/courses/${courseId}/topics/${topicId}/learn`;
export const DASHBOARD_URL = `${HOME_URL}/dashboard`;
