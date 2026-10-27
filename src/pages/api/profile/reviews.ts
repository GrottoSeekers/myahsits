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

    const form = await request.formData();
    const action = form.get('_action') as string;

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, reviews_json')
      .eq('user_id', session.userId)
      .single();

    if (!profile) {
      return new Response(null, { status: 302, headers: { Location: '/profile/create' } });
    }

    if (action === 'delete') {
      const reviews: any[] = Array.isArray(profile.reviews_json) ? [...profile.reviews_json] : [];
      const index = parseInt(form.get('index') as string, 10);
      if (isNaN(index) || index < 0 || index >= reviews.length) {
        return new Response(null, { status: 302, headers: { Location: edit + '?error=server#reviews' } });
      }

      reviews.splice(index, 1);

      const { error } = await supabase
        .from('profiles')
        .update({ reviews_json: reviews })
        .eq('id', profile.id);

      if (error) {
        return new Response(null, { status: 302, headers: { Location: edit + '?error=server#reviews' } });
      }

      return new Response(null, { status: 302, headers: { Location: edit + '?saved=reviews#reviews' } });
    }

    return new Response(null, { status: 302, headers: { Location: edit + '?error=server' } });
  } catch {
    return new Response(null, { status: 302, headers: { Location: edit + '?error=server' } });
  }
};
