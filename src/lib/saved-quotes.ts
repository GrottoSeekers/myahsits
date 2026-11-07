// Shared by the saved-quote endpoints and the daily reminder job.
import { supabase } from './supabase';
import { SITE } from './enquiry-email';

// Where replies go: the sitter's enquiry email, or the email they log in with.
export async function sitterInbox(slug: string) {
  const { data: profile } = await supabase.from('profiles').select('name, contact_email, user_id').eq('slug', slug).single();
  if (!profile) return null;
  let to = profile.contact_email as string | undefined;
  if (!to && profile.user_id) {
    const { data: u } = await supabase.from('users').select('email').eq('id', profile.user_id).limit(1);
    to = (u as any)?.[0]?.email;
  }
  return { name: String(profile.name || 'Your sitter'), email: to || '' };
}

export const resumeUrl = (slug: string, state: string) => `${SITE}/${slug}?quote=${encodeURIComponent(state || '')}#prices`;
export const unsubscribeUrl = (token: string) => `${SITE}/api/quote-unsubscribe?t=${token}`;
