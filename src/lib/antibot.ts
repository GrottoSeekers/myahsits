// Bot protection for the forms that send emails (owner, 19 Nov 2026), after
// bots posted ~360 strangers' addresses to the launch list.
//
// 1. humanPace: the page sends "ts", when someone started filling the form in.
//    Bots that post straight to the address have none; a person takes more
//    than a second or two (1.5s, so autofill + a quick tap still counts).
// 2. rateLimit: at most N tries an hour per internet connection, counted in
//    the rate_limits table (supabase/rate-limits.sql). The connection is
//    stored only as a one-way hash. If the table isn't there, nothing is
//    blocked (fails open), so a missing table never stops real people.
// 3. signupSpike: emails the founders when launch sign-ups pass 20, 50, 100…
//    in 24 hours, so the next attack is noticed in hours, not days.

import { createHash } from 'node:crypto';
import { supabase } from './supabase';

const SECRET = String(import.meta.env.SESSION_SECRET ?? (globalThis as any).process?.env?.SESSION_SECRET ?? 'myah');

export function humanPace(ts: unknown, minMs = 1500) {
  const started = Number(ts || 0), took = Date.now() - started;
  return !!started && took > minMs && took < 6 * 3600e3;
}

function connection(request: Request) {
  const h = request.headers;
  const ip = (h.get('x-forwarded-for') || '').split(',')[0].trim() || h.get('x-real-ip') || '';
  return ip ? createHash('sha256').update(SECRET + '|' + ip).digest('hex').slice(0, 32) : '';
}

/** true = allowed (and counted); false = over the limit for this connection. */
export async function rateLimit(request: Request, bucket: string, max: number, minutes = 60) {
  const key = connection(request);
  if (!key) return true;
  try {
    const since = new Date(Date.now() - minutes * 60e3).toISOString();
    const { count, error } = await supabase.from('rate_limits')
      .select('id', { count: 'exact', head: true })
      .eq('bucket', bucket).eq('key', key).gt('created_at', since);
    if (error) return true;
    if ((count ?? 0) >= max) return false;
    await supabase.from('rate_limits').insert({ bucket, key });
    return true;
  } catch {
    return true;
  }
}

const STEPS = [20, 50, 100, 200, 500];
/** After a launch sign-up is saved: the 24-hour count if it just reached an alert step. */
export async function signupSpike(): Promise<number | null> {
  try {
    const since = new Date(Date.now() - 24 * 3600e3).toISOString();
    const { count } = await supabase.from('launch_interest').select('id', { count: 'exact', head: true }).gt('created_at', since);
    return count && STEPS.includes(count) ? count : null;
  } catch {
    return null;
  }
}
