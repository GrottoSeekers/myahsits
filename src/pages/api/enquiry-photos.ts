export const prerender = false;

// Photos for a WhatsApp booking request (owner, 6 Nov 2026). A WhatsApp link
// can only carry text, so the photos are stored and the message carries links.
// They go in the public 'profile-pics' bucket under enquiries/<random>/, so a
// link can't be guessed. Images only, at most 8 and 4 MB, and only for a
// sitter page that has a WhatsApp number.

import type { APIRoute } from 'astro';
import { randomBytes } from 'node:crypto';
import { supabase } from '../../lib/supabase';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

export const POST: APIRoute = async ({ request }) => {
  try {
    const form = await request.formData();
    const slug = String(form.get('slug') ?? '').trim();
    if (!slug) return json({ error: 'Missing page' }, 400);
    const { data: profile } = await supabase.from('profiles').select('whatsapp_number').eq('slug', slug).single();
    if (!profile?.whatsapp_number) return json({ error: 'No WhatsApp for this page' }, 400);

    const MAX_FILES = 8, MAX_TOTAL = 4 * 1024 * 1024;
    const files = [...form.getAll('pet_photo'), ...form.getAll('home_photo')]
      .filter((v): v is File => typeof v === 'object' && v !== null && 'arrayBuffer' in v && /^image\//.test((v as File).type))
      .slice(0, MAX_FILES);
    const folder = 'enquiries/' + randomBytes(12).toString('hex');
    const urls: { kind: 'pet' | 'home'; url: string }[] = [];
    let total = 0;
    for (const f of files) {
      total += f.size;
      if (total > MAX_TOTAL) break;
      const name = String(f.name || 'photo.jpg').replace(/[^\w.-]+/g, '-').slice(0, 40);
      const path = `${folder}/${name}`;
      const { error } = await supabase.storage.from('profile-pics')
        .upload(path, new Uint8Array(await f.arrayBuffer()), { contentType: f.type, upsert: true });
      if (error) continue;
      const { data } = supabase.storage.from('profile-pics').getPublicUrl(path);
      urls.push({ kind: name.startsWith('home') ? 'home' : 'pet', url: data.publicUrl });
    }
    if (!urls.length) return json({ error: 'Photos could not be uploaded' }, 500);
    return json({ ok: true, photos: urls });
  } catch {
    return json({ error: 'Photos could not be uploaded' }, 500);
  }
};
