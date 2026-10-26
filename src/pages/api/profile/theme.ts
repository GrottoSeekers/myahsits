export const prerender = false;

import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { supabase } from '../../../lib/supabase';

const KEYS = ['background', 'accent', 'accent_light', 'text', 'text_soft'];

function isValidColour(val: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(val);
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const session = await getSession(request);
    if (!session) return new Response(null, { status: 302, headers: { Location: '/login' } });

    const form = await request.formData();

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, theme_json')
      .eq('user_id', session.userId)
      .single();

    if (!profile) {
      return new Response(null, { status: 302, headers: { Location: '/profile/create' } });
    }

    const theme: Record<string, string> = {};
    // Keep the page design choice (saved separately).
    const layout = (profile as any).theme_json?.layout;
    if (layout) theme.layout = layout;
    for (const key of KEYS) {
      const val = (form.get(key) as string | null)?.trim() ?? '';
      if (val && isValidColour(val)) theme[key] = val;
    }

    const { error } = await supabase
      .from('profiles')
      .update({ theme_json: theme })
      .eq('id', profile.id);

    if (error) {
      return new Response(null, { status: 302, headers: { Location: `/profile/edit?error=upload&detail=${encodeURIComponent(error.message)}#colours` } });
    }

    return new Response(null, { status: 302, headers: { Location: '/profile/edit?saved=colours#colours' } });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return new Response(null, { status: 302, headers: { Location: `/profile/edit?error=upload&detail=${encodeURIComponent(msg)}#colours` } });
  }
};
