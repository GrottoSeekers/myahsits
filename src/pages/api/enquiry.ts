export const prerender = false;

import type { APIRoute } from 'astro';
import { Resend } from 'resend';
import { supabase } from '../../lib/supabase';
import { enquiryEmail } from '../../lib/enquiry-email';

const resend = new Resend(import.meta.env.RESEND_API_KEY);

export const POST: APIRoute = async ({ request }) => {
  try {
    const form = await request.formData();
    const slug = (form.get('slug') as string)?.trim();
    const firstName = (form.get('first_name') as string)?.trim();
    const lastName = (form.get('last_name') as string)?.trim();
    const email = (form.get('email') as string)?.trim();
    const dateFrom = (form.get('date_from') as string)?.trim();
    const dateTo = (form.get('date_to') as string)?.trim();
    const message = (form.get('message') as string)?.trim();
    // Extra details from the founders' booking form (all optional here).
    const field = (k: string) => String(form.get(k) ?? '').trim().slice(0, 4000);
    const phone = field('phone'), city = field('city'), suburb = field('suburb');
    const homeType = field('home_type'), about = field('about');
    // Photos (already shrunk in the browser): images only, at most 8 and 4 MB.
    const MAX_FILES = 8, MAX_TOTAL = 4 * 1024 * 1024;
    const files = [...form.getAll('pet_photo'), ...form.getAll('home_photo')]
      .filter((v): v is File => typeof v === 'object' && v !== null && 'arrayBuffer' in v && /^image\//.test((v as File).type))
      .slice(0, MAX_FILES);
    let total = 0;
    // contentId: the photos show inside the email (cid:...) as well as attached.
    const attachments: { filename: string; content: Buffer; contentId: string }[] = [];
    for (const [i, f] of files.entries()) {
      total += f.size;
      if (total > MAX_TOTAL) break;
      const name = String(f.name || 'photo.jpg').replace(/[^\w.-]+/g, '-').slice(0, 60);
      attachments.push({ filename: name, content: Buffer.from(await f.arrayBuffer()), contentId: 'photo' + (i + 1) });
    }

    if (!slug || !firstName || !email) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('name, contact_email, whatsapp_number, user_id')
      .eq('slug', slug)
      .single();

    // No enquiry email set? Send it to the email they log in with.
    let to = profile?.contact_email as string | undefined;
    if (!to && profile?.user_id) {
      const { data: u } = await supabase.from('users').select('email').eq('id', profile.user_id).limit(1);
      to = (u as any)?.[0]?.email;
    }
    if (!to) {
      return new Response(JSON.stringify({ error: "They haven't set up email enquiries yet — message them on MYAH instead." }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const mail = enquiryEmail({
      sitterName: String(profile?.name || 'us'),
      firstName, lastName, email, phone,
      dateFrom, dateTo, city, suburb, homeType, about, message,
      photos: attachments.map((a) => ({ cid: a.contentId, kind: a.filename.startsWith('home') ? 'home' : 'pet' })),
    });

    await resend.emails.send({
      from: 'MYAH <enquiries@myahsits.com>',
      to,
      replyTo: email,
      subject: mail.subject,
      ...(attachments.length ? { attachments } : {}),
      html: mail.html,
    });

    // They have booked: no "your quote is saved" reminder (saved_quotes).
    try { await supabase.from('saved_quotes').update({ booked_at: new Date().toISOString() }).eq('slug', slug).eq('email', email.toLowerCase()).is('booked_at', null); } catch {}

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Failed to send enquiry' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
