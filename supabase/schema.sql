-- ═══════════════════════════════════════════════════════════════════
--  Grotto Sitters — SaaS Database Schema
--  Run this in your Supabase SQL editor (or psql) before seed.sql
-- ═══════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── USERS ────────────────────────────────────────────────────────────────────
-- Stores login credentials for sitters and owners.
-- IMPORTANT: Always bcrypt-hash passwords before inserting. Never store
-- plaintext. Use bcrypt cost factor ≥ 12.
CREATE TABLE IF NOT EXISTS users (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT        UNIQUE NOT NULL,
  password   TEXT        NOT NULL,          -- bcrypt hash only
  role       TEXT        NOT NULL DEFAULT 'sitter',  -- 'sitter' or 'owner'
  email_verified_at TIMESTAMPTZ,            -- set when they click the link in the confirm email
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── PROFILES ─────────────────────────────────────────────────────────────────
-- One profile per user (sitter or owner).
-- Each profile maps to a public page at /[slug].
CREATE TABLE IF NOT EXISTS profiles (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- URL slug:  "callum-and-niamh"  →  /profile/callum-and-niamh
  slug              TEXT        UNIQUE NOT NULL
                                CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),

  -- Core display fields
  name              TEXT        NOT NULL,    -- "Callum & Niamh"
  tagline           TEXT,                    -- hero sub-headline
  badge_text        TEXT,                    -- small pill in hero ("Currently in Australia…")
  bio               TEXT,                    -- plain text; paragraphs separated by \n\n

  -- Images
  profile_pic       TEXT,                    -- URL of main profile photo
  hero_images_json  JSONB NOT NULL DEFAULT '[]',   -- [{src, pos}]
  about_images_json JSONB NOT NULL DEFAULT '[]',   -- [{src, alt}]

  -- Content blobs
  gallery_json      JSONB NOT NULL DEFAULT '[]',   -- [{src, alt}]
  reviews_json      JSONB NOT NULL DEFAULT '[]',   -- [{text, name, initials, platform}]
  platforms_json    JSONB NOT NULL DEFAULT '[]',   -- [{name, url, emoji, description}]
  review_requests_json JSONB NOT NULL DEFAULT '[]', -- [{token, created_at, status, reviewer_name?}]
  account_type      TEXT  NOT NULL DEFAULT 'solo',  -- 'solo' or 'joint'
  profile_type      TEXT  NOT NULL DEFAULT 'sitter', -- 'sitter' or 'owner'
  location          TEXT,                           -- city/area for owner listings
  pets_json         JSONB NOT NULL DEFAULT '[]',   -- [{name, type, breed, age, temperament, special_needs, photo_url}]
  amenities_json    JSONB NOT NULL DEFAULT '[]',   -- ["WiFi", "Parking", ...]
  looking_for       TEXT,                           -- what owner wants in a sitter
  contact_email     TEXT,                           -- where enquiries go
  whatsapp_number   TEXT,                           -- optional WhatsApp
  headings_json     JSONB NOT NULL DEFAULT '{}',   -- {about_label, about_title, reviews_label, ...}
  theme_json        JSONB NOT NULL DEFAULT '{}',   -- {background, accent, accent_light, text, text_soft}

  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- Auto-bump updated_at on every row change
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── LISTINGS ─────────────────────────────────────────────────────────────────
-- Date-based sit requests posted by owners.
-- Each listing references the owner's profile (which holds the reusable
-- home / pets "master") and adds dates + description for a specific sit.
CREATE TABLE IF NOT EXISTS listings (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id  UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  title       TEXT        NOT NULL,               -- "2 weeks in Sydney with 2 dogs"
  description TEXT,                               -- sit-specific details
  date_from   DATE        NOT NULL,
  date_to     DATE        NOT NULL,
  status      TEXT        NOT NULL DEFAULT 'active'
                          CHECK (status IN ('active', 'filled', 'cancelled')),

  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);


DROP TRIGGER IF EXISTS listings_updated_at ON listings;
CREATE TRIGGER listings_updated_at
  BEFORE UPDATE ON listings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ── BRING OLDER TABLES UP TO DATE ────────────────────────────────────────────
-- CREATE TABLE IF NOT EXISTS skips tables that already exist, so databases set
-- up before a column was added never got it. These add any that are missing;
-- each is a no-op where the column is already there.
ALTER TABLE users    ADD COLUMN IF NOT EXISTS role       TEXT        NOT NULL DEFAULT 'sitter';
ALTER TABLE users    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tagline              TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS badge_text           TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio                  TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_pic          TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hero_images_json     JSONB NOT NULL DEFAULT '[]';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS about_images_json    JSONB NOT NULL DEFAULT '[]';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gallery_json         JSONB NOT NULL DEFAULT '[]';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS reviews_json         JSONB NOT NULL DEFAULT '[]';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS platforms_json       JSONB NOT NULL DEFAULT '[]';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS review_requests_json JSONB NOT NULL DEFAULT '[]';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS account_type         TEXT  NOT NULL DEFAULT 'solo';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_type         TEXT  NOT NULL DEFAULT 'sitter';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS location             TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pets_json            JSONB NOT NULL DEFAULT '[]';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS amenities_json       JSONB NOT NULL DEFAULT '[]';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS looking_for          TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS contact_email        TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS whatsapp_number      TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS headings_json        JSONB NOT NULL DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS theme_json           JSONB NOT NULL DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS created_at           TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at           TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE listings ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS status      TEXT        NOT NULL DEFAULT 'active';
ALTER TABLE listings ADD COLUMN IF NOT EXISTS created_at  TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE listings ADD COLUMN IF NOT EXISTS updated_at  TIMESTAMPTZ NOT NULL DEFAULT now();


-- ── MESSAGING ────────────────────────────────────────────────────────────────
-- Owner ↔ sitter threads (/messages). These were created directly in Supabase
-- when messaging shipped; recorded here so a fresh database matches the code.
-- IF NOT EXISTS makes this a no-op where they already exist.
CREATE TABLE IF NOT EXISTS conversations (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  sitter_profile_id  UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  owner_profile_id   UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  listing_id         UUID        REFERENCES listings(id) ON DELETE SET NULL,
  last_message_at    TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);


CREATE TABLE IF NOT EXISTS messages (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id    UUID        NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_profile_id  UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,  -- messages_sender_profile_id_fkey
  body               TEXT        NOT NULL,
  read_at            TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);



-- ── APPLICATIONS ─────────────────────────────────────────────────────────────
-- A sitter applying for an owner's listing. Read by /applications (and counted
-- on the Edit listing page); the owner shortlists or declines each one.
CREATE TABLE IF NOT EXISTS applications (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id  UUID        NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  profile_id  UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE, -- the sitter
  message     TEXT,                                -- the sitter's note to the owner
  date_fit    TEXT,                                -- e.g. "Free for all 14 days"
  tags_json   JSONB       NOT NULL DEFAULT '[]',   -- ["Dogs", "Works from home"]
  status      TEXT        NOT NULL DEFAULT 'new'
                          CHECK (status IN ('new', 'shortlisted', 'declined', 'confirmed')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (listing_id, profile_id)
);



-- ── SAVED SITS ───────────────────────────────────────────────────────────────
-- Listings a sitter has hearted. Shown on /saved.
CREATE TABLE IF NOT EXISTS saved_sits (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id  UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE, -- the sitter
  listing_id  UUID        NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (profile_id, listing_id)
);


-- Saved searches and how the sitter wants to hear about matches (/saved).
--   saved_searches_json: [{id, name, terms, on}]
--   alert_prefs_json:    {email, push, weekly}
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS saved_searches_json JSONB NOT NULL DEFAULT '[]';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS alert_prefs_json    JSONB NOT NULL DEFAULT '{"email": true, "push": true, "weekly": false}';


-- ── NOTIFICATIONS ────────────────────────────────────────────────────────────
-- Everything that happens on an account. Shown on /notifications; written by
-- src/lib/notify.ts (new message, shortlisted by an owner, new review).
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id  UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  kind        TEXT        NOT NULL DEFAULT 'account'
                          CHECK (kind IN ('urgent', 'message', 'sit', 'review', 'match', 'account')),
  title       TEXT        NOT NULL,
  body        TEXT,
  link        TEXT,                                -- where the button goes
  cta         TEXT,                                -- button label
  read        BOOLEAN     NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- What also leaves the page (email/push): {applications, messages, sit, matches, product}
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notify_prefs_json JSONB NOT NULL DEFAULT '{"applications": true, "messages": true, "sit": true, "matches": false, "product": false}';


-- ── ID VERIFICATION ──────────────────────────────────────────────────────────
-- /verification. The sitter starts a check (status -> pending); whoever reviews
-- it sets verified_id = true, id_check_status = 'verified' and id_verified_at.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verified_id     BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS id_check_status TEXT    NOT NULL DEFAULT 'none'
  CHECK (id_check_status IN ('none', 'pending', 'verified'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS id_submitted_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS id_verified_at  TIMESTAMPTZ;
-- Uploaded ID photos (private 'id-documents' storage; deleted after review)
-- and the reason if a check is rejected. See supabase/id-verification.sql.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS id_doc_path      TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS id_selfie_path   TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS id_reject_reason TEXT;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_check_status_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_id_check_status_check
  CHECK (id_check_status IN ('none', 'pending', 'verified', 'rejected'));


-- ── AVAILABILITY ─────────────────────────────────────────────────────────────
-- /availability. Day map of when the sitter is free, and the sits they'll take.
--   availability_json:       { "YYYY-MM-DD": "free" | "maybe" }
--   availability_prefs_json: { lengths: [...], pets: [...], notice }
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS availability_json       JSONB NOT NULL DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS availability_prefs_json JSONB NOT NULL DEFAULT '{"lengths": [], "pets": [], "notice": "Any time"}';


-- ── CONFIRMED SITS ───────────────────────────────────────────────────────────
-- A sitter booked onto a listing. /sits/[id] is the handover pack; booked days
-- show on /availability, and the next one on /notifications and /verification.
CREATE TABLE IF NOT EXISTS sits (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id         UUID        NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  sitter_user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sitter_profile_id  UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  conversation_id    UUID,                          -- the owner/sitter thread
  checklist_json     JSONB       NOT NULL DEFAULT '{}',  -- {"0": true, ...} "Before the handover"
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (listing_id, sitter_user_id)
);


-- Handover details on the listing (set on Edit listing; read by /sits/[id]).
--   handover_json: { address, address_note, owner_away, owner_away_note,
--                    house_notes: [{label, value}], emergency: [{label, value, note}] }
-- Pets' daily routines live on profiles.pets_json as routine: [{when, what}].
ALTER TABLE listings ADD COLUMN IF NOT EXISTS arrival       TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS keys          TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS handover_json JSONB NOT NULL DEFAULT '{}';


-- ── INVITES ──────────────────────────────────────────────────────────────────
-- An owner inviting a sitter to a listing from /find-a-sitter. The invite also
-- opens the owner/sitter conversation for that listing (opened_conversation
-- records whether it created it, so Undo can tidy an empty one away).
CREATE TABLE IF NOT EXISTS invites (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id           UUID        NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  owner_profile_id     UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  sitter_profile_id    UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  conversation_id      UUID,
  opened_conversation  BOOLEAN     NOT NULL DEFAULT false,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (listing_id, sitter_profile_id)
);



-- ── OWNER HANDOVER ───────────────────────────────────────────────────────────
-- Set once on /owner/profile/edit ("the same whoever is sitting"); released to
-- a sitter on /sits/[id] once confirmed. A listing's own handover_json overrides.
--   { address, access, wifiName, wifiPass, vet, vetOoh, neighbour, mobile,
--     notes: [{label, value}] }
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS handover_json JSONB NOT NULL DEFAULT '{}';


-- ── CONFIRMED APPLICATIONS ───────────────────────────────────────────────────
-- "Confirm sitter" on /applications marks the chosen application 'confirmed'.
-- Re-create the status check so databases set up before this allow it.
ALTER TABLE applications DROP CONSTRAINT IF EXISTS applications_status_check;
ALTER TABLE applications ADD CONSTRAINT applications_status_check
  CHECK (status IN ('new', 'shortlisted', 'declined', 'confirmed'));


-- ── REVIEW TOTAL ─────────────────────────────────────────────────────────────
-- Reviews a sitter has across every platform (more than are written out on
-- their page). The profile shows the larger of this and the reviews listed.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS review_total INT;

-- ── BRING OLDER MESSAGING / SIT TABLES UP TO DATE ───────────────────────────
-- Tables that already existed on an older database keep their rows and gain
-- any columns added since. (Columns that must be filled in are added without
-- NOT NULL so existing rows are untouched.)
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS sitter_profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS owner_profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS listing_id UUID REFERENCES listings(id) ON DELETE SET NULL;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMPTZ;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE messages ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS sender_profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS body TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE applications ADD COLUMN IF NOT EXISTS listing_id UUID REFERENCES listings(id) ON DELETE CASCADE;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS message TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS date_fit TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS tags_json JSONB NOT NULL DEFAULT '[]';
ALTER TABLE applications ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'new';
ALTER TABLE applications ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE saved_sits ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE saved_sits ADD COLUMN IF NOT EXISTS listing_id UUID REFERENCES listings(id) ON DELETE CASCADE;
ALTER TABLE saved_sits ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'account';
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS body TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS link TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS cta TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS read BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE sits ADD COLUMN IF NOT EXISTS listing_id UUID REFERENCES listings(id) ON DELETE CASCADE;
ALTER TABLE sits ADD COLUMN IF NOT EXISTS sitter_user_id UUID REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE sits ADD COLUMN IF NOT EXISTS sitter_profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE sits ADD COLUMN IF NOT EXISTS conversation_id UUID;
ALTER TABLE sits ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE invites ADD COLUMN IF NOT EXISTS listing_id UUID REFERENCES listings(id) ON DELETE CASCADE;
ALTER TABLE invites ADD COLUMN IF NOT EXISTS owner_profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE invites ADD COLUMN IF NOT EXISTS sitter_profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE invites ADD COLUMN IF NOT EXISTS conversation_id UUID;
ALTER TABLE invites ADD COLUMN IF NOT EXISTS opened_conversation BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE invites ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- ── INDEXES ──────────────────────────────────────────────────────────────────
-- Last, so every column they use already exists — including on an older
-- database where the columns were only just added by the ALTERs above.
CREATE INDEX IF NOT EXISTS profiles_slug_idx    ON profiles (slug);
CREATE INDEX IF NOT EXISTS profiles_user_id_idx ON profiles (user_id);
CREATE INDEX IF NOT EXISTS listings_profile_id_idx ON listings (profile_id);
CREATE INDEX IF NOT EXISTS listings_status_idx     ON listings (status);
CREATE INDEX IF NOT EXISTS listings_dates_idx      ON listings (date_from, date_to);
CREATE INDEX IF NOT EXISTS conversations_sitter_idx ON conversations (sitter_profile_id);
CREATE INDEX IF NOT EXISTS conversations_owner_idx  ON conversations (owner_profile_id);
CREATE INDEX IF NOT EXISTS messages_conversation_idx ON messages (conversation_id, created_at);
CREATE INDEX IF NOT EXISTS applications_listing_id_idx ON applications (listing_id);
CREATE INDEX IF NOT EXISTS saved_sits_profile_id_idx ON saved_sits (profile_id);
CREATE INDEX IF NOT EXISTS notifications_profile_id_idx ON notifications (profile_id, created_at DESC);
CREATE INDEX IF NOT EXISTS sits_sitter_user_id_idx ON sits (sitter_user_id);
CREATE INDEX IF NOT EXISTS invites_listing_id_idx ON invites (listing_id);

-- ── LET THE WEBSITE USE THE NEWER TABLES ─────────────────────────────────────
--
-- Supabase switches on row-level security for every new table, and a table
-- with security on but no rules refuses every write ("new row violates
-- row-level security policy"). MYAH signs people in itself and talks to the
-- database only from its server, with the project key in Vercel — the key
-- never reaches visitors' browsers. So each table gets one rule: the website
-- may read and write it. Security stays switched on.
-- Safe to run more than once.

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['applications','notifications','sits','invites','saved_sits','conversations','messages']
  LOOP
    IF to_regclass('public.' || t) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
      EXECUTE format('DROP POLICY IF EXISTS myah_website_access ON public.%I', t);
      EXECUTE format('CREATE POLICY myah_website_access ON public.%I FOR ALL TO public USING (true) WITH CHECK (true)', t);
    END IF;
  END LOOP;
END $$;


-- Tell the API layer to pick up new tables and columns straight away
-- (otherwise it can keep saying "Could not find the table … in the schema cache").
NOTIFY pgrst, 'reload schema';
