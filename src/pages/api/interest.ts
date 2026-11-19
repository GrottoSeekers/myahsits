export const prerender = false;

import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';
import { emailInterestThanks, emailInterestToAdmin, emailAdminAlert } from '../../lib/email';
import { humanPace, rateLimit, signupSpike } from '../../lib/antibot';
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
    // Bot sign-ups (owner, 19 Nov 2026): scripts were posting strangers' emails
    // from servers in Riga, Paris and the US, so each stranger got our welcome
    // email. Quietly ignore (look like success, save nothing, email no one)
    // anyone who didn't use the page: the form adds "ts" when someone starts
    // typing, and a person takes more than 1.5 seconds to fill it in.
    // Open to every country (owner, 19 Nov 2026: MYAH is global).
    if (!humanPace(form.get('ts'))) return done(true);
    // At most 3 sign-ups an hour from one connection (lib/antibot.ts).
    if (!(await rateLimit(request, 'interest', 3))) return done(true);
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
    // Early warning: email the founders when sign-ups jump (20, 50, 100… in a day).
    const spike = error ? null : await signupSpike();
    if (spike) await emailAdminAlert(`MYAH: ${spike} launch sign-ups in the last 24 hours`,
      `<p>${spike} people have joined the launch list in the last 24 hours. If that's more than you'd expect, it may be bots: check the list in Supabase (look at city and time) before sending anything to it.</p>`);
    return done(true, '', role, position);
  } catch {
    return done(false, 'server');
  }
};
