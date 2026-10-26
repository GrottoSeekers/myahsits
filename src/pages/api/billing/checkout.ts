export const prerender = false;

import type { APIRoute } from 'astro';
import { getAccount } from '../../../lib/account';
import { PAYMENTS_ENABLED, TIER_PLANS, customerFor, getBilling, hasAccess, stripe, type Interval, type Tier } from '../../../lib/billing';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

// Start a membership: { tier: 'basic' | 'premium', interval: 'month' | 'year' } → { url } of a Stripe
// Checkout page. Sitters and owners pay the same; the side is kept on the
// subscription's metadata for reporting.
// Someone who already has a membership is sent to the billing portal instead,
// so nobody ends up paying twice.
export const POST: APIRoute = async ({ request }) => {
  try {
    if (!PAYMENTS_ENABLED) return json({ error: 'payments_off' }, 403);
    const acct = await getAccount(request);
    if (!acct) return json({ error: 'Unauthorized' }, 401);

    const body = await request.json().catch(() => ({}));
    const interval: Interval = body.interval === 'year' ? 'year' : 'month';
    const tier: Tier = body.tier === 'premium' ? 'premium' : 'basic';
    const origin = new URL(request.url).origin;

    const billing = await getBilling(acct.userId);
    const customer = await customerFor(acct.userId, acct.email);
    if (billing?.stripe_subscription_id && hasAccess(billing)) {
      const portal = await stripe().billingPortal.sessions.create({ customer, return_url: `${origin}/billing` });
      return json({ url: portal.url });
    }

    const lookupKey = TIER_PLANS[tier][interval];
    const { data: prices } = await stripe().prices.list({ lookup_keys: [lookupKey], active: true, limit: 1 });
    if (!prices[0]) return json({ error: `No active Stripe price with lookup key ${lookupKey}` }, 500);

    const session = await stripe().checkout.sessions.create({
      mode: 'subscription',
      customer,
      client_reference_id: acct.userId,
      line_items: [{ price: prices[0].id, quantity: 1 }],
      subscription_data: { metadata: { user_id: acct.userId, side: acct.side } },
      // Stripe Tax: VAT/GST from the member's address; save it on the customer
      // so renewals are taxed the same way.
      automatic_tax: { enabled: true },
      customer_update: { address: 'auto', name: 'auto' },
      billing_address_collection: 'required',
      tax_id_collection: { enabled: true },
      allow_promotion_codes: true,
      success_url: `${origin}/billing?welcome=1`,
      cancel_url: `${origin}/billing`,
    });
    return json({ url: session.url });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Unknown error' }, 500);
  }
};
