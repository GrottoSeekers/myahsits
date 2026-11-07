export const prerender = false;

// Daily (vercel.json "crons"): one reminder to each owner who asked for one,
// two days after saving their quote, unless they have since sent a request,
// unsubscribed, or their sit has already started. Saved quotes older than
// 14 days are left alone.
// Vercel calls this with "Authorization: Bearer <CRON_SECRET>" when CRON_SECRET
// is set in the project; otherwise only Vercel's cron runner is accepted.

import type { APIRoute } from 'astro';
import { Resend } from 'resend';
import { supabase } from '../../../lib/supabase';
import { SITE } from '../../../lib/enquiry-email';
import { reminderEmail } from '../../../lib/quote-emails';
import { sitterInbox, resumeUrl, unsubscribeUrl } from '../../../lib/saved-quotes';

const resend = new Resend(import.meta.env.RESEND_API_KEY);
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

function allowed(request: Request) {
  const secret = String(import.meta.env.CRON_SECRET ?? (globalThis as any).process?.env?.CRON_SECRET ?? '');
  if (secret) return request.headers.get('authorization') === `Bearer ${secret}`;
  return /vercel-cron/i.test(request.headers.get('user-agent') || '');
}

export const GET: APIRoute = async ({ request }) => {
  if (!allowed(request)) return json({ error: 'Not allowed' }, 401);
  const now = Date.now();
  const { data, error } = await supabase.from('saved_quotes')
    .select('id, token, slug, email, first_name, summary, state, date_from, date_to')
    .eq('remind', true).is('reminder_sent_at', null).is('booked_at', null).is('unsubscribed_at', null)
    .lt('created_at', new Date(now - 2 * 864e5).toISOString())
    .gt('created_at', new Date(now - 14 * 864e5).toISOString())
    .limit(50);
  if (error) return json({ error: error.message }, 500);

  const today = new Date(now).toISOString().slice(0, 10);
  const sitters = new Map<string, Awaited<ReturnType<typeof sitterInbox>>>();
  let sent = 0, skipped = 0;
  for (const q of (data || []) as any[]) {
    // Already booked by email under another quote, or the sit has started.
    const { data: booked } = await supabase.from('saved_quotes').select('id').eq('slug', q.slug).eq('email', q.email).not('booked_at', 'is', null).limit(1);
    if ((booked && booked.length) || (q.date_from && q.date_from <= today)) {
      await supabase.from('saved_quotes').update({ reminder_sent_at: new Date().toISOString() }).eq('id', q.id);
      skipped++; continue;
    }
    if (!sitters.has(q.slug)) sitters.set(q.slug, await sitterInbox(q.slug));
    const sitter = sitters.get(q.slug);
    if (!sitter) { skipped++; continue; }
    const mail = reminderEmail({
      sitterName: sitter.name, pageUrl: `${SITE}/${q.slug}`,
      resumeUrl: resumeUrl(q.slug, q.state || ''), unsubscribeUrl: unsubscribeUrl(q.token),
      firstName: q.first_name || '', summary: q.summary || '', dateFrom: q.date_from || undefined, dateTo: q.date_to || undefined,
    });
    try {
      await resend.emails.send({
        from: 'MYAH <enquiries@myahsits.com>', to: q.email,
        ...(sitter.email ? { replyTo: sitter.email } : {}),
        subject: mail.subject, html: mail.html,
        headers: { 'List-Unsubscribe': `<${unsubscribeUrl(q.token)}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' },
      });
      await supabase.from('saved_quotes').update({ reminder_sent_at: new Date().toISOString() }).eq('id', q.id);
      sent++;
    } catch { skipped++; }
  }
  return json({ ok: true, sent, skipped });
};
