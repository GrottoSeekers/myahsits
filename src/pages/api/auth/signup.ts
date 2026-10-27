export const prerender = false;

import type { APIRoute } from 'astro';
import bcrypt from 'bcryptjs';
import { supabase } from '../../../lib/supabase';
import { signSession, sessionCookie } from '../../../lib/auth';
import { verifyOn } from '../../../lib/verify-email';
import { sendVerifyLink } from '../../../lib/email';

export const POST: APIRoute = async ({ request, url }) => {
  try {
    const form = await request.formData();
    const email = (form.get('email') as string ?? '').trim().toLowerCase();
    const password = (form.get('password') as string) ?? '';
    const confirm = (form.get('confirm') as string) ?? '';
    const role = form.get('role') === 'owner' ? 'owner' : 'sitter';

    if (!email || !password) {
      return new Response(null, { status: 302, headers: { Location: '/signup?error=missing' } });
    }
    if (password.length < 8) {
      return new Response(null, { status: 302, headers: { Location: '/signup?error=short' } });
    }
    if (password !== confirm) {
      return new Response(null, { status: 302, headers: { Location: '/signup?error=mismatch' } });
    }

    const { data: existing, error: lookupError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (lookupError) {
      return new Response(null, { status: 302, headers: { Location: `/signup?error=db&detail=${encodeURIComponent(lookupError.message)}` } });
    }

    if (existing) {
      return new Response(null, { status: 302, headers: { Location: '/signup?error=exists' } });
    }

    const hash = await bcrypt.hash(password, 12);
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({ email, password: hash, role })
      .select('*')
      .single();

    if (error || !newUser) {
      return new Response(null, { status: 302, headers: { Location: `/signup?error=db&detail=${encodeURIComponent(error?.message ?? 'Insert failed')}` } });
    }

    // Confirm the email first: we send a link that brings them back to log in.
    if (verifyOn(newUser)) {
      const sent = await sendVerifyLink(newUser.id, newUser.email, url.origin);
      if (sent.sent) {
        return new Response(null, { status: 302, headers: { Location: '/signup?sent=1&email=' + encodeURIComponent(newUser.email) } });
      }
    }

    const token = await signSession(newUser.id, newUser.email, newUser.role);

    return new Response(null, {
      status: 302,
      headers: {
        // New accounts go straight to the right create-profile page.
        Location: newUser.role === 'owner' ? '/owner/profile/create' : '/profile/create',
        'Set-Cookie': sessionCookie(token),
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return new Response(null, { status: 302, headers: { Location: `/signup?error=db&detail=${encodeURIComponent(msg)}` } });
  }
};
