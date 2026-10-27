// The home in detail (owner, round 3: "everything someone on Airbnb would put
// on their listing"). Edited on /owner/profile/edit, shown on both owner page
// designs. Saved inside profiles.theme_json.home, so no new column is needed.
import { jsonObj } from './db';

export const HOME_TYPES = ['House', 'Flat', 'Cottage', 'Townhouse', 'Farm', 'Villa', 'Cabin', 'Other'];
export const DUTIES = ['Feeding', 'Daily walks', 'Medication', 'Grooming', 'Watering plants', 'Garden care', 'Pool care', 'Bring in the post', 'Put the bins out', 'Light cleaning'];
export const RULES: { key: string; label: string; options: [string, string][] }[] = [
  { key: 'smoking', label: 'Smoking', options: [['no', 'No smoking'], ['outside', 'Outside only'], ['yes', 'Smoking allowed']] },
  { key: 'visitors', label: 'Visitors', options: [['no', 'No visitors'], ['ask', 'Ask first'], ['yes', 'Visitors welcome']] },
  { key: 'sitter_pets', label: "Sitter's own pet", options: [['no', 'No pets of your own'], ['ask', 'Ask first'], ['yes', 'Your pet is welcome']] },
  { key: 'children', label: 'Children', options: [['no', 'Not suitable for children'], ['yes', 'Children welcome']] },
];
export const CAR: [string, string][] = [['', 'Not said'], ['yes', 'A car is available to use'], ['needed', 'You will need your own car'], ['no', 'No car needed']];

export type Home = {
  type: string; bedrooms: string; bathrooms: string; room: string; outdoor: string;
  highlights: string[]; area: string; nearby: string; car: string;
  rules: Record<string, string>; rules_note: string; duties: string[]; alone: string;
};

const str = (v: unknown, n: number) => String(v ?? '').trim().slice(0, n);

/** Cleans what the edit page sent. */
export function cleanHome(d: any): Home {
  const o = d && typeof d === 'object' ? d : {};
  const rules: Record<string, string> = {};
  for (const r of RULES) {
    const v = str(o.rules?.[r.key], 10);
    if (r.options.some(([k]) => k === v)) rules[r.key] = v;
  }
  return {
    type: HOME_TYPES.includes(str(o.type, 20)) ? str(o.type, 20) : '',
    bedrooms: str(o.bedrooms, 3).replace(/[^0-9]/g, ''),
    bathrooms: str(o.bathrooms, 3).replace(/[^0-9.]/g, ''),
    room: str(o.room, 120),
    outdoor: str(o.outdoor, 120),
    highlights: (Array.isArray(o.highlights) ? o.highlights : []).map((h: unknown) => str(h, 80)).filter(Boolean).slice(0, 3),
    area: str(o.area, 600),
    nearby: str(o.nearby, 300),
    car: CAR.some(([k]) => k === str(o.car, 10)) ? str(o.car, 10) : '',
    rules,
    rules_note: str(o.rules_note, 400),
    duties: (Array.isArray(o.duties) ? o.duties : []).map((x: unknown) => str(x, 40)).filter((x: string) => DUTIES.includes(x)),
    alone: str(o.alone, 80),
  };
}

/** The saved details for a profile (empty fields when nothing is saved). */
export const homeOf = (p: any): Home => cleanHome(jsonObj(jsonObj(p?.theme_json).home));

/** Short facts for the top of an owner page: "House · 3 bedrooms · 2 bathrooms · Garden". */
export function homeFacts(h: Home): string[] {
  const n = (v: string, one: string, many: string) => (v ? `${v} ${v === '1' ? one : many}` : '');
  return [h.type, n(h.bedrooms, 'bedroom', 'bedrooms'), n(h.bathrooms, 'bathroom', 'bathrooms'), h.outdoor].filter(Boolean);
}

/** House rules as readable lines. */
export function homeRules(h: Home): string[] {
  return RULES.map((r) => r.options.find(([k]) => k === h.rules[r.key])?.[1] || '').filter(Boolean);
}

export const carLine = (h: Home) => CAR.find(([k]) => k === h.car && k)?.[1] || '';

export const hasHome = (h: Home) =>
  !!(h.type || h.bedrooms || h.bathrooms || h.room || h.outdoor || h.highlights.length || h.area || h.nearby || h.car || Object.keys(h.rules).length || h.rules_note || h.duties.length || h.alone);
