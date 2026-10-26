// Which page design a member gets.
//
// Basic is the classic one-page layout (the old founders' site). Premium is
// the founders' page design: one full-screen photo, a moving highlights strip
// and tabs for each section. Owners and sitters both get the choice.
//
// While payments are off (PAYMENTS_ENABLED unset) everyone can pick either
// design on their edit page. Once payments are on, Premium needs a Premium
// membership; a Premium member can still switch back to Basic.
// The choice is stored as theme_json.layout, so no new column is needed.
import { PAYMENTS_ENABLED, hasAccess, tierOfPlan, type Billing, type Tier } from './billing';
import { jsonObj } from './db';

export type Layout = Tier;

/** Can this member use the Premium design? */
export function canUsePremium(b: Pick<Billing, 'status' | 'plan'> | null): boolean {
  if (!PAYMENTS_ENABLED) return true;
  return hasAccess(b) && tierOfPlan(b?.plan) === 'premium';
}

/** The design the member picked (Basic unless they chose Premium). */
export function chosenLayout(profile: any): Layout {
  return jsonObj(profile?.theme_json).layout === 'premium' ? 'premium' : 'basic';
}

/** The design their public page shows. */
export function layoutOf(profile: any, billing: Pick<Billing, 'status' | 'plan'> | null): Layout {
  return chosenLayout(profile) === 'premium' && canUsePremium(billing) ? 'premium' : 'basic';
}
