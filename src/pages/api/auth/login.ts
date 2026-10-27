export const prerender = false;

import type { APIRoute } from 'astro';
import bcrypt from 'bcryptjs';
import { supabase } from '../../../lib/supabase';
import { signSession, sessionCookie } from '../../../lib/auth';
import { accountFor, landingFor } from '../../../lib/account';
import { LAUNCHED } from '../../../lib/launch';
import { verifyOn } from '../../../lib/verify-email';

export const POST: APIRoute = async ({ request }) => {
  try {
    const form = await request.formData();
    const email = (form.get('email') as string ?? '').trim().toLowerCase();
    const password = (form.get('password') as string) ?? '';
    // Signing in from the admin page returns there (only /admin paths allowed).
    const nextRaw = String(form.get('next') ?? '');
    const next = /^\/admin(\/[a-z0-9/-]*)?$/.test(nextRaw) ? nextRaw : '';

    if (!email || !password) {
      return new Response(null, { status: 302, headers: { Location: next ? next + '?error=missing' : '/login?error=missing' } });
    }

    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    const validPassword = user ? await bcrypt.compare(password, user.password) : false;

    if (!user || !validPassword) {
      return new Response(null, { status: 302, headers: { Location: next ? next + '?error=invalid' : '/login?error=invalid' } });
    }

    // Not confirmed their email yet: say so, with a button to send the link again.
    if (verifyOn(user) && !user.email_verified_at) {
      return new Response(null, { status: 302, headers: { Location: '/login?error=unverified&email=' + encodeURIComponent(user.email) } });
    }

    // Straight to their own side: their dashboard, or their create-profile page.
    const acct = await accountFor(user.id, user.email, user.role ?? 'sitter');
    const token = await signSession(user.id, user.email, acct.side);

    return new Response(null, {
      status: 302,
      headers: {
        // Before launch: founders go to /admin, everyone else to "launching soon".
        Location: next || (LAUNCHED ? landingFor(acct) : acct.isAdmin ? '/admin' : '/'),
        'Set-Cookie': sessionCookie(token),
      },
    });
  } catch {
    return new Response(null, { status: 302, headers: { Location: '/login?error=server' } });
  }
};
