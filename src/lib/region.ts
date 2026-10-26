// Locations on public pages are city or region only (owner's rule), never a
// suburb. Reviews copied from other sites often name the suburb, so map the
// ones we know to their city or region when the page is shown.
const REGION: Record<string, string> = {
  'Bowral': 'Southern Highlands',
  'Faulconbridge': 'Blue Mountains',
  'Joondalup': 'Perth',
  'Kurrajong Heights': 'Hawkesbury',
};

export function regionOnly(text: string): string {
  if (!text) return text;
  return Object.keys(REGION).reduce((t, suburb) => t.split(suburb).join(REGION[suburb]), text);
}
