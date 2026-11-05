// Callum & Niamh's prices for the quote builder on /callumandniamh (owner,
// 5 Nov 2026). Australian dollars. Change a number here and the page follows.
// "night" charges are per night of the sit; "day" charges are counted once per
// night too (a 7-night sit has 7 days of care).

export const QUOTE_CURRENCY = 'AUD';

export const quotePrices = {
  base: { dog: 110, cat: 95 },
  extraPet: {
    dog: 40, // per night. TODO(owner): confirm, the old rate was not on file.
    catOrSmall: 15, // per day
    young: 30, // per day, each puppy or kitten under 12 months
  },
  supervision: { independent: 0, moderate: 25, constant: 60 }, // per day
  nightCare: 25, // per night
  walks: { extra: 20, long: 35 }, // per walk, per day
  medication: 10, // per day
  welcomeHome: { essentials: 30, fullShop: 50 }, // once, plus the receipt
  keys: { trip: 25, far: 40 }, // per trip; far = over 1 hour from central Sydney
  meet: { far: 40, extended: 45 }, // once
};
