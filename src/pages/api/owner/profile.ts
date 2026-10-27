export const prerender = false;

import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { supabase } from '../../../lib/supabase';
import { getAccount } from '../../../lib/account';
import { safeUpdate, jsonArr, jsonObj } from '../../../lib/db';
import { cleanHome } from '../../../lib/home';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const MAX_FILE = 5 * 1024 * 1024;
const HEX = /^#[0-9a-fA-F]{6}$/;
const THEME_KEYS: Record<string, string> = {
  background: 'background', accent: 'accent', accentLight: 'accent_light', text: 'text', textSoft: 'text_soft',
};
const HEADING_KEYS = [
  'about_label', 'about_title', 'pets_label', 'pets_title',
  'gallery_label', 'gallery_title', 'enquiry_label', 'enquiry_title',
];
const HANDOVER_KEYS = ['address', 'access', 'wifiName', 'wifiPass', 'vet', 'vetOoh', 'neighbour', 'mobile'];
const IMAGE_COLUMNS: Record<string, string> = { hero: 'hero_images_json', about: 'about_images_json', gallery: 'gallery_json' };

const str = (v: unknown, max = 2000) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const arr = jsonArr;
const storagePath = (url: string) => {
  const p = url.split('/profile-pics/')[1];
  return p ? decodeURIComponent(p) : null;
};

// Saves the whole /owner/profile/edit page in one go (the design has a single
// "Save changes" bar). Multipart body:
//   data          JSON: { name, location, tagline, bio, contact_email, whatsapp_number,
//                         looking_for, amenities[], theme{}, headings{}, handover{...}, home{},
//                         house_notes[{label,value}], images{hero,about,gallery}, pets[] }
//                 images.* and pets[] items are either an existing entry (kept by src /
//                 photo_url) or { new: n } pointing at an uploaded file.
//   hero_new_n, about_new_n, gallery_new_n, pet_new_n   the new files
export const POST: APIRoute = async ({ request }) => {
  try {
    const session = await getSession(request);
    if (!session) return json({ error: 'Unauthorized' }, 401);

    // select('*') via getAccount: asking for named columns fails outright on
    // an older database that lacks one of them.
    const acct = await getAccount(request);
    const profile: any = acct?.profile;
    if (!acct || !profile) return json({ error: 'no_profile' }, 400);
    if (acct.side !== 'owner') return json({ error: 'owners_only' }, 403);

    const form = await request.formData();
    let data: any;
    try { data = JSON.parse(String(form.get('data') || '{}')); } catch { return json({ error: 'missing' }, 400); }

    const name = str(data.name, 120);
    if (!name) return json({ error: 'missing' }, 400);

    const files: Record<string, File> = {};
    for (const [k, v] of form.entries()) {
      if (v instanceof File && v.size > 0) {
        if (v.size > MAX_FILE) return json({ error: 'file_too_large' }, 400);
        files[k] = v;
      }
    }
    const upload = async (file: File, prefix: string) => {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
      const path = `${session.userId}/${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
      const buffer = new Uint8Array(await file.arrayBuffer());
      const { error } = await supabase.storage.from('profile-pics').upload(path, buffer, { contentType: file.type, upsert: true });
      if (error) throw new Error('upload: ' + error.message);
      return supabase.storage.from('profile-pics').getPublicUrl(path).data.publicUrl;
    };

    const toRemove: string[] = [];
    const updates: Record<string, any> = {
      name,
      account_type: data.account_type === 'joint' ? 'joint' : 'solo',
      location: str(data.location, 160) || null,
      tagline: str(data.tagline, 200) || null,
      bio: str(data.bio, 5000) || null,
      contact_email: str(data.contact_email, 200) || null,
      whatsapp_number: str(data.whatsapp_number, 40) || null,
      looking_for: str(data.looking_for, 3000) || null,
      amenities_json: arr(data.amenities).map((a) => str(a, 40)).filter(Boolean).slice(0, 40),
    };

    // Theme colours (the page design choice is kept).
    const theme: Record<string, any> = {};
    const layout = jsonObj(profile.theme_json).layout;
    if (layout) theme.layout = layout;
    // The home in detail (lib/home.ts) lives alongside the colours.
    const home = data.home ? cleanHome(data.home) : jsonObj(profile.theme_json).home;
    if (home) theme.home = home;
    for (const [k, col] of Object.entries(THEME_KEYS)) {
      const v = str(data.theme?.[k], 7);
      if (HEX.test(v)) theme[col] = v;
    }
    updates.theme_json = theme;

    // Section headings — merged over what is there; blank keeps the default.
    const headings: Record<string, string> = { ...jsonObj(profile.headings_json) };
    for (const k of HEADING_KEYS) {
      const v = str(data.headings?.[k], 160);
      if (v) headings[k] = v; else delete headings[k];
    }
    updates.headings_json = headings;

    // Handover details (private; released on a confirmed sit).
    const handover: Record<string, any> = {};
    for (const k of HANDOVER_KEYS) handover[k] = str(data.handover?.[k], 300);
    handover.notes = arr(data.house_notes)
      .map((n) => ({ label: str(n?.label, 60), value: str(n?.value, 500) }))
      .filter((n) => n.label && n.value)
      .slice(0, 30);
    updates.handover_json = handover;

    // Photos: keep known entries in the order sent, upload new ones.
    for (const [key, column] of Object.entries(IMAGE_COLUMNS)) {
      const current = arr((profile as any)[column]);
      const bySrc = new Map(current.map((img: any) => [img?.src, img]));
      const next: any[] = [];
      for (const item of arr(data.images?.[key]).slice(0, 30)) {
        // Gallery photos can carry a short name shown on the photo (e.g. "Garden").
        const cap = key === 'gallery' ? str(item?.cap, 40) : '';
        if (item && typeof item.new === 'number') {
          const file = files[`${key}_new_${item.new}`];
          if (!file) continue;
          const src = await upload(file, key);
          next.push(key === 'hero' ? { src, pos: 'center' } : { src, alt: '', ...(cap ? { cap } : {}) });
        } else if (item && bySrc.has(item.src)) {
          const img = { ...(bySrc.get(item.src) as any) };
          if (key === 'gallery') { if (cap) img.cap = cap; else delete img.cap; }
          next.push(img);
        }
      }
      const kept = new Set(next.map((i) => i.src));
      current.forEach((img: any) => { if (img?.src && !kept.has(img.src)) toRemove.push(img.src); });
      updates[column] = next;
    }

    // Pets: existing ones keep their photo (and any routine); new ones may bring one.
    const currentPets = arr(profile.pets_json);
    const nextPets: any[] = [];
    for (const p of arr(data.pets).slice(0, 20)) {
      const petName = str(p?.name, 80);
      if (!petName) continue;
      const original = typeof p.index === 'number' ? currentPets[p.index] : null;
      let photo_url: string | null = original?.photo_url ?? null;
      if (typeof p.new === 'number' && files[`pet_new_${p.new}`]) {
        photo_url = await upload(files[`pet_new_${p.new}`], 'pet');
      }
      nextPets.push({
        ...(original || {}),
        name: petName,
        type: str(p.type, 30) || 'Dog',
        breed: str(p.breed, 80) || null,
        age: str(p.age, 40) || null,
        temperament: str(p.temperament, 400) || null,
        special_needs: str(p.special_needs, 400) || null,
        photo_url,
      });
    }
    const keptPetPhotos = new Set(nextPets.map((p) => p.photo_url).filter(Boolean));
    currentPets.forEach((p: any) => { if (p?.photo_url && !keptPetPhotos.has(p.photo_url)) toRemove.push(p.photo_url); });
    updates.pets_json = nextPets;

    const { error } = await safeUpdate('profiles', updates, ['id', profile.id], ['name']);
    if (error) return json({ error: 'server', detail: error.message }, 500);

    // Tidy up removed files from storage (best effort).
    const paths = toRemove.map(storagePath).filter((p): p is string => !!p);
    if (paths.length) {
      try { await supabase.storage.from('profile-pics').remove(paths); } catch {}
    }

    return json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : '';
    return json({ error: msg.startsWith('upload') ? 'upload' : 'server', detail: msg }, 500);
  }
};
