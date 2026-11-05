export const prerender = false;

import type { APIRoute } from 'astro';
import { Resend } from 'resend';
import { supabase } from '../../lib/supabase';

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
    const attachments: { filename: string; content: Buffer }[] = [];
    for (const f of files) {
      total += f.size;
      if (total > MAX_TOTAL) break;
      const name = String(f.name || 'photo.jpg').replace(/[^\w.-]+/g, '-').slice(0, 60);
      attachments.push({ filename: name, content: Buffer.from(await f.arrayBuffer()) });
    }
    const petPhotos = attachments.filter((a) => a.filename.startsWith('pet')).length;
    const homePhotos = attachments.length - petPhotos;

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

    const esc = (v: string) => v.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
    const fullName = esc(`${firstName} ${lastName ?? ''}`.trim());
    const dates = dateFrom && dateTo ? esc(`${dateFrom} to ${dateTo}`) : 'Not specified';
    const row = (label: string, value: string) =>
      value ? `<tr><td style="padding:8px 0;color:#6b4e35;font-weight:bold;vertical-align:top;">${label}</td><td style="padding:8px 0;">${esc(value).replace(/\n/g, '<br>')}</td></tr>` : '';
    const where = [suburb, city].filter(Boolean).join(', ');
    const photoNote = attachments.length
      ? `${petPhotos} of pets, ${homePhotos} of the home (attached)`
      : '';

    await resend.emails.send({
      from: 'MYAH <enquiries@myahsits.com>',
      to,
      replyTo: email,
      subject: `New enquiry from ${fullName}${city ? ' · ' + esc(city) : ''}`,
      ...(attachments.length ? { attachments } : {}),
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;">
          <h2 style="color:#2c1a0e;">New Enquiry</h2>
          <p>You've received a new enquiry through your MYAH page.</p>
          <table style="width:100%;border-collapse:collapse;margin:20px 0;">
            <tr><td style="padding:8px 0;color:#6b4e35;font-weight:bold;">Name</td><td style="padding:8px 0;">${fullName}</td></tr>
            <tr><td style="padding:8px 0;color:#6b4e35;font-weight:bold;">Email</td><td style="padding:8px 0;"><a href="mailto:${esc(email)}">${esc(email)}</a></td></tr>
            ${row('Phone', phone)}
            <tr><td style="padding:8px 0;color:#6b4e35;font-weight:bold;">Dates</td><td style="padding:8px 0;">${dates}</td></tr>
            ${row('Lives in', where)}
            ${row('Home', homeType)}
            ${row('About them', about)}
            ${message ? `<tr><td style="padding:8px 0;color:#6b4e35;font-weight:bold;vertical-align:top;">Message</td><td style="padding:8px 0;">${esc(message).replace(/\n/g, '<br>')}</td></tr>` : ''}
            ${row('Photos', photoNote)}
          </table>
          <p style="color:#6b4e35;font-size:0.85em;">Reply directly to this email to respond to ${esc(firstName)}.</p>
        </div>
      `,
    });

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
