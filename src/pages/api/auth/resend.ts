export const prerender = false;

import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';
import { verifyOn } from '../../../lib/verify-email';
import { sendVerifyLink } from '../../../lib/email';

// "Send the link again" on the log-in page. Always says it was sent, so it
// can't be used to find out who has an account.
export const POST: APIRoute = async ({ request, url }) => {
  const form = await request.formData();
  const email = String(form.get('email') || '').trim().toLowerCase();
  if (email) {
    const { data: user } = await supabase.from('users').select('*').eq('email', email).maybeSingle();
    if (user && verifyOn(user) && !user.email_verified_at) await sendVerifyLink(user.id, user.email, url.origin);
  }
  return new Response(null, { status: 302, headers: { Location: '/login?resent=1&email=' + encodeURIComponent(email) } });
};
