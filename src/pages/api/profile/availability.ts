export const prerender = false;

import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { supabase } from '../../../lib/supabase';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const LENGTHS = ['A few days', '1–2 weeks', '2–4 weeks', 'A month or more'];
const PETS = ['Dogs', 'Cats', 'Birds', 'Rabbits', 'Horses', 'Livestock'];
const NOTICES = ['Any time', '1 week', '2 weeks', 'A month'];
const DAY = /^\d{4}-\d{2}-\d{2}$/;

// Saves /availability for the signed-in user.
//   { days: { "YYYY-MM-DD": "free" | "maybe" | "no" }, prefs: { lengths, pets, notice } }
export const POST: APIRoute = async ({ request }) => {
  try {
    const session = await getSession(request);
    if (!session) return json({ error: 'Unauthorized' }, 401);

    const body = await request.json();

    const days: Record<string, string> = {};
    const raw = body && typeof body.days === 'object' && body.days ? body.days : {};
    for (const k of Object.keys(raw).slice(0, 1500)) {
      if (DAY.test(k) && (raw[k] === 'free' || raw[k] === 'maybe' || raw[k] === 'no')) days[k] = raw[k];
    }

    const p = (body && body.prefs) || {};
    const pick = (v: unknown, allowed: string[]) =>
      Array.isArray(v) ? allowed.filter((a) => v.includes(a)) : [];
    const prefs = {
      lengths: pick(p.lengths, LENGTHS),
      pets: pick(p.pets, PETS),
      notice: NOTICES.includes(p.notice) ? p.notice : 'Any time',
    };

    const { error } = await supabase
      .from('profiles')
      .update({ availability_json: days, availability_prefs_json: prefs })
      .eq('user_id', session.userId);
    if (error) return json({ error: error.message }, 500);
    return json({ ok: true });
  } catch {
    return json({ error: 'Bad request' }, 400);
  }
};
