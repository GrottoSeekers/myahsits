export const prerender = false;

import type { APIRoute } from 'astro';
import { editFor, getAccount } from '../../../lib/account';
import { getBilling } from '../../../lib/billing';
import { jsonObj } from '../../../lib/db';
import { supabase } from '../../../lib/supabase';
import { canUsePremium } from '../../../lib/tier';

// Pick the page design: layout=basic | premium. Used by both edit pages.
// Premium needs a Premium membership once payments are on; without one the
// member is sent to /billing to upgrade.
export const POST: APIRoute = async ({ request }) => {
  const acct = await getAccount(request);
  if (!acct) return new Response(null, { status: 302, headers: { Location: '/login' } });
  const back = editFor(acct.side);
  const profile: any = acct.profile;
  if (!profile) return new Response(null, { status: 302, headers: { Location: back } });

  const form = await request.formData();
  const layout = form.get('layout') === 'premium' ? 'premium' : 'basic';
  if (layout === 'premium' && !canUsePremium(await getBilling(acct.userId))) {
    return new Response(null, { status: 302, headers: { Location: '/billing?upgrade=premium' } });
  }

  const theme = { ...jsonObj(profile.theme_json), layout };
  const { error } = await supabase.from('profiles').update({ theme_json: theme }).eq('id', profile.id);
  const q = error ? 'error=server' : 'saved=layout';
  return new Response(null, { status: 302, headers: { Location: `${back}?${q}#page-style` } });
};
