// MYAH memberships, billed through Stripe.
//
// Sitters and owners pay the same membership, monthly or yearly. Stripe
// does the rest: Checkout takes the first payment, the Customer Portal lets
// members change plan, update their card, download invoices or cancel, Stripe
// Billing sends the renewal invoices, and Stripe Tax works out UK VAT (and tax
// abroad, once registered there).
//
// Everything stays switched off until PAYMENTS_ENABLED=true is set in Vercel.
// Until then MYAH is free: hasAccess() is always true and the billing APIs
// answer "payments_off".
//
// Prices are found by lookup key (see PLANS), so they can be changed in the
// Stripe Dashboard without a deploy: create the new price, move the lookup
// key across ("Transfer lookup key"), done.
import Stripe from 'stripe';
import { supabase } from './supabase';

const env = (k: string) =>
  String((import.meta.env as any)[k] ?? (globalThis as any).process?.env?.[k] ?? '').trim();

export const PAYMENTS_ENABLED = env('PAYMENTS_ENABLED').toLowerCase() === 'true';

export type Interval = 'month' | 'year';

export type Tier = 'basic' | 'premium';

/** Stripe price lookup keys, one per tier and billing interval (the same for
 *  sitters and owners). Basic is the classic one-page layout; Premium is the
 *  founders' page design. */
export const TIER_PLANS: Record<Tier, Record<Interval, string>> = {
  basic: { month: 'myah_monthly', year: 'myah_annual' },
  premium: { month: 'myah_premium_monthly', year: 'myah_premium_annual' },
};
export const PLANS = TIER_PLANS.basic;

/** Which tier a Stripe lookup key belongs to. */
export const tierOfPlan = (plan: string | null | undefined): Tier =>
  String(plan || '').startsWith('myah_premium') ? 'premium' : 'basic';

/** Subscription states that keep a membership open. past_due is the grace
 *  period while Stripe retries a failed card (Smart Retries). */
const LIVE = new Set(['active', 'trialing', 'past_due']);

let _stripe: Stripe | null = null;

/** The Stripe client, created on first use so builds don't need the key. */
export function stripe(): Stripe {
  if (!_stripe) {
    const key = env('STRIPE_SECRET_KEY');
    if (!key) throw new Error('Missing STRIPE_SECRET_KEY — add it in Vercel (use sk_test_… until launch).');
    _stripe = new Stripe(key, { appInfo: { name: 'MYAH', url: 'https://www.myahsits.com' } });
  }
  return _stripe;
}

export interface Billing {
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  status: string;
  plan: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
}

export async function getBilling(userId: string): Promise<Billing | null> {
  const { data } = await supabase.from('billing').select('*').eq('user_id', userId).maybeSingle();
  return (data as Billing | null) ?? null;
}

/** Can this member use the paid parts of MYAH? Always yes while it's free. */
export function hasAccess(b: Pick<Billing, 'status'> | null): boolean {
  if (!PAYMENTS_ENABLED) return true;
  return !!b && LIVE.has(b.status);
}

/** Their Stripe customer, created (and remembered) the first time. */
export async function customerFor(userId: string, email: string): Promise<string> {
  const existing = await getBilling(userId);
  if (existing?.stripe_customer_id) return existing.stripe_customer_id;
  const customer = await stripe().customers.create(
    { email, metadata: { user_id: userId } },
    { idempotencyKey: `myah-customer-${userId}` },
  );
  const { error } = await supabase
    .from('billing')
    .upsert({ user_id: userId, stripe_customer_id: customer.id, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
  if (error) throw new Error(error.message);
  return customer.id;
}

/** Copy a subscription's current state from Stripe into `billing`. Always
 *  re-reads it from Stripe, so webhook order and retries don't matter. */
export async function syncSubscription(subscriptionId: string): Promise<void> {
  const sub = await stripe().subscriptions.retrieve(subscriptionId);
  const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
  let userId = sub.metadata?.user_id || '';
  if (!userId) {
    const { data } = await supabase.from('billing').select('user_id').eq('stripe_customer_id', customerId).maybeSingle();
    userId = (data as any)?.user_id || '';
  }
  if (!userId) throw new Error(`No MYAH member for Stripe customer ${customerId}`);

  const item = sub.items.data[0];
  const { error } = await supabase.from('billing').upsert(
    {
      user_id: userId,
      stripe_customer_id: customerId,
      stripe_subscription_id: sub.id,
      status: sub.status,
      plan: item?.price.lookup_key ?? null,
      current_period_end: item?.current_period_end ? new Date(item.current_period_end * 1000).toISOString() : null,
      cancel_at_period_end: !!sub.cancel_at_period_end,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  );
  if (error) throw new Error(error.message);
}

/** The live price for each tier and interval, for showing on /billing. */
export async function prices(): Promise<Record<Tier, Partial<Record<Interval, Stripe.Price>>>> {
  const keys = Object.values(TIER_PLANS).flatMap((t) => [t.month, t.year]);
  const { data } = await stripe().prices.list({ lookup_keys: keys, active: true });
  const out: Record<Tier, Partial<Record<Interval, Stripe.Price>>> = { basic: {}, premium: {} };
  for (const p of data) {
    for (const tier of ['basic', 'premium'] as Tier[]) {
      if (p.lookup_key === TIER_PLANS[tier].month) out[tier].month = p;
      if (p.lookup_key === TIER_PLANS[tier].year) out[tier].year = p;
    }
  }
  return out;
}
