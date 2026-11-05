// Callum & Niamh's prices for the quote builder on /callumandniamh (owner,
// 5 Nov 2026). Australian dollars. Change a number here and the page follows.
// Every daily charge is per day of the sit. Days are 24-hour blocks from the
// arrival time; the last day's extra hours follow `days` (owner, 5 Nov 2026,
// "like Rover": up to 2 hours free, up to 8 hours half a day, then a full day).

export const QUOTE_CURRENCY = 'AUD';

export const quotePrices = {
  days: { graceHours: 2, halfUpToHours: 8 },
  base: { dog: 110, cat: 95 },
  extraPet: {
    dog: 40, // per day (owner confirmed 5 Nov 2026)
    catOrSmall: 15, // per day
    young: 30, // per day, each puppy or kitten under 12 months
  },
  supervision: { independent: 0, moderate: 25, constant: 60 }, // per day
  nightCare: 25, // per day
  walks: { extra: 20, long: 35 }, // per walk, per day
  medication: 10, // per day
  welcomeHome: { essentials: 30, fullShop: 50 }, // once, plus the receipt
  keys: { trip: 25, far: 40 }, // per trip; far = over 1 hour from central Sydney
  meet: { far: 40, extended: 45 }, // once
};
