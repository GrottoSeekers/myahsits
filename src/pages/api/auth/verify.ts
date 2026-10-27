export const prerender = false;

import type { APIRoute } from 'astro';
import { readToken, markVerified } from '../../../lib/verify-email';

// The link in the "Confirm your email" email. Confirms the account and sends
// them to the log-in page.
export const GET: APIRoute = async ({ url }) => {
  const t = await readToken(url.searchParams.get('t') || '');
  if (!t) return new Response(null, { status: 302, headers: { Location: '/login?error=link' } });
  const { error } = await markVerified(t.userId);
  const to = error ? '/login?error=server' : '/login?verified=1&email=' + encodeURIComponent(t.email);
  return new Response(null, { status: 302, headers: { Location: to } });
};
