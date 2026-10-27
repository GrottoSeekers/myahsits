export const prerender = false;

import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { supabase } from '../../../lib/supabase';
import { accountFor } from '../../../lib/account';

export const POST: APIRoute = async ({ request, redirect }) => {
  try {
    const session = await getSession(request);
    if (!session) return redirect('/login');

    // One profile per account, on the side they signed up for.
    const acct = await accountFor(session.userId, session.email, session.role);
    if (acct.profile) return redirect(acct.home);
    if (acct.side !== 'owner') return redirect(acct.createUrl);

    const form = await request.formData();
    const name     = (form.get('name') as string | null)?.trim() ?? '';
    const slug     = (form.get('slug') as string | null)?.trim().toLowerCase() ?? '';
    const location = (form.get('location') as string | null)?.trim() || null;
    const bio      = (form.get('bio') as string | null)?.trim() || null;
    const accountType = form.get('account_type') === 'joint' ? 'joint' : 'solo';

    if (!name || !slug) return redirect('/owner/profile/create?error=missing');

    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))
      return redirect('/owner/profile/create?error=slug_invalid');

    const { data: taken } = await supabase
      .from('profiles')
      .select('slug')
      .eq('slug', slug)
      .maybeSingle();

    if (taken) return redirect('/owner/profile/create?error=slug_taken');

    let profilePicUrl: string | null = null;

    const file = form.get('profile_pic');
    if (file instanceof File && file.size > 0) {
      if (file.size > 5 * 1024 * 1024) {
        return redirect('/owner/profile/create?error=file_too_large');
      }
      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
      const path = `${session.userId}/${slug}-profile.${ext}`;
      const buffer = new Uint8Array(await file.arrayBuffer());
      const { error: uploadError } = await supabase.storage
        .from('profile-pics')
        .upload(path, buffer, { contentType: file.type, upsert: true });
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('profile-pics').getPublicUrl(path);
        profilePicUrl = urlData.publicUrl;
      }
    }

    const row: Record<string, unknown> = {
      user_id:           session.userId,
      slug,
      name,
      location,
      profile_pic:       profilePicUrl,
      bio,
      profile_type:      'owner',
      account_type:      accountType,
      hero_images_json:  [],
      about_images_json: [],
      gallery_json:      [],
      reviews_json:      [],
      platforms_json:    [],
      pets_json:         [],
      amenities_json:    [],
    };

    // Older databases can be missing some optional columns: drop any the
    // database says it doesn't have and try again, rather than failing.
    let error: { message: string } | null = null;
    for (let tries = 0; tries < 12; tries++) {
      ({ error } = await supabase.from('profiles').insert(row));
      const missing = error?.message.match(/'(\w+)' column|column "?(\w+)"? (?:of relation "profiles" )?does not exist/);
      const col = missing && (missing[1] || missing[2]);
      if (!col || !(col in row) || ['user_id', 'slug', 'name'].includes(col)) break;
      delete row[col];
    }

    if (error) return redirect('/owner/profile/create?error=server&detail=' + encodeURIComponent(error.message));

    // Next step: photos (home and pets for owners).
    return redirect('/owner/profile/edit?welcome=1');
  } catch (e) {
    return redirect('/owner/profile/create?error=server&detail=' + encodeURIComponent(e instanceof Error ? e.message : ''));
  }
};
