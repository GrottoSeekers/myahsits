export const prerender = false;

import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';
import { emailInterestThanks, emailInterestToAdmin } from '../../lib/email';
import type { Role } from '../../lib/welcome-email';
import { visitFrom } from '../../lib/geo';

// "Register your interest" before launch. Saves the email to launch_interest
// and sends a thank-you. Works from a normal form post or fetch().
export const POST: APIRoute = async ({ request }) => {
  const wantsJson = (request.headers.get('accept') || '').includes('application/json');
  const done = (ok: boolean, error = '', role = '', position?: number) => wantsJson
    ? new Response(JSON.stringify(ok ? { ok, role, position } : { error }), { status: ok ? 200 : 400, headers: { 'Content-Type': 'application/json' } })
    : new Response(null, { status: 303, headers: { Location: ok ? '/?registered=1' + (role ? '&as=' + role : '') + '#welcome' : '/?error=' + error + '#join' } });

  try {
    const form = await request.formData();
    if (String(form.get('website') || '')) return done(true); // spam trap
    const email = String(form.get('email') || '').trim().toLowerCase();
    const rawRole = String(form.get('role') || '');
    const role = (['sitter', 'owner', 'both'].includes(rawRole) ? rawRole : '') as Role;
    const source = String(form.get('source') || '').slice(0, 60);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) return done(false, 'email');

    // Where they signed up from (supabase/signup-insights.sql). An older list
    // without those columns still saves the email.
    const base = { email, role: role || null, source: source || null };
    const geo = visitFrom(request, String(form.get('ref') || ''));
    let { error } = await supabase.from('launch_interest')
      .upsert({ ...base, ...geo }, { onConflict: 'email', ignoreDuplicates: true });
    if (error && /column/i.test(error.message)) {
      ({ error } = await supabase.from('launch_interest').upsert(base, { onConflict: 'email', ignoreDuplicates: true }));
    }
    if (error) await emailInterestToAdmin(email, role);

    // How many have joined so far ("one of the first 50"), when the list is set up.
    let position: number | undefined;
    if (!error) {
      try {
        const { count } = await supabase.from('launch_interest').select('id', { count: 'exact', head: true });
        if (typeof count === 'number' && count > 0) position = count;
      } catch {}
    }

    await emailInterestThanks(email, role, position);
    return done(true, '', role, position);
  } catch {
    return done(false, 'server');
  }
};
