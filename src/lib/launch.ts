// Pre-launch mode. Until SITE_LAUNCHED=true is set in Vercel, the public can
// only see the founders' page, the "launching soon" page and the legal pages.
// The founders see the same, plus /admin and editing their own page; a
// full-site preview can be switched on from /admin (PREVIEW_COOKIE).
import { FOUNDERS_SLUG } from '../data/founders';

const flag = String(import.meta.env.SITE_LAUNCHED ?? (globalThis as any).process?.env?.SITE_LAUNCHED ?? '');
export const LAUNCHED = flag.trim().toLowerCase() === 'true';

const OPEN = new Set([
  '/', '/coming-soon', '/' + FOUNDERS_SLUG, '/privacy', '/terms', '/login', '/admin',
  '/sitemap.xml', '/robots.txt',
  '/api/enquiry', '/api/enquiry-photos', '/api/interest', '/api/auth/login', '/api/auth/logout',
  '/api/billing/webhook', // Stripe calls it; every request is signature-checked
]);

/** Can a signed-out visitor open this path before launch? */
export function openBeforeLaunch(path: string): boolean {
  const p = path.length > 1 ? path.replace(/\/+$/, '') : path;
  if (OPEN.has(p)) return true;
  if (p.startsWith('/_astro/') || p.startsWith('/images/') || p.startsWith('/_image')) return true;
  return /\.[a-z0-9]{2,5}$/i.test(p); // static files
}

export const PREVIEW_COOKIE = 'myah_preview';

/** Extra paths the founders can use before launch without the preview. */
export function adminBeforeLaunch(path: string): boolean {
  return /^\/(admin|api\/admin|profile\/edit|api\/profile|api\/auth|api\/verification|verification|billing|api\/billing)(\/|$)/.test(path);
}
