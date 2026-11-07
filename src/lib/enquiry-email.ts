// The email a sitter gets when someone sends the booking form on their page
// (owner, 5 Nov 2026: "more aesthetically pleasing and on brand"). Built to the
// same spec as welcome-email.ts: 600px, one column, forest bar with the cream
// mark, Marcellus headings, Montserrat copy, Lato labels, paper background.
// Photos show in the email itself (inline attachments, "cid:").

export const SITE = 'https://www.myahsits.com';
export const IMG = SITE + '/images/email';
export const F_HEAD = "'Marcellus',Georgia,'Times New Roman',serif";
export const F_BODY = "'Montserrat','Helvetica Neue',Arial,sans-serif";
export const F_LABEL = "'Lato','Helvetica Neue',Arial,sans-serif";
export const C = { ink: '#2c1a0e', soft: '#6b4e35', tan: '#8a6a4f', forest: '#2f5d45', paper: '#faf6ee', cream: '#f3ece0', line: '#efe7da' };

export const esc = (s: unknown) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
export const br = (s: string) => esc(s).replace(/\n/g, '<br>');

export interface EnquiryPhoto { cid: string; kind: 'pet' | 'home' }
export interface Enquiry {
  sitterName: string;
  firstName: string; lastName?: string; email: string; phone?: string;
  dateFrom?: string; dateTo?: string;
  city?: string; suburb?: string; homeType?: string; about?: string;
  message?: string;
  photos: EnquiryPhoto[];
}

// "2026-11-12" -> "Thu 12 Nov 2026"
export const day = (iso?: string) => {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso || '';
  return new Date(iso + 'T00:00:00Z').toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).replace(/,/g, '');
};

// Pull the quote apart, if the message came from the price builder.
export function readQuote(message = '') {
  const lines = message.split(/\r?\n/);
  const q = { total: '', length: '', when: '', charges: [] as [string, string][], facts: [] as [string, string][], extra: '', isQuote: false };
  const m = /^From the price builder: about (\$[\d,.]+ \w+)(?: (?:for|a) (.+?))?\.$/.exec(lines[0] || '');
  if (!m) return q;
  q.isQuote = true; q.total = m[1]; q.length = m[2] ? (m[2] === 'day' ? 'a day' : m[2]) : '';
  let i = 1;
  for (; i < lines.length; i++) {
    const l = lines[i].trim();
    if (/^Anything else about my pets or home:/.test(l)) { q.extra = [l.replace(/^Anything else about my pets or home:\s*/, ''), ...lines.slice(i + 1)].join('\n').trim(); break; }
    if (!l) continue;
    if (/^Arrive /.test(l)) { q.when = l; continue; }
    if (l.startsWith('- ')) { const k = l.lastIndexOf(': '); q.charges.push(k > 0 ? [l.slice(2, k), l.slice(k + 2)] : [l.slice(2), '']); continue; }
    const k = l.indexOf(': ');
    if (k > 0) q.facts.push([l.slice(0, k), l.slice(k + 2).replace(/\.$/, '')]);
    else q.extra += (q.extra ? '\n' : '') + l;
  }
  return q;
}

export const label = (t: string) => `<p style="margin:0 0 10px;font-family:${F_LABEL};font-weight:700;font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:${C.tan}">${t}</p>`;
export const section = (inner: string, pad = '26px 40px 0') => `<tr><td class="px" style="padding:${pad}">${inner}</td></tr>`;
// Label on the left, value on the right; a hairline between rows (not after the last).
export const rows = (pairs: [string, string][], strongRight = false) => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${pairs.map(([k, v], i) => {
  const line = i < pairs.length - 1 ? `border-bottom:1px solid ${C.line};` : '';
  return `
  <tr><td valign="top" style="padding:9px 12px 9px 0;${line}font-family:${F_BODY};font-size:14px;line-height:1.5;color:${C.soft};white-space:nowrap">${esc(k)}</td>
  <td valign="top" align="right" style="padding:9px 0;${line}font-family:${F_BODY};font-size:14px;line-height:1.5;color:${C.ink};${strongRight ? 'font-weight:600;white-space:nowrap' : ''}">${esc(v)}</td></tr>`;
}).join('')}</table>`;
export const button = (href: string, text: string, solid: boolean) => `<td style="padding:0 8px 8px 0"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td style="border-radius:999px;${solid ? `background:${C.forest}` : `border:1.5px solid ${C.forest}`}"><a href="${esc(href)}" style="display:inline-block;padding:${solid ? '12px 22px' : '10.5px 20px'};font-family:${F_BODY};font-weight:600;font-size:13px;color:${solid ? '#ffffff' : C.forest};text-decoration:none;border-radius:999px">${text}</a></td></tr></table></td>`;

export function enquiryEmail(e: Enquiry) {
  const name = [e.firstName, e.lastName].filter(Boolean).join(' ');
  const where = [e.suburb, e.city].filter(Boolean).join(', ');
  const q = readQuote(e.message);
  const dates = e.dateFrom && e.dateTo ? `${day(e.dateFrom)} to ${day(e.dateTo)}` : '';
  const subject = `New enquiry from ${name}${e.city ? ' · ' + e.city : ''}`;
  const preheader = [q.total && `About ${q.total}`, dates, e.homeType && where ? `${e.homeType} in ${where}` : where].filter(Boolean).join(' · ');
  const phoneDigits = String(e.phone || '').replace(/[^\d+]/g, '');
  const replySubject = encodeURIComponent(`Your sit with ${e.sitterName}`);

  // Header card: who, when, where, and the quote total.
  const head = `
    ${label('New enquiry' + (e.city ? ' · ' + esc(e.city) : ''))}
    <h1 class="h1" style="margin:0 0 6px;font-family:${F_HEAD};font-weight:400;font-size:32px;line-height:1.2;color:${C.ink}">${esc(name)}</h1>
    ${dates ? `<p style="margin:0 0 4px;font-family:${F_BODY};font-size:15px;line-height:1.6;color:${C.soft}">${esc(dates)}</p>` : ''}
    ${where || e.homeType ? `<p style="margin:0;font-family:${F_BODY};font-size:15px;line-height:1.6;color:${C.soft}">${esc([e.homeType, where && 'in ' + where].filter(Boolean).join(' '))}</p>` : ''}
    ${q.total ? `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:22px 0 0;background:${C.ink};border-radius:14px">
      <tr><td style="padding:20px 24px">
        <p style="margin:0 0 4px;font-family:${F_LABEL};font-weight:700;font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:#c4ab8a">Their quote</p>
        <p style="margin:0;font-family:${F_HEAD};font-size:34px;line-height:1.1;color:#ffffff">${esc(q.total.split(' ')[0])} <span style="font-family:${F_BODY};font-size:14px;color:rgba(255,255,255,.7)">${esc(q.total.split(' ').slice(1).join(' '))}${q.length ? ' · ' + esc(q.length) : ''}</span></p>
        ${q.when ? `<p style="margin:8px 0 0;font-family:${F_BODY};font-size:13px;line-height:1.6;color:rgba(255,255,255,.75)">${esc(q.when)}</p>` : ''}
      </td></tr>
    </table>` : ''}
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0 0"><tr>
      ${button(`mailto:${e.email}?subject=${replySubject}`, `Reply to ${esc(e.firstName)}`, true)}
      ${phoneDigits ? button(`tel:${phoneDigits}`, 'Call', false) : ''}
      ${phoneDigits ? button(`sms:${phoneDigits}`, 'Text', false) : ''}
    </tr></table>`;

  const contact = rows([['Email', e.email], ...(e.phone ? [['Phone', e.phone] as [string, string]] : [])]);

  const quoteBlock = q.isQuote ? `
    ${label('The quote, line by line')}
    ${rows(q.charges, true)}
    ${q.facts.length ? `<div style="height:14px;line-height:14px;font-size:0">&nbsp;</div>${rows(q.facts)}` : ''}` : '';

  const notes = q.isQuote ? q.extra : (e.message || '');
  const notesBlock = notes ? `
    ${label(q.isQuote ? 'About their pets and home' : 'Their message')}
    <p style="margin:0;font-family:${F_BODY};font-size:15px;line-height:1.75;color:${C.ink}">${br(notes)}</p>` : '';

  const aboutBlock = e.about ? `
    ${label('About ' + esc(e.firstName))}
    <p style="margin:0;font-family:${F_BODY};font-size:15px;line-height:1.75;color:${C.ink}">${br(e.about)}</p>` : '';

  const photoGrid = (kind: 'pet' | 'home', title: string) => {
    const list = e.photos.filter((p) => p.kind === kind);
    if (!list.length) return '';
    const cells = list.map((p) => `<td class="ph" width="50%" valign="top" style="padding:0 6px 12px"><img src="cid:${esc(p.cid)}" width="248" alt="${kind === 'pet' ? 'Their pet' : 'Their home'}" style="display:block;width:100%;max-width:248px;height:auto;border-radius:10px;border:0" /></td>`);
    const trs: string[] = [];
    for (let i = 0; i < cells.length; i += 2) trs.push(`<tr>${cells[i]}${cells[i + 1] || '<td width="50%"></td>'}</tr>`);
    return `${label(title)}<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 -6px">${trs.join('')}</table>`;
  };
  const photos = photoGrid('pet', 'Their pets') + photoGrid('home', 'Their home');

  const divider = `<tr><td class="px" style="padding:26px 40px 0"><div style="height:1px;background:${C.line};line-height:1px;font-size:0">&nbsp;</div></td></tr>`;
  const blocks = [contact && section(label('Contact') + contact), quoteBlock && section(quoteBlock), notesBlock && section(notesBlock), aboutBlock && section(aboutBlock), photos && section(photos)].filter(Boolean);

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="color-scheme" content="light" />
<meta name="supported-color-schemes" content="light" />
<meta name="format-detection" content="telephone=no,date=no,address=no,email=no" />
<title>${esc(subject)}</title>
<link href="https://fonts.googleapis.com/css2?family=Marcellus&family=Montserrat:wght@400;500;600&family=Lato:wght@400;700&display=swap" rel="stylesheet" />
<style>
  a[x-apple-data-detectors] { color:inherit !important; text-decoration:none !important; font:inherit !important; }
  @media (max-width:620px) {
    .wrap { width:100% !important; }
    .px { padding-left:22px !important; padding-right:22px !important; }
    .h1 { font-size:27px !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:${C.paper}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${C.paper}">${esc(preheader)}&#8199;&#65279;&#847;&#8199;&#65279;&#847;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.paper}">
  <tr><td align="center" style="padding:24px 12px">
    <table role="presentation" class="wrap" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;background:#ffffff;border:1px solid #e3d8c8;border-radius:14px;overflow:hidden">
      <tr><td style="background:${C.forest};padding:18px 40px" class="px">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
          <td valign="middle" width="40"><img src="${IMG}/mark-cream-64.png" width="30" height="30" alt="MYAH" style="display:block;border:0" /></td>
          <td valign="middle" style="font-family:${F_BODY};font-weight:500;font-size:14px;letter-spacing:.28em;color:#f5efe4">MYAH</td>
          <td valign="middle" align="right" style="font-family:${F_LABEL};font-weight:700;font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:#c9dccf">Booking request</td>
        </tr></table>
      </td></tr>
      ${section(head, '32px 40px 0')}
      ${blocks.map((b, i) => (i ? divider : '') + b).join('')}
      <tr><td class="px" style="padding:30px 40px 0"></td></tr>
      <tr><td class="px" style="background:${C.paper};border-top:1px solid ${C.line};padding:18px 40px">
        <p style="margin:0 0 6px;font-family:${F_LABEL};font-size:12px;line-height:1.6;color:${C.tan}">Sent from the booking form on your MYAH page. Reply to this email and it goes straight to ${esc(e.firstName)}.</p>
        <p style="margin:0;font-family:${F_LABEL};font-size:12px;line-height:1.6;color:${C.tan}">Their suburb and photos are for you only. Keep them off social posts.</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
  return { subject, html };
}
