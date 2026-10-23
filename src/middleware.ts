import { defineMiddleware, sequence } from 'astro:middleware';
import { withPwaHead } from './lib/pwa';
import { LAUNCHED, openBeforeLaunch, adminBeforeLaunch, PREVIEW_COOKIE } from './lib/launch';
import { getAccount } from './lib/account';
import { getSessionToken } from './lib/auth';

// Before launch everyone, the founders included, sees only "launching soon"
// and the founders' page. The founders can also use /admin and edit their
// page, and can turn on a full-site preview from /admin when testing.
const gate = defineMiddleware(async (ctx, next) => {
  if (LAUNCHED || ctx.isPrerendered) return next();
  const path = ctx.url.pathname;

  if (path === '/coming-soon' || openBeforeLaunch(path)) {
    if (path === '/' && !(await previewing(ctx.request))) return ctx.rewrite('/coming-soon' + ctx.url.search);
    const res = await next();
    // Only the "launching soon" home page should show up on Google; the
    // founders' page still works for anyone with the link (e.g. Facebook).
    if (path !== '/coming-soon' && !path.startsWith('/api/') && !/\.[a-z0-9]{2,5}$/i.test(path)) res.headers.set('X-Robots-Tag', 'noindex');
    return res;
  }

  const acct = getSessionToken(ctx.request) ? await getAccount(ctx.request).catch(() => null) : null;
  if (acct?.isAdmin && (adminBeforeLaunch(path) || hasPreview(ctx.request))) return next();

  if (path.startsWith('/api/')) {
    return new Response(JSON.stringify({ error: 'launching_soon' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
  }
  return new Response(null, { status: 302, headers: { Location: '/' } });
});

// Every HTML page gets the "Add to Home Screen" tags in its <head>.
const pwa = defineMiddleware(async (_ctx, next) => {
  const res = await next();
  if (!(res.headers.get('content-type') || '').includes('text/html')) return res;
  const html = withPwaHead(await res.text());
  const headers = new Headers(res.headers);
  headers.delete('content-length');
  return new Response(html, { status: res.status, statusText: res.statusText, headers });
});

export const onRequest = sequence(pwa, gate);

const hasPreview = (req: Request) => new RegExp(`(?:^|;\\s*)${PREVIEW_COOKIE}=1`).test(req.headers.get('cookie') || '');

async function previewing(req: Request) {
  if (!hasPreview(req) || !getSessionToken(req)) return false;
  try { return !!(await getAccount(req))?.isAdmin; } catch { return false; }
}
