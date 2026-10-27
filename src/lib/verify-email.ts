// Email verification for new accounts (owner, 27 Oct 2026): sign up, get an
// email, click the link, land back on the log-in page with the account
// confirmed. The link carries a signed, 3-day token, so nothing extra is
// stored apart from users.email_verified_at (supabase/email-verification.sql).
import { supabase } from './supabase';

const SECRET = import.meta.env.SESSION_SECRET ?? 'dev-secret-change-in-production';
const DAYS = 3;

async function key() {
  return crypto.subtle.importKey('raw', new TextEncoder().encode('verify:' + SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}
const b64u = (s: string) => btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64u = (s: string) => atob(s.replace(/-/g, '+').replace(/_/g, '/'));

export async function verifyToken(userId: string, email: string): Promise<string> {
  const body = JSON.stringify({ u: userId, e: email, x: Date.now() + DAYS * 864e5 });
  const sig = await crypto.subtle.sign('HMAC', await key(), new TextEncoder().encode(body));
  return b64u(body) + '.' + b64u(String.fromCharCode(...new Uint8Array(sig)));
}

export async function readToken(token: string): Promise<{ userId: string; email: string } | null> {
  try {
    const [b, s] = token.split('.');
    const body = unb64u(b);
    const sig = Uint8Array.from(unb64u(s), (c) => c.charCodeAt(0));
    if (!(await crypto.subtle.verify('HMAC', await key(), sig, new TextEncoder().encode(body)))) return null;
    const d = JSON.parse(body);
    if (!d.u || Date.now() > d.x) return null;
    return { userId: d.u, email: d.e };
  } catch {
    return null;
  }
}

/** Verification is on once the column exists and emails can be sent. */
export const verifyOn = (user: Record<string, unknown> | null) =>
  !!import.meta.env.RESEND_API_KEY && !!user && 'email_verified_at' in user;

export async function markVerified(userId: string) {
  return supabase.from('users').update({ email_verified_at: new Date().toISOString() }).eq('id', userId);
}
