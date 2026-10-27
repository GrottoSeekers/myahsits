// Where a visitor is, from Vercel's request headers (city or region only, never
// closer), how they found us and what they are on. Used to show the founders
// where sign-ups come from on /admin (owner, round 3).
const dec = (v: string | null) => { try { return v ? decodeURIComponent(v) : ''; } catch { return v || ''; } };

export function visitFrom(request: Request, ref = '') {
  const h = request.headers;
  const ua = h.get('user-agent') || '';
  let via = String(ref || '').trim().slice(0, 120);
  try { if (/^https?:/.test(via)) via = new URL(via).hostname.replace(/^www\./, ''); } catch {}
  if (/myahsits\.com$/.test(via)) via = '';
  return {
    country: (h.get('x-vercel-ip-country') || '').slice(0, 2).toUpperCase() || null,
    region: dec(h.get('x-vercel-ip-country-region')).slice(0, 60) || null,
    city: dec(h.get('x-vercel-ip-city')).slice(0, 80) || null,
    referrer: via || null,
    device: /iPad|Tablet/i.test(ua) ? 'tablet' : /Mobi|iPhone|Android/i.test(ua) ? 'phone' : ua ? 'computer' : null,
  };
}
