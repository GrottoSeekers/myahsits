export const prerender = false;

// Unsubscribe link in the quote emails: no more reminders to that address.
import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';

const page = (title: string, text: string) => new Response(`<!doctype html>
<html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title} · MYAH</title>
<link href="https://fonts.googleapis.com/css2?family=Marcellus&family=Montserrat:wght@400;600&display=swap" rel="stylesheet" />
<style>
  body { margin:0; min-height:100vh; display:flex; align-items:center; justify-content:center; background:#faf6ee; color:#2c1a0e; font-family:'Montserrat',Arial,sans-serif; padding:24px; box-sizing:border-box; }
  main { max-width:440px; background:#fff; border:1px solid #e3d8c8; border-radius:18px; padding:32px 28px; text-align:center; }
  img { width:44px; height:44px; }
  h1 { font:400 1.7rem 'Marcellus',Georgia,serif; margin:16px 0 10px; }
  p { color:#6b4e35; line-height:1.7; margin:0 0 20px; }
  a { display:inline-block; padding:12px 22px; border-radius:999px; background:#2f5d45; color:#fff; text-decoration:none; font-weight:600; font-size:.9rem; }
</style></head>
<body><main><img src="/images/logo-mark.png" alt="MYAH" /><h1>${title}</h1><p>${text}</p><a href="/">Back to MYAH</a></main></body></html>`,
  { headers: { 'Content-Type': 'text/html; charset=utf-8' } });

async function unsubscribe(token: string) {
  if (!/^[a-f0-9]{32}$/.test(token)) return false;
  const { data } = await supabase.from('saved_quotes').select('email').eq('token', token).limit(1);
  const email = (data as any)?.[0]?.email;
  if (!email) return false;
  await supabase.from('saved_quotes').update({ unsubscribed_at: new Date().toISOString() }).eq('email', email).is('unsubscribed_at', null);
  return true;
}

export const GET: APIRoute = async ({ url }) => {
  const ok = await unsubscribe(String(url.searchParams.get('t') || '')).catch(() => false);
  return ok
    ? page("You're unsubscribed", "We won't send you any more reminders about your quote. If you'd still like to book, your sitter's page is always there.")
    : page('Link not recognised', 'This unsubscribe link has expired or was already used. You will not get further reminders from it.');
};

// One-click unsubscribe from mail apps (List-Unsubscribe-Post).
export const POST: APIRoute = async ({ url }) => {
  await unsubscribe(String(url.searchParams.get('t') || '')).catch(() => false);
  return new Response(null, { status: 204 });
};
