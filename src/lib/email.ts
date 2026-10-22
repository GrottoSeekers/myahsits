// Emails to the MYAH founders (via Resend, the same service as enquiries).
import { Resend } from 'resend';
import { supabase } from './supabase';
import { FOUNDERS_SLUG } from '../data/founders';
import { welcomeEmail, type Role } from './welcome-email';

const SITE = 'https://www.myahsits.com';
const esc = (s: unknown) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));

/** Who gets admin alerts: ADMIN_NOTIFY_EMAIL (comma-separated), else the founders' login email. */
async function adminRecipients(): Promise<string[]> {
  const env = String(import.meta.env.ADMIN_NOTIFY_EMAIL || '').split(',').map((e) => e.trim()).filter(Boolean);
  if (env.length) return env;
  try {
    const { data: f } = await supabase.from('profiles').select('user_id').eq('slug', FOUNDERS_SLUG).limit(1);
    const uid = (f as any)?.[0]?.user_id;
    if (!uid) return [];
    const { data: u } = await supabase.from('users').select('email').eq('id', uid).limit(1);
    const email = (u as any)?.[0]?.email;
    return email ? [email] : [];
  } catch {
    return [];
  }
}

/** "New ID check to review" — sent the moment a member submits their ID. */
export async function emailNewIdCheck(member: { name?: string; location?: string; slug?: string }, side: 'sitter' | 'owner') {
  const key = import.meta.env.RESEND_API_KEY;
  if (!key) return { sent: false, reason: 'no RESEND_API_KEY' };
  const to = await adminRecipients();
  if (!to.length) return { sent: false, reason: 'no recipient' };
  const who = esc(member.name || 'A new member');
  const role = side === 'owner' ? 'Home owner' : 'Sitter';
  const when = new Date().toLocaleString('en-GB', { timeZone: 'Europe/London', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  try {
    await new Resend(key).emails.send({
      from: 'MYAH <hello@myahsits.com>',
      to,
      subject: `New ID check: ${member.name || 'a new member'} (${role})`,
      html: `
<div style="font-family:Montserrat,Arial,sans-serif;max-width:520px;margin:0 auto;background:#faf6ee;padding:28px 24px;color:#2c1a0e">
  <p style="font-size:12px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:#6e5438;margin:0 0 12px">MYAH · ID checks</p>
  <h1 style="font-family:Georgia,serif;font-weight:400;font-size:26px;margin:0 0 14px">${who} sent their ID</h1>
  <table style="width:100%;border-collapse:collapse;background:#fff;border:1px solid #e3d8c8;border-radius:12px;margin:0 0 22px">
    <tr><td style="padding:12px 16px;color:#6b4e35;font-size:14px">Member</td><td style="padding:12px 16px;font-size:14px;text-align:right">${who}</td></tr>
    <tr><td style="padding:12px 16px;color:#6b4e35;font-size:14px;border-top:1px solid #efe7da">Joined as</td><td style="padding:12px 16px;font-size:14px;text-align:right;border-top:1px solid #efe7da">${role}</td></tr>
    ${member.location ? `<tr><td style="padding:12px 16px;color:#6b4e35;font-size:14px;border-top:1px solid #efe7da">Location</td><td style="padding:12px 16px;font-size:14px;text-align:right;border-top:1px solid #efe7da">${esc(member.location)}</td></tr>` : ''}
    <tr><td style="padding:12px 16px;color:#6b4e35;font-size:14px;border-top:1px solid #efe7da">Sent</td><td style="padding:12px 16px;font-size:14px;text-align:right;border-top:1px solid #efe7da">${esc(when)}</td></tr>
  </table>
  <a href="${SITE}/admin" style="display:inline-block;background:#2f5d45;color:#fff;text-decoration:none;font-size:13px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;padding:14px 28px;border-radius:50px">Review now</a>
  <p style="font-size:13px;color:#6b4e35;line-height:1.6;margin:22px 0 0">They can't apply, post, message or confirm until you approve them. The ID photos are only viewable on the admin page and are deleted once you decide.</p>
</div>`,
    });
    return { sent: true };
  } catch (e) {
    return { sent: false, reason: e instanceof Error ? e.message : 'send failed' };
  }
}

const shell = (body: string) => `
<div style="font-family:Montserrat,Arial,sans-serif;max-width:520px;margin:0 auto;background:#faf6ee;padding:28px 24px;color:#2c1a0e">
  <p style="font-size:12px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:#6e5438;margin:0 0 12px">MYAH · Make Yourself At Home</p>
  ${body}
  <p style="font-size:12px;color:#8a6a4f;line-height:1.6;margin:26px 0 0">You're getting this because you registered your interest at myahsits.com. Reply to this email if you'd rather not hear from us.</p>
</div>`;

/** "You're on the list" — sent when someone registers interest before launch (see welcome-email.ts). */
export async function emailInterestThanks(to: string, role: Role = '', position?: number) {
  const key = import.meta.env.RESEND_API_KEY;
  if (!key) return { sent: false, reason: 'no RESEND_API_KEY' };
  try {
    const m = welcomeEmail(role, position);
    const replyTo = await adminRecipients();
    await new Resend(key).emails.send({
      from: 'Callum & Niamh at MYAH <hello@myahsits.com>',
      to,
      ...(replyTo.length ? { replyTo } : {}),
      subject: m.subject,
      html: m.html,
      text: m.text,
    });
    return { sent: true };
  } catch (e) {
    return { sent: false, reason: e instanceof Error ? e.message : 'send failed' };
  }
}

/** Fallback when the interest list can't be saved: email the founders instead, so nobody is lost. */
export async function emailInterestToAdmin(email: string, role: string) {
  const key = import.meta.env.RESEND_API_KEY;
  const to = await adminRecipients();
  if (!key || !to.length) return { sent: false };
  try {
    await new Resend(key).emails.send({
      from: 'MYAH <hello@myahsits.com>', to,
      subject: `Launch interest: ${email}`,
      html: `<p>${esc(email)} registered interest (${esc(role || 'not said')}). It couldn't be saved to the launch list — run supabase/launch-interest.sql.</p>`,
    });
    return { sent: true };
  } catch { return { sent: false }; }
}

/** "MYAH is live" — sent from /admin to everyone on the launch list (100 per batch). */
export async function emailLaunch(list: string[]): Promise<{ sent: string[]; error?: string }> {
  const key = import.meta.env.RESEND_API_KEY;
  if (!key) return { sent: [], error: 'RESEND_API_KEY is not set' };
  const resend = new Resend(key);
  const html = shell(`
  <h1 style="font-family:Georgia,serif;font-weight:400;font-size:26px;margin:0 0 14px">MYAH is live</h1>
  <p style="font-size:15px;line-height:1.7;color:#4a3726;margin:0 0 22px">You asked us to tell you when MYAH launched, and it's here. Create your free profile as a sitter or a home owner, and start finding sits or the right sitter for your home and pets.</p>
  <a href="${SITE}/signup" style="display:inline-block;background:#2f5d45;color:#fff;text-decoration:none;font-size:13px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;padding:14px 28px;border-radius:50px">Join MYAH</a>
  <p style="font-size:15px;line-height:1.7;color:#4a3726;margin:22px 0 0">Callum &amp; Niamh</p>`);
  const sent: string[] = [];
  for (let i = 0; i < list.length; i += 100) {
    const chunk = list.slice(i, i + 100);
    try {
      const { error } = await resend.batch.send(chunk.map((to) => ({
        from: 'MYAH <hello@myahsits.com>', to, subject: 'MYAH is live: come and join', html,
      })));
      if (error) return { sent, error: error.message };
      sent.push(...chunk);
    } catch (e) {
      return { sent, error: e instanceof Error ? e.message : 'send failed' };
    }
  }
  return { sent };
}
