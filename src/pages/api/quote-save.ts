export const prerender = false;

// Saved quotes (owner, 7 Nov 2026).
//  POST {slug, email, first_name?, summary, state, date_from?, date_to?, remind, send}
//    saves the quote; send=true emails it to them now (quote-emails.ts).
//    remind=true allows one reminder ~2 days later (api/cron/quote-reminders).
//  POST {action:'booked', slug, email}
//    they sent a request (email or WhatsApp): no reminder.
// The email goes from MYAH, with replies going to the sitter.

import type { APIRoute } from 'astro';
import { randomBytes } from 'node:crypto';
import { Resend } from 'resend';
import { supabase } from '../../lib/supabase';
import { SITE } from '../../lib/enquiry-email';
import { quoteEmail } from '../../lib/quote-emails';
import { sitterInbox, resumeUrl, unsubscribeUrl } from '../../lib/saved-quotes';

const resend = new Resend(import.meta.env.RESEND_API_KEY);
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const ISO = /^\d{4}-\d{2}-\d{2}$/;

export const POST: APIRoute = async ({ request }) => {
  try {
    const b = await request.json().catch(() => ({} as any));
    const slug = String(b.slug || '').trim().slice(0, 80);
    const email = String(b.email || '').trim().toLowerCase().slice(0, 200);
    if (!slug || !EMAIL.test(email)) return json({ error: 'Please enter a valid email.' }, 400);

    if (b.action === 'booked') {
      await supabase.from('saved_quotes').update({ booked_at: new Date().toISOString() }).eq('slug', slug).eq('email', email).is('booked_at', null);
      return json({ ok: true });
    }

    const sitter = await sitterInbox(slug);
    if (!sitter) return json({ error: 'Page not found.' }, 404);
    const summary = String(b.summary || '').slice(0, 4000);
    if (!/^From the price builder:/.test(summary)) return json({ error: 'Build a quote first.' }, 400);
    const state = String(b.state || '').slice(0, 2000);
    const dateFrom = ISO.test(String(b.date_from)) ? String(b.date_from) : null;
    const dateTo = ISO.test(String(b.date_to)) ? String(b.date_to) : null;
    const firstName = String(b.first_name || '').trim().slice(0, 60);
    const remind = !!b.remind;
    const token = randomBytes(16).toString('hex');

    // One saved quote per person and page: a newer quote replaces an older one.
    await supabase.from('saved_quotes').delete().eq('slug', slug).eq('email', email).is('booked_at', null).is('reminder_sent_at', null);
    const { error } = await supabase.from('saved_quotes').insert({
      token, slug, email, first_name: firstName || null, summary, state,
      date_from: dateFrom, date_to: dateTo, remind,
    });
    if (error) return json({ error: 'That did not save. Please try again.' }, 500);

    if (b.send) {
      const mail = quoteEmail({
        sitterName: sitter.name, pageUrl: `${SITE}/${slug}`,
        resumeUrl: resumeUrl(slug, state), unsubscribeUrl: unsubscribeUrl(token),
        firstName, summary, dateFrom: dateFrom || undefined, dateTo: dateTo || undefined,
      });
      await resend.emails.send({
        from: 'MYAH <enquiries@myahsits.com>', to: email,
        ...(sitter.email ? { replyTo: sitter.email } : {}),
        subject: mail.subject, html: mail.html,
        headers: { 'List-Unsubscribe': `<${unsubscribeUrl(token)}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' },
      });
    }
    return json({ ok: true });
  } catch {
    return json({ error: 'That did not send. Please try again.' }, 500);
  }
};
