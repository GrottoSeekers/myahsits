-- ═══════════════════════════════════════════════════════════════════
--  Grotto Sitters — Seed Script
--  Seeds Callum & Niamh's existing site data as the permanent
--  founding account. Run AFTER schema.sql.
--
--  BEFORE RUNNING:
--    Replace the password placeholder on line ~22 with a real bcrypt hash.
--    Generate one (Node.js):
--      npm install -g bcryptjs
--      node -e "require('bcryptjs').hash('YourPassword123', 12).then(console.log)"
-- ═══════════════════════════════════════════════════════════════════


-- ── 1. USER ──────────────────────────────────────────────────────────────────
-- Fixed UUID so the profile FK is deterministic and the seed is idempotent.
INSERT INTO users (id, email, password)
VALUES (
  'a0000000-0000-0000-0000-000000000001'::uuid,
  'info@myahsits.com',
  '$2b$12$XjBuQbeBujhYKXVS1fTuqueaY/Iwk3ykJB77Ttg/jMrW80Dn6U3Z6'
)
ON CONFLICT (email) DO NOTHING;


-- ── 2. PROFILE ───────────────────────────────────────────────────────────────
INSERT INTO profiles (
  user_id,
  slug,
  name,
  tagline,
  badge_text,
  bio,
  profile_pic,
  hero_images_json,
  about_images_json,
  gallery_json,
  reviews_json,
  platforms_json
)
VALUES (

  -- user_id
  'a0000000-0000-0000-0000-000000000001'::uuid,

  -- slug  →  /callumandniamh
  'callumandniamh',

  -- name
  'Callum & Niamh',

  -- tagline (hero sub-headline)
  'Experienced house & pet sitters available across Australia now and the UK from October.',

  -- badge_text (small pill shown in the hero)
  'Currently in Australia — Returning to the UK October 2026',

  -- bio  (paragraphs separated by blank lines — template splits on \n\n)
  -- Dollar-quoting avoids escaping the apostrophes throughout
  $bio$We're Callum & Niamh, a couple from the UK who have been house and pet sitting full-time across Australia since December 2025. With years of experience caring for pets and homes back in Britain, we brought that same dedication with us Down Under.

Whether it's a weekend away or a month-long trip, we move in and keep everything running smoothly — daily walks, feeding routines, garden care, and plenty of love for your animals. We treat every sit like it's our own home.

We're returning to the UK in October 2026 and would love to hear from pet owners looking for reliable sitters — whether you're in Australia now or planning ahead in the UK. We have over 40 five-star reviews.$bio$,

  -- profile_pic
  'https://grottositters.com/images/couple-field-1.jpg',

  -- hero_images_json  [{src, pos}]
  '[
    {"src": "https://grottositters.com/images/couple-dinner-1.jpg",  "pos": "center 25%"},
    {"src": "https://grottositters.com/images/couple-airport-1.jpg", "pos": "center 25%"},
    {"src": "https://grottositters.com/images/couple-field-1.jpg",   "pos": "center 15%"},
    {"src": "https://grottositters.com/images/couple-bw-1.jpg",      "pos": "center 15%"}
  ]'::jsonb,

  -- about_images_json  [{src, alt}]
  '[
    {"src": "https://grottositters.com/images/couple-boat-1.jpg",    "alt": "Callum and Niamh on a boat at sunset"},
    {"src": "https://grottositters.com/images/couple-dinner-1.jpg",  "alt": "Callum and Niamh at a seaside dinner"},
    {"src": "https://grottositters.com/images/couple-field-1.jpg",   "alt": "Callum and Niamh in a field at sunset"},
    {"src": "https://grottositters.com/images/couple-villa-1.jpg",   "alt": "Callum and Niamh at a villa"},
    {"src": "https://grottositters.com/images/couple-night-1.jpg",   "alt": "Callum and Niamh out at night"},
    {"src": "https://grottositters.com/images/couple-bw-1.jpg",      "alt": "Callum and Niamh black and white"},
    {"src": "https://grottositters.com/images/couple-airport-1.jpg", "alt": "Callum and Niamh at the airport"}
  ]'::jsonb,

  -- gallery_json  [{src, alt}]
  '[
    {"src": "https://grottositters.com/images/chester-1.jpg",  "alt": "Chester the cocker spaniel"},
    {"src": "https://grottositters.com/images/travis-1.jpg",   "alt": "Travis on a countryside walk"},
    {"src": "https://grottositters.com/images/travis-2.jpg",   "alt": "Travis the Vizsla close-up"},
    {"src": "https://grottositters.com/images/travis-3.jpg",   "alt": "Travis sleeping in blankets"},
    {"src": "https://grottositters.com/images/solomon-1.jpg",  "alt": "Solomon the labradoodle"},
    {"src": "https://grottositters.com/images/solomon-4.jpg",  "alt": "Solomon in the snow"},
    {"src": "https://grottositters.com/images/solomon-2.jpg",  "alt": "Solomon on a muddy walk"},
    {"src": "https://grottositters.com/images/zeus-1.jpg",     "alt": "Zeus the Weimaraner with Callum"},
    {"src": "https://grottositters.com/images/alfie-1.jpg",    "alt": "Alfie the cockapoo with Callum"},
    {"src": "https://grottositters.com/images/alfie-2.jpg",    "alt": "Alfie relaxing at home"}
  ]'::jsonb,

  -- reviews_json  [{text, name, initials, platform}]
  -- Dollar-quoting handles all apostrophes inside review text
  $reviews$[
    {
      "text": "Super lovely couple who took great care of our cat Rocco! They sent regular updates and pictures and kept us in the loop throughout the trip. Rocco was extremely happy when we got home and seemed very at ease. Our apartment was also in wonderful condition!",
      "name": "Jess & Sam", "initials": "JS",
      "platform": "Private · Sydney, NSW"
    },
    {
      "text": "Callum and Niamh were and are a delightful couple. The house was impeccable on our return and the animals were well looked after. They both went out of their way to come and meet me a few weeks before our departure which put me at absolute ease. Both would be welcomed back anytime.",
      "name": "Janet", "initials": "JA",
      "platform": "Private · Hawkesbury, NSW · Mar 2026"
    },
    {
      "text": "Callum & Niamh were amazing sitters! We came home to happy puppies and they went the extra mile. One of our dogs wasn't feeling well and they took excellent care of everything. I'm so grateful our dogs were in such great hands. The house was spotless and they were a pleasure to talk with!",
      "name": "Heather", "initials": "HE",
      "platform": "Private · Sydney, NSW · Mar 2026"
    },
    {
      "text": "We couldn't have asked for better pet sitters. From start to finish Callum and Niamh were reliable, trustworthy, and incredibly caring with Bailey. They were very communicative, providing updates and photos the whole time. They also left our home spotless. They absolutely exceeded expectations. Bailey clearly loved them too!",
      "name": "Libby", "initials": "LI",
      "platform": "Private · Sydney, NSW · Feb 2026"
    },
    {
      "text": "Callum and Niamh were just lovely house sitters. We have 4 dogs, a cat, chooks and a big garden. The animals were very well looked after and happy. The house was tidy and sheets washed. I would be very happy to recommend these two lovely people to anyone.",
      "name": "Angela", "initials": "AN",
      "platform": "Private · Southern Highlands, NSW · Jan–Feb 2026"
    },
    {
      "text": "Callum and Niamh were amazing. Mali took to them immediately, especially as Mali doesn't usually take to men quickly. They were loving and took great care of him, even taking him for walks in the rain. Our place was left in perfect condition. Mali adored them — so grateful our first experience with a sitter was so perfect!",
      "name": "Elizabeth", "initials": "EL",
      "platform": "Private · Blue Mountains, NSW · Jan 2026"
    },
    {
      "text": "Niamh and Callum were the perfect house sitters — reliable with fantastic communication. They looked after Zeus and the house impeccably. We're pretty sure Zeus was disappointed when we came home! We wish them all the very best and hope to see them again. Zeus already misses them!",
      "name": "Danielle", "initials": "DA",
      "platform": "Private · Sydney, NSW · Jan 2026"
    },
    {
      "text": "Our 3 pets loved their time with Callum and Niamh for 2 weeks over Christmas — Scuff is still looking in the spare room to check if his friends have really gone! We appreciated the regular updates and photos, and their due diligence taking Scuff out in the cooler parts of the day during 35–40 degree heat. Would have them back anytime!",
      "name": "Kimberley", "initials": "KI",
      "platform": "Private · Perth, WA · Dec 2025–Jan 2026"
    },
    {
      "text": "Callum and his partner looked after our Spaniel whilst we were away for a week — both lovely, very professional but also super friendly. Toby looked very happy and chilled and came home so content! We would absolutely use Callum again in a heartbeat and would highly recommend.",
      "name": "Phillipa", "initials": "PH",
      "platform": "Private · United Kingdom · Oct 2025"
    },
    {
      "text": "I wouldn't hesitate in recommending Callum & Niamh. They took excellent care of both our dogs for 2 weeks, provided daily updates and photos. The dogs were exercised, loved and treated like family. I was so content knowing they were enjoying their holiday whilst we were on ours. You won't find better!",
      "name": "Deb", "initials": "DE",
      "platform": "Private · United Kingdom · Sep 2025"
    },
    {
      "text": "Callum and Niamh have looked after my Hungarian Vizsla Travis on multiple home stays and are his regular dog walkers. They have a key to my house — they are trustworthy and reliable and he adores them, to the point where he drags me to their house. When Travis was ill at a festival stay, they handled two vet visits brilliantly. I would highly recommend them to anyone.",
      "name": "Emma", "initials": "EM",
      "platform": "Private · United Kingdom · Sep 2025"
    },
    {
      "text": "Callum and Niamh have come to stay at our home to look after our cocker spaniel and tabby cat whenever we go away. On each occasion we've been blown away by the great job they've done. Our holidays are so much more relaxed for having found them — we go away knowing our most loved pets and possessions are being cared for just as we would. Thanks again!",
      "name": "Charlotte", "initials": "CH",
      "platform": "Private · United Kingdom · Sep 2025"
    },
    {
      "text": "Callum and his partner Niamh have looked after my labradoodle Solomon for the last four years, since he was a puppy. Solly absolutely adores them both. They are reliable, trustworthy, and clearly care about his wellbeing. Whether it's regular walks, overnight stays, or house-sitting, they go above and beyond. I couldn't recommend them highly enough.",
      "name": "Thomas James", "initials": "TJ",
      "platform": "Private · United Kingdom · Sep 2025"
    },
    {
      "text": "Callum and Niamh have looked after our dog multiple times and we couldn't recommend them enough. They are both lovely, kind and genuine people who put you at ease the moment you meet them. We can fully relax when away, knowing our dog is in the very best possible care. She completely adores them — you won't find a more trustworthy, dependable couple!",
      "name": "Ben", "initials": "BE",
      "platform": "Private · United Kingdom · Sep 2025"
    },
    {
      "text": "Callum and his partner were recommended to look after my home and cat while I was abroad. Cat was very well cared for with regular WhatsApp updates. My home was immaculate on return — better than I'd left it. They even left fresh milk and bread, and washed the bedding. So thoughtful and considerate. I'd highly recommend and would use again.",
      "name": "Anne-Marie", "initials": "AM",
      "platform": "Private · United Kingdom · Sep 2025"
    }
  ]$reviews$::jsonb,

  -- platforms_json  [{name, url, emoji, description}]
  '[]'::jsonb

)
ON CONFLICT (slug) DO NOTHING;


-- Full reviews, captioned gallery and review total for the founders.
-- (Same as supabase/restore-callumandniamh.sql; safe to run again.)
-- Restore Callum & Niamh's reviews, photo captions and review total.
-- Safe to run more than once. Only touches the callumandniamh profile.
-- Works whether the review/gallery columns are stored as JSON or as text.

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS review_total INT;

UPDATE profiles p SET
  -- Reviews: the 15 from the original site (full text) first, then any review
  -- already on the profile from someone not in that list (e.g. via the form).
  reviews_json = (
    WITH orig AS (
      SELECT r, n FROM jsonb_array_elements($rv$[
 {
  "text": "Super lovely couple who took great care of our cat Rocco! They sent regular updates and pictures and kept us in the loop throughout the trip. Rocco was extremely happy when we got home and seemed very at ease. Our apartment was also in wonderful condition!",
  "name": "Jess & Sam",
  "initials": "JS",
  "platform": "Private · Sydney, NSW"
 },
 {
  "text": "Callum and Niamh were and are a delightful couple. The house was impeccable on our return and the animals were well looked after. They both went out of their way to come and meet me a few weeks before our departure which put me at absolute ease. Both would be welcomed back anytime.",
  "name": "Janet",
  "initials": "JA",
  "platform": "Private · Hawkesbury, NSW · Mar 2026"
 },
 {
  "text": "Callum & Niamh were amazing sitters! We came home to happy puppies and they went the extra mile. One of our dogs wasn't feeling well and they took excellent care of everything. I'm so grateful our dogs were in such great hands. The house was spotless and they were a pleasure to talk with!",
  "name": "Heather",
  "initials": "HE",
  "platform": "Private · Sydney, NSW · Mar 2026"
 },
 {
  "text": "We couldn't have asked for better pet sitters. From start to finish Callum and Niamh were reliable, trustworthy, and incredibly caring with Bailey. They were very communicative, providing updates and photos the whole time. They also left our home spotless. They absolutely exceeded expectations. Bailey clearly loved them too!",
  "name": "Libby",
  "initials": "LI",
  "platform": "Private · Sydney, NSW · Feb 2026"
 },
 {
  "text": "Callum and Niamh were just lovely house sitters. We have 4 dogs, a cat, chooks and a big garden. The animals were very well looked after and happy. The house was tidy and sheets washed. I would be very happy to recommend these two lovely people to anyone.",
  "name": "Angela",
  "initials": "AN",
  "platform": "Private · Southern Highlands, NSW · Jan–Feb 2026"
 },
 {
  "text": "Callum and Niamh were amazing. Mali took to them immediately, especially as Mali doesn't usually take to men quickly. They were loving and took great care of him, even taking him for walks in the rain. Our place was left in perfect condition. Mali adored them — so grateful our first experience with a sitter was so perfect!",
  "name": "Elizabeth",
  "initials": "EL",
  "platform": "Private · Blue Mountains, NSW · Jan 2026"
 },
 {
  "text": "Niamh and Callum were the perfect house sitters — reliable with fantastic communication. They looked after Zeus and the house impeccably. We're pretty sure Zeus was disappointed when we came home! We wish them all the very best and hope to see them again. Zeus already misses them!",
  "name": "Danielle",
  "initials": "DA",
  "platform": "Private · Sydney, NSW · Jan 2026"
 },
 {
  "text": "Our 3 pets loved their time with Callum and Niamh for 2 weeks over Christmas — Scuff is still looking in the spare room to check if his friends have really gone! We appreciated the regular updates and photos, and their due diligence taking Scuff out in the cooler parts of the day during 35–40 degree heat. Would have them back anytime!",
  "name": "Kimberley",
  "initials": "KI",
  "platform": "Private · Perth, WA · Dec 2025–Jan 2026"
 },
 {
  "text": "Callum and his partner looked after our Spaniel whilst we were away for a week — both lovely, very professional but also super friendly. Toby looked very happy and chilled and came home so content! We would absolutely use Callum again in a heartbeat and would highly recommend.",
  "name": "Phillipa",
  "initials": "PH",
  "platform": "Private · United Kingdom · Oct 2025"
 },
 {
  "text": "I wouldn't hesitate in recommending Callum & Niamh. They took excellent care of both our dogs for 2 weeks, provided daily updates and photos. The dogs were exercised, loved and treated like family. I was so content knowing they were enjoying their holiday whilst we were on ours. You won't find better!",
  "name": "Deb",
  "initials": "DE",
  "platform": "Private · United Kingdom · Sep 2025"
 },
 {
  "text": "Callum and Niamh have looked after my Hungarian Vizsla Travis on multiple home stays and are his regular dog walkers. They have a key to my house — they are trustworthy and reliable and he adores them, to the point where he drags me to their house. When Travis was ill at a festival stay, they handled two vet visits brilliantly. I would highly recommend them to anyone.",
  "name": "Emma",
  "initials": "EM",
  "platform": "Private · United Kingdom · Sep 2025"
 },
 {
  "text": "Callum and Niamh have come to stay at our home to look after our cocker spaniel and tabby cat whenever we go away. On each occasion we've been blown away by the great job they've done. Our holidays are so much more relaxed for having found them — we go away knowing our most loved pets and possessions are being cared for just as we would. Thanks again!",
  "name": "Charlotte",
  "initials": "CH",
  "platform": "Private · United Kingdom · Sep 2025"
 },
 {
  "text": "Callum and his partner Niamh have looked after my labradoodle Solomon for the last four years, since he was a puppy. Solly absolutely adores them both. They are reliable, trustworthy, and clearly care about his wellbeing. Whether it's regular walks, overnight stays, or house-sitting, they go above and beyond. I couldn't recommend them highly enough.",
  "name": "Thomas James",
  "initials": "TJ",
  "platform": "Private · United Kingdom · Sep 2025"
 },
 {
  "text": "Callum and Niamh have looked after our dog multiple times and we couldn't recommend them enough. They are both lovely, kind and genuine people who put you at ease the moment you meet them. We can fully relax when away, knowing our dog is in the very best possible care. She completely adores them — you won't find a more trustworthy, dependable couple!",
  "name": "Ben",
  "initials": "BE",
  "platform": "Private · United Kingdom · Sep 2025"
 },
 {
  "text": "Callum and his partner were recommended to look after my home and cat while I was abroad. Cat was very well cared for with regular WhatsApp updates. My home was immaculate on return — better than I'd left it. They even left fresh milk and bread, and washed the bedding. So thoughtful and considerate. I'd highly recommend and would use again.",
  "name": "Anne-Marie",
  "initials": "AM",
  "platform": "Private · United Kingdom · Sep 2025"
 }
]$rv$::jsonb) WITH ORDINALITY t(r, n)
    ),
    extra AS (
      SELECT r, 1000 + n AS n
      FROM jsonb_array_elements(CASE WHEN jsonb_typeof(to_jsonb(p.reviews_json)) = 'array' THEN to_jsonb(p.reviews_json) WHEN jsonb_typeof(to_jsonb(p.reviews_json)) = 'string' AND left(trim(p.reviews_json::text), 1) = '[' THEN p.reviews_json::text::jsonb ELSE '[]'::jsonb END) WITH ORDINALITY t(r, n)
      WHERE lower(trim(r->>'name')) NOT IN (SELECT lower(trim(r->>'name')) FROM orig)
    )
    SELECT jsonb_agg(r ORDER BY n) FROM (SELECT * FROM orig UNION ALL SELECT * FROM extra) a
  ),
  -- Gallery: the 40 captioned photos, then any other photo already uploaded.
  gallery_json = (
    WITH orig AS (
      SELECT g, n FROM jsonb_array_elements($gl$[
 {
  "src": "/images/chester-1.jpg",
  "alt": "Chester the cocker spaniel cuddling on the couch"
 },
 {
  "src": "/images/travis-1.jpg",
  "alt": "Travis on a countryside walk"
 },
 {
  "src": "/images/travis-2.jpg",
  "alt": "Travis the Vizsla close-up portrait"
 },
 {
  "src": "/images/travis-3.jpg",
  "alt": "Travis sleeping in blankets"
 },
 {
  "src": "/images/solomon-1.jpg",
  "alt": "Solomon the labradoodle on the grass"
 },
 {
  "src": "/images/solomon-4.jpg",
  "alt": "Solomon in the snow"
 },
 {
  "src": "/images/solomon-2.jpg",
  "alt": "Solomon on a muddy walk"
 },
 {
  "src": "/images/mali-1.jpg",
  "alt": "Solomon in a Santa outfit"
 },
 {
  "src": "/images/zeus-1.jpg",
  "alt": "Zeus the Weimaraner with Callum"
 },
 {
  "src": "/images/alfie-1.jpg",
  "alt": "Alfie the cockapoo with Callum"
 },
 {
  "src": "/images/alfie-2.jpg",
  "alt": "Alfie relaxing at home"
 },
 {
  "src": "/images/orca-1.jpg",
  "alt": "Orca the springer spaniel on the couch"
 },
 {
  "src": "/images/orca-4.jpg",
  "alt": "Orca on a countryside walk"
 },
 {
  "src": "/images/black-dog-toy-1.jpg",
  "alt": "Bailey with her champagne bottle toy"
 },
 {
  "src": "/images/matilda-1.jpg",
  "alt": "Matilda the cocker spaniel giving Niamh a kiss"
 },
 {
  "src": "/images/molly-2.jpg",
  "alt": "Molly the labradoodle at home"
 },
 {
  "src": "/images/sparky-1.jpg",
  "alt": "Sparky the bearded dragon in his terrarium"
 },
 {
  "src": "/images/molly-3.jpg",
  "alt": "Molly in the doorway"
 },
 {
  "src": "/images/scuff-1.jpg",
  "alt": "Scuff in Christmas reindeer antlers"
 },
 {
  "src": "/images/orca-2.jpg",
  "alt": "Toby in the park with a stick"
 },
 {
  "src": "/images/orca-3.jpg",
  "alt": "Toby in the kitchen"
 },
 {
  "src": "/images/toby-1.jpg",
  "alt": "Lena at the back door"
 },
 {
  "src": "/images/toby-2.jpg",
  "alt": "Lena out with Niamh at a cafe"
 },
 {
  "src": "/images/lena-1.jpg",
  "alt": "Lena with a ball in the park"
 },
 {
  "src": "/images/lena-4.jpg",
  "alt": "Lena looking up on a walk"
 },
 {
  "src": "/images/lena-5.jpg",
  "alt": "Lena out in the city at night"
 },
 {
  "src": "/images/hero-ted-1.jpg",
  "alt": "Hero the Doberman and Ted cuddling on the couch"
 },
 {
  "src": "/images/finley-1.jpg",
  "alt": "Finley in the kitchen"
 },
 {
  "src": "/images/yubyub-1.jpg",
  "alt": "Mali being held"
 },
 {
  "src": "/images/mali-2.jpg",
  "alt": "Mali with Callum in the kitchen"
 },
 {
  "src": "/images/luffy-1.jpg",
  "alt": "Luffy the chocolate spaniel puppy with Callum"
 },
 {
  "src": "/images/bailey-1.jpg",
  "alt": "YubYub on a sunset walk"
 },
 {
  "src": "/images/bailey-3.jpg",
  "alt": "YubYub in the garden with a tennis ball"
 },
 {
  "src": "/images/daisy-rocky-1.jpg",
  "alt": "Daisy and Rocky cuddling on the chair"
 },
 {
  "src": "/images/arlo-1.jpg",
  "alt": "Arlo with Niamh"
 },
 {
  "src": "/images/arlo-2.jpg",
  "alt": "Arlo asleep in the car"
 },
 {
  "src": "/images/angela-pets-3.jpg",
  "alt": "Fraser the cat in a paper bag"
 },
 {
  "src": "/images/poppy-1.jpg",
  "alt": "Poppy the black Labrador"
 },
 {
  "src": "/images/angela-pets-1.jpg",
  "alt": "Angela's dogs by the fireplace"
 },
 {
  "src": "/images/angela-pets-5.jpg",
  "alt": "Angela's animals on the farm"
 }
]$gl$::jsonb) WITH ORDINALITY t(g, n)
    ),
    extra AS (
      SELECT g, 1000 + n AS n
      FROM jsonb_array_elements(CASE WHEN jsonb_typeof(to_jsonb(p.gallery_json)) = 'array' THEN to_jsonb(p.gallery_json) WHEN jsonb_typeof(to_jsonb(p.gallery_json)) = 'string' AND left(trim(p.gallery_json::text), 1) = '[' THEN p.gallery_json::text::jsonb ELSE '[]'::jsonb END) WITH ORDINALITY t(g, n)
      WHERE regexp_replace(regexp_replace(g->>'src', '^https?://(www\.)?grottositters\.com', ''), '^public/', '/')
            NOT IN (SELECT g->>'src' FROM orig)
    )
    SELECT jsonb_agg(g ORDER BY n) FROM (SELECT * FROM orig UNION ALL SELECT * FROM extra) a
  ),
  -- Reviews in total ("40+" on the page).
  review_total = 40
WHERE p.slug = 'callumandniamh';
