export const prerender = false;

import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { supabase } from '../../../lib/supabase';

export const POST: APIRoute = async ({ request }) => {
  let edit = '/profile/edit';
  try {
    const session = await getSession(request);
    if (!session) return new Response(null, { status: 302, headers: { Location: '/login' } });
    // Owners collect reviews from sitters on their own edit page.
    edit = session.role === 'owner' ? '/owner/profile/edit' : '/profile/edit';

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, slug, review_requests_json')
      .eq('user_id', session.userId)
      .single();

    if (!profile) {
      return new Response(null, { status: 302, headers: { Location: '/profile/create' } });
    }

    const requests: any[] = Array.isArray(profile.review_requests_json) ? [...profile.review_requests_json] : [];

    const token = crypto.randomUUID();
    requests.push({
      token,
      created_at: new Date().toISOString(),
      status: 'pending',
    });

    const { error } = await supabase
      .from('profiles')
      .update({ review_requests_json: requests })
      .eq('id', profile.id);

    if (error) {
      return new Response(null, { status: 302, headers: { Location: `${edit}?error=server#reviews` } });
    }

    return new Response(null, { status: 302, headers: { Location: `${edit}?saved=reviews&new_token=${token}#reviews` } });
  } catch {
    return new Response(null, { status: 302, headers: { Location: edit + '?error=server#reviews' } });
  }
};
