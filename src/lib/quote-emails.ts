// Emails to an owner who asked for their quote on a sitter's page (owner,
// 7 Nov 2026): 1) their quote, straight away; 2) one reminder about two days
// later if they ticked the box and haven't sent a request. Same design as
// enquiry-email.ts. Every email says why it was sent and has an unsubscribe
// link (Australian Spam Act / UK PECR).

import { SITE, IMG, F_HEAD, F_BODY, F_LABEL, C, esc, day, readQuote, label, section, rows, button } from './enquiry-email';

export interface SavedQuote {
  sitterName: string;      // "Callum & Niamh"
  pageUrl: string;         // https://www.myahsits.com/callumandniamh
  resumeUrl: string;       // the page with their choices filled in
  unsubscribeUrl: string;
  firstName?: string;
  summary: string;         // the quote text from the builder
  dateFrom?: string; dateTo?: string;
}

// "Sun 10 Jan to Sun 17 Jan": no year, so the heading stays short.
const noYear = (iso?: string) => day(iso).replace(/ \d{4}$/, '');
const dates = (q: SavedQuote) => (q.dateFrom && q.dateTo ? `${noYear(q.dateFrom)} to ${noYear(q.dateTo)}` : '');

function shell(o: { title: string; preheader: string; tag: string; body: string; why: string; unsubscribeUrl: string }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="color-scheme" content="light" />
<meta name="supported-color-schemes" content="light" />
<meta name="format-detection" content="telephone=no,date=no,address=no,email=no" />
<title>${esc(o.title)}</title>
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
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${C.paper}">${esc(o.preheader)}&#8199;&#65279;&#847;&#8199;&#65279;&#847;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.paper}">
  <tr><td align="center" style="padding:24px 12px">
    <table role="presentation" class="wrap" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;background:#ffffff;border:1px solid #e3d8c8;border-radius:14px;overflow:hidden">
      <tr><td style="background:${C.forest};padding:18px 40px" class="px">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
          <td valign="middle" width="40"><img src="${IMG}/mark-cream-64.png" width="30" height="30" alt="MYAH" style="display:block;border:0" /></td>
          <td valign="middle" style="font-family:${F_BODY};font-weight:500;font-size:14px;letter-spacing:.28em;color:#f5efe4">MYAH</td>
          <td valign="middle" align="right" style="font-family:${F_LABEL};font-weight:700;font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:#c9dccf">${esc(o.tag)}</td>
        </tr></table>
      </td></tr>
      ${o.body}
      <tr><td class="px" style="padding:30px 40px 0"></td></tr>
      <tr><td class="px" style="background:${C.paper};border-top:1px solid ${C.line};padding:18px 40px">
        <p style="margin:0 0 6px;font-family:${F_LABEL};font-size:12px;line-height:1.6;color:${C.tan}">${o.why}</p>
        <p style="margin:0;font-family:${F_LABEL};font-size:12px;line-height:1.6;color:${C.tan}">MYAH &middot; Make Yourself At Home &middot; <a href="${SITE}/" style="color:${C.tan};text-decoration:underline">myahsits.com</a> &middot; <a href="${esc(o.unsubscribeUrl)}" style="color:${C.tan};text-decoration:underline">Unsubscribe</a></p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

// The dark quote card and the line-by-line table, shared by both emails.
function quoteBlock(q: SavedQuote) {
  const r = readQuote(q.summary);
  const card = r.total ? `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:22px 0 0;background:${C.ink};border-radius:14px">
      <tr><td style="padding:20px 24px">
        <p style="margin:0 0 4px;font-family:${F_LABEL};font-weight:700;font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:#c4ab8a">Your quote</p>
        <p style="margin:0;font-family:${F_BODY};font-weight:600;font-size:32px;line-height:1.15;color:#ffffff">${esc(r.total.split(' ')[0])} <span style="font-weight:400;font-size:14px;color:rgba(255,255,255,.7)">${esc(r.total.split(' ').slice(1).join(' '))}${r.length ? ' · ' + esc(r.length) : ''}</span></p>
        ${r.when ? `<p style="margin:8px 0 0;font-family:${F_BODY};font-size:13px;line-height:1.6;color:rgba(255,255,255,.75)">${esc(r.when)}</p>` : ''}
      </td></tr>
    </table>` : '';
  const lines = r.charges.length ? `<div style="height:22px;line-height:22px;font-size:0">&nbsp;</div>${label('Line by line')}${rows(r.charges, true)}` : '';
  const facts = r.facts.length ? `<div style="height:14px;line-height:14px;font-size:0">&nbsp;</div>${rows(r.facts)}` : '';
  return { card, lines: lines + facts };
}

const cta = (href: string, text: string) => `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 0"><tr>${button(href, text, true)}</tr></table>`;
const p = (t: string, extra = '') => `<p style="margin:0 0 12px;font-family:${F_BODY};font-size:15px;line-height:1.75;color:${C.soft};${extra}">${t}</p>`;

export function quoteEmail(q: SavedQuote) {
  const d = dates(q), { card, lines } = quoteBlock(q);
  const total = readQuote(q.summary).total;
  const subject = `Your quote from ${q.sitterName}${d ? ' · ' + d : ''}`;
  const hi = q.firstName ? `Hi ${esc(q.firstName)},` : 'Hi there,';
  const body = section(`
    ${label('Your quote')}
    <h1 class="h1" style="margin:0 0 14px;font-family:${F_HEAD};font-weight:400;font-size:30px;line-height:1.2;color:${C.ink}">Here's your quote${d ? ` for ${esc(d)}` : ''}</h1>
    ${p(`${hi} thanks for pricing up your sit with us. Everything you picked is saved, so when you're ready it takes a minute to send it to us.`, 'margin-bottom:0')}
    ${card}
    ${cta(q.resumeUrl, 'Carry on booking')}
    ${p('It opens our page with your choices filled in. Add your details and a photo of your pets, then send it by email or WhatsApp.', 'margin:4px 0 0;font-size:13px')}
  `, '32px 40px 0') + section(lines) + section(`
    <div style="height:1px;background:${C.line};line-height:1px;font-size:0;margin:0 0 22px">&nbsp;</div>
    ${p(`Any questions, just reply to this email. It comes straight to us.`)}
    <p style="margin:0;font-family:${F_BODY};font-weight:600;font-size:14px;color:${C.ink}">${esc(q.sitterName)}</p>
    <a href="${esc(q.pageUrl)}" style="font-family:${F_BODY};font-weight:600;font-size:13px;color:${C.forest};text-decoration:underline">See our reviews</a>`);
  const html = shell({
    title: subject, preheader: [total && `About ${total}`, 'Your choices are saved for when you are ready.'].filter(Boolean).join(' · '),
    tag: 'Your quote', body,
    why: `You're getting this because you asked for your quote on ${esc(q.sitterName)}'s MYAH page.`,
    unsubscribeUrl: q.unsubscribeUrl,
  });
  return { subject, html };
}

export function reminderEmail(q: SavedQuote) {
  const d = dates(q), { card } = quoteBlock(q);
  const subject = d ? `Still planning ${d}? Your quote is saved` : 'Your quote is saved';
  const hi = q.firstName ? `Hi ${esc(q.firstName)},` : 'Hi there,';
  const body = section(`
    ${label('Your quote is saved')}
    <h1 class="h1" style="margin:0 0 14px;font-family:${F_HEAD};font-weight:400;font-size:30px;line-height:1.2;color:${C.ink}">Still planning your trip?</h1>
    ${p(`${hi} a couple of days ago you priced up a sit with us${d ? ` for ${esc(d)}` : ''}. Your choices are still saved, so it takes a minute to send.`)}
    ${p(`Dates book up, especially around holidays. If you'd like us, send it over and we'll reply within 24 hours.`, 'margin-bottom:0')}
    ${card}
    ${cta(q.resumeUrl, 'Carry on booking')}
    ${p("If your plans have changed, no need to reply. This is the only reminder we'll send.", 'margin:6px 0 0;font-size:13px')}
  `, '32px 40px 0') + section(`
    <div style="height:1px;background:${C.line};line-height:1px;font-size:0;margin:0 0 22px">&nbsp;</div>
    ${p('Questions first? Reply to this email. It comes straight to us.')}
    <p style="margin:0;font-family:${F_BODY};font-weight:600;font-size:14px;color:${C.ink}">${esc(q.sitterName)}</p>
    <a href="${esc(q.pageUrl)}" style="font-family:${F_BODY};font-weight:600;font-size:13px;color:${C.forest};text-decoration:underline">See our reviews</a>`);
  const html = shell({
    title: subject, preheader: 'Your choices are saved. It takes a minute to send.',
    tag: 'Reminder', body,
    why: `You're getting this one reminder because you asked for it when you priced up a sit on ${esc(q.sitterName)}'s MYAH page.`,
    unsubscribeUrl: q.unsubscribeUrl,
  });
  return { subject, html };
}
