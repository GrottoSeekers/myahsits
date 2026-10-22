// "You're on the list" — the email sent when someone registers interest
// before launch. Built to the brand kit's email spec: 600px, one column,
// forest bar at the top with the cream mark as a 64px PNG, Marcellus for
// headings, Montserrat for copy, Lato for labels, plain calm voice.

const SITE = 'https://www.myahsits.com';
const IMG = SITE + '/images/email';

export type Role = 'sitter' | 'owner' | 'both' | '';

const esc = (s: unknown) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));

const F_HEAD = "'Marcellus',Georgia,'Times New Roman',serif";
const F_BODY = "'Montserrat','Helvetica Neue',Arial,sans-serif";
const F_LABEL = "'Lato','Helvetica Neue',Arial,sans-serif";

export const steps: Record<'sitter' | 'owner' | 'both', [string, string][]> = {
  sitter: [
    ['We email you once, on launch day', 'One email when MYAH opens. Nothing in between.'],
    ['Create your free sitter page', 'Your photos, the pets you have looked after and your reviews, on one page you can share anywhere.'],
    ['Get ID checked, then apply', 'Send a photo ID and a selfie. We check every one ourselves, then you can apply for sits.'],
  ],
  owner: [
    ['We email you once, on launch day', 'One email when MYAH opens. Nothing in between.'],
    ['Post your sit for free', 'Your dates, your home and your pets’ routines, in a few minutes.'],
    ['Choose an ID-checked sitter', 'Every sitter sends a photo ID and a selfie, and we check every one ourselves. Read their reviews and pick who you trust.'],
  ],
  both: [
    ['We email you once, on launch day', 'One email when MYAH opens. Nothing in between.'],
    ['Create your free profile', 'A sitter page to share, and your home ready to post when you go away.'],
    ['Get ID checked', 'Send a photo ID and a selfie. We check every one ourselves, so everyone you meet is who they say they are.'],
  ],
};

export const prep: Record<'sitter' | 'owner' | 'both', { title: string; items: string[] }> = {
  sitter: {
    title: 'To be ready on day one',
    items: ['A few daylight photos of you with animals', 'Reviews from any other sitting sites, to add to your page', 'The dates you are free over the next few months'],
  },
  owner: {
    title: 'To be ready on day one',
    items: ['The dates you are away', 'Your pets’ feeding and walking routine', 'Your vet’s name and number, for the sit pack'],
  },
  both: {
    title: 'To be ready on day one',
    items: ['A few daylight photos of you with animals', 'Reviews from any other sitting sites', 'Your pets’ routine and vet details, for when you go away'],
  },
};

export function welcomeEmail(role: Role, position?: number) {
  const r: 'sitter' | 'owner' | 'both' = role === 'sitter' || role === 'owner' ? role : 'both';
  const lead = r === 'sitter'
    ? 'MYAH is one place for house and pet sitters to show who they are, find sits and arrange them, with every member ID checked.'
    : r === 'owner'
      ? 'MYAH is one place to find a sitter you would hand your keys to: ID-checked sitters, real reviews, and your home’s details kept private until the day before.'
      : 'MYAH brings house and pet sitters and home owners together in one place, with every member ID checked and private details kept private.';
  const early = position && position > 0 && position <= 1000
    ? `You are one of the first ${Math.ceil(position / 50) * 50} people to join us.`
    : 'You are one of the first people to join us.';

  const stepRows = steps[r].map(([t, d], i) => `
            <tr>
              <td width="44" valign="top" style="padding:0 0 18px">
                <div style="width:32px;height:32px;border-radius:50%;background:#f3ece0;color:#2f5d45;font-family:${F_BODY};font-weight:600;font-size:14px;line-height:32px;text-align:center">${i + 1}</div>
              </td>
              <td valign="top" style="padding:3px 0 18px">
                <p style="margin:0 0 4px;font-family:${F_BODY};font-weight:600;font-size:15px;line-height:1.5;color:#2c1a0e">${t}</p>
                <p style="margin:0;font-family:${F_BODY};font-size:14px;line-height:1.7;color:#6b4e35">${d}</p>
              </td>
            </tr>`).join('');

  const prepRows = prep[r].items.map((it) => `
                <tr><td width="22" valign="top" style="padding:0 0 8px;font-family:${F_BODY};font-size:14px;line-height:1.6;color:#2f5d45">&#10003;</td><td style="padding:0 0 8px;font-family:${F_BODY};font-size:14px;line-height:1.6;color:#4a3726">${it}</td></tr>`).join('');

  const subject = 'You’re on the list for MYAH';
  const preheader = 'Thank you for joining us early. Here is what happens next.';

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="color-scheme" content="light" />
<meta name="supported-color-schemes" content="light" />
<title>${subject}</title>
<link href="https://fonts.googleapis.com/css2?family=Marcellus&family=Montserrat:wght@400;500;600&family=Lato:wght@400;700&display=swap" rel="stylesheet" />
<style>
  @media (max-width:620px) {
    .wrap { width:100% !important; }
    .px { padding-left:24px !important; padding-right:24px !important; }
    .h1 { font-size:28px !important; }
    .hero img { height:auto !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:#faf6ee">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:#faf6ee">${preheader}&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#faf6ee">
  <tr><td align="center" style="padding:24px 12px">
    <table role="presentation" class="wrap" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;background:#ffffff;border:1px solid #e3d8c8;border-radius:14px;overflow:hidden">

      <!-- Forest bar -->
      <tr><td style="background:#2f5d45;padding:20px 32px" class="px">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
          <td valign="middle"><img src="${IMG}/mark-cream-64.png" width="32" height="32" alt="MYAH" style="display:block;border:0" /></td>
          <td valign="middle" style="padding-left:12px;font-family:${F_BODY};font-weight:500;font-size:14px;letter-spacing:.28em;color:#f5efe4">MYAH</td>
        </tr></table>
      </td></tr>

      <!-- Photo -->
      <tr><td class="hero"><img src="${IMG}/hero-beach.jpg" width="600" height="320" alt="A springer spaniel resting on the sand by the sea" style="display:block;width:100%;max-width:600px;height:320px;object-fit:cover;border:0" /></td></tr>

      <!-- Welcome -->
      <tr><td class="px" style="padding:36px 48px 8px">
        <p style="margin:0 0 12px;font-family:${F_LABEL};font-weight:700;font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:#8a6a4f">You’re on the list</p>
        <h1 class="h1" style="margin:0 0 16px;font-family:${F_HEAD};font-weight:400;font-size:32px;line-height:1.2;color:#2c1a0e">Thank you for joining us early</h1>
        <p style="margin:0 0 14px;font-family:${F_BODY};font-size:15px;line-height:1.8;color:#6b4e35">${lead}</p>
        <p style="margin:0;font-family:${F_BODY};font-size:15px;line-height:1.8;color:#6b4e35">${early} We will email you the day MYAH opens.</p>
      </td></tr>

      <!-- Divider -->
      <tr><td class="px" style="padding:28px 48px 0"><div style="height:1px;background:#efe7da;line-height:1px;font-size:0">&nbsp;</div></td></tr>

      <!-- Next steps -->
      <tr><td class="px" style="padding:28px 48px 10px">
        <p style="margin:0 0 6px;font-family:${F_LABEL};font-weight:700;font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:#8a6a4f">What happens next</p>
        <h2 style="margin:0 0 22px;font-family:${F_HEAD};font-weight:400;font-size:22px;line-height:1.3;color:#2c1a0e">Three steps, all free</h2>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${stepRows}
        </table>
      </td></tr>

      <!-- Get ready -->
      <tr><td class="px" style="padding:4px 48px 30px">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#faf6ee;border:1px solid #efe7da;border-radius:12px">
          <tr><td style="padding:22px 24px 14px">
            <p style="margin:0 0 12px;font-family:${F_BODY};font-weight:600;font-size:15px;color:#2c1a0e">${prep[r].title}</p>
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">${prepRows}
            </table>
          </td></tr>
        </table>
      </td></tr>

      <!-- Button -->
      <tr><td class="px" align="left" style="padding:0 48px 36px">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
          <td style="border-radius:999px;background:#2f5d45"><a href="${SITE}/" style="display:inline-block;padding:14px 28px;font-family:${F_BODY};font-weight:600;font-size:14px;color:#ffffff;text-decoration:none;border-radius:999px">See what’s coming</a></td>
        </tr></table>
      </td></tr>

      <!-- Founders note -->
      <tr><td class="px" style="padding:0 48px 36px">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid #efe7da">
          <tr>
            <td width="76" valign="top" style="padding:26px 0 0"><img src="${IMG}/founders-240.jpg" width="60" height="60" alt="Callum and Niamh" style="display:block;width:60px;height:60px;border-radius:50%;border:0" /></td>
            <td valign="top" style="padding:26px 0 0">
              <p style="margin:0 0 10px;font-family:${F_BODY};font-size:14px;line-height:1.75;color:#4a3726">We are house and pet sitters ourselves. We built MYAH to be the place we wanted when we started: simple, safe, and fair to both sides. If you have a question, reply to this email. It comes straight to us.</p>
              <p style="margin:0;font-family:${F_BODY};font-weight:600;font-size:14px;color:#2c1a0e">Callum &amp; Niamh</p>
              <p style="margin:2px 0 10px;font-family:${F_LABEL};font-weight:700;font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:#2f5d45">Founders, MYAH</p>
              <a href="${SITE}/callumandniamh" style="font-family:${F_BODY};font-weight:600;font-size:13px;color:#2f5d45;text-decoration:underline">See our sitter page</a>
            </td>
          </tr>
        </table>
      </td></tr>

      <!-- Footer -->
      <tr><td class="px" style="background:#faf6ee;border-top:1px solid #efe7da;padding:20px 48px">
        <p style="margin:0 0 6px;font-family:${F_LABEL};font-size:12px;color:#8a6a4f">MYAH &middot; Make Yourself At Home &middot; <a href="${SITE}/" style="color:#8a6a4f;text-decoration:underline">myahsits.com</a></p>
        <p style="margin:0;font-family:${F_LABEL};font-size:12px;line-height:1.6;color:#8a6a4f">You are getting this because you registered your interest at myahsits.com. To be taken off the list, reply with “remove”. <a href="${SITE}/privacy" style="color:#8a6a4f;text-decoration:underline">Privacy</a></p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;

  const text = [
    'You’re on the list for MYAH',
    '',
    'Thank you for joining us early.',
    '',
    lead,
    `${early} We will email you the day MYAH opens.`,
    '',
    'What happens next',
    ...steps[r].map(([t, d], i) => `${i + 1}. ${t}. ${d}`),
    '',
    prep[r].title + ':',
    ...prep[r].items.map((it) => '- ' + it),
    '',
    'See what’s coming: ' + SITE + '/',
    '',
    'We are house and pet sitters ourselves. If you have a question, reply to this email. It comes straight to us.',
    'Callum & Niamh, founders of MYAH',
    SITE + '/callumandniamh',
    '',
    'To be taken off the list, reply with “remove”.',
  ].join('\n');

  return { subject, html, text, preheader: esc(preheader) };
}
