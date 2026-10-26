// The site never names other sitting platforms (owner, 26 Oct 2026).
export const offSite = /rover|trusted\s*house\s*sitters/i;

// "TrustedHouseSitters · Sydney, NSW" -> "Private · Sydney, NSW"
export const privateLabel = (s: string) =>
  s.replace(/^\s*(?:rover|trusted\s*house\s*sitters)\b(?:\s*\([^)]*\))?/i, 'Private');

// Drops any sentence that names another platform.
export const scrubOffSite = (text: string) => {
  const t = String(text || '');
  if (!offSite.test(t)) return t;
  return t
    .replace(/We(?:'|’)re (?:fully )?verified on Rover and Trusted\s*House\s*sitters,? with over (\d+) five-star reviews\./gi, 'We have over $1 five-star reviews.')
    .split(/(\r?\n)/)
    .map((line) => line.split(/(?<=[.!?])\s+/).filter((x) => !offSite.test(x)).join(' '))
    .join('')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};
