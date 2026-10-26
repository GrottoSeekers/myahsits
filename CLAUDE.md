# MYAH website (myahsits.com)

Astro site on Vercel, data in Supabase. Before launch, visitors see `/coming-soon` and the founders' page only (see `src/lib/launch.ts`).

## Owner's rules for changes (always follow)

1. **Desktop and phone stay the same.** When the owner asks for a change on the desktop view, make the same change on the phone view too, and the other way round. Wording must match exactly on both. If the phone layout can't take the change as it is (no room, different component), make the closest sensible equivalent and say what you did.
2. **Keep scrolling short.** Prefer short pages: put extra detail behind tabs, fold-outs, "Show all" / "Read more" buttons, or links to its own page, rather than one long scroll. Never remove a feature or content to get there unless the owner asks.
3. **Home owners' names:** never in social media posts (see the myah-social repo). On the website, sitter pages keep reviewers' first names under their reviews (owner, 26 Oct 2026).
4. **Locations: city or region only.** Never a suburb, street or house number.
5. **Show before going live.** Changes go to the review page (before/after screenshots, desktop and phone) for the owner to check. Merge to `main` only when the owner says so.

## Review notes

The owner reviews pages on the MYAH Site Review artifact. Notes there are stored in its database (`notes` collection). A note with a `box` field marks an area of a screenshot: `{x, y, w, h}` are fractions of that screenshot's width and height, and `src` names the screenshot. Crop that area to see exactly what the owner means.
