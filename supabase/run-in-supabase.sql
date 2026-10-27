-- ═══════════════════════════════════════════════════════════════════
--  MYAH: everything to run in Supabase (25 Oct 2026)
--  Supabase → SQL Editor → New query → paste all of this → Run.
--  Every part is safe to run again, even if you ran it before.
--  It does not touch anyone's page, photos, reviews, messages or passwords.
-- ═══════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────
-- From supabase/id-verification.sql
-- ───────────────────────────────────────────────────────────────────
-- ID verification: everyone uploads photo ID + a selfie; the founders review
-- them on /admin/verifications. Run once in the Supabase SQL Editor
-- (project vutlmqzvakbmosrpicre). Safe to run more than once.

-- 1. Where each member's check is recorded.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verified_id      BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS id_check_status  TEXT    NOT NULL DEFAULT 'none';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS id_submitted_at  TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS id_verified_at   TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS id_doc_path      TEXT;   -- private file, deleted after review
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS id_selfie_path   TEXT;   -- private file, deleted after review
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS id_reject_reason TEXT;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_check_status_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_id_check_status_check
  CHECK (id_check_status IN ('none', 'pending', 'verified', 'rejected'));

-- 2. The founders' account is verified (it is the one that approves others).
UPDATE profiles
SET verified_id = true, id_check_status = 'verified', id_verified_at = COALESCE(id_verified_at, now())
WHERE slug = 'callumandniamh';

-- 3. A PRIVATE storage folder for the ID photos (no public links). Only the
--    website's server — which holds the project key — can read or write it.
INSERT INTO storage.buckets (id, name, public)
VALUES ('id-documents', 'id-documents', false)
ON CONFLICT (id) DO UPDATE SET public = false;

DROP POLICY IF EXISTS myah_id_documents ON storage.objects;
CREATE POLICY myah_id_documents ON storage.objects
  FOR ALL TO public
  USING (bucket_id = 'id-documents')
  WITH CHECK (bucket_id = 'id-documents');

NOTIFY pgrst, 'reload schema';

-- ───────────────────────────────────────────────────────────────────
-- From supabase/billing.sql
-- ───────────────────────────────────────────────────────────────────
-- Memberships: each member's Stripe customer and subscription, kept up to date
-- by the Stripe webhook (/api/billing/webhook). Run once in the Supabase SQL
-- Editor. Safe to run more than once.

CREATE TABLE IF NOT EXISTS billing (
  user_id                UUID        PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  stripe_customer_id     TEXT        UNIQUE,
  stripe_subscription_id TEXT,
  status                 TEXT        NOT NULL DEFAULT 'none',  -- Stripe subscription status, or 'none'
  plan                   TEXT,                                 -- price lookup key, e.g. myah_sitter_annual
  current_period_end     TIMESTAMPTZ,
  cancel_at_period_end   BOOLEAN     NOT NULL DEFAULT false,
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Same rule as the other tables (see allow-website-access.sql): only the
-- website's server talks to the database, so it may read and write this one.
ALTER TABLE public.billing ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS myah_website_access ON public.billing;
CREATE POLICY myah_website_access ON public.billing FOR ALL TO public USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';

-- ───────────────────────────────────────────────────────────────────
-- From supabase/launch-interest.sql
-- ───────────────────────────────────────────────────────────────────
-- The "launching soon" interest list: everyone who registers their email
-- before MYAH opens, so they can be emailed from /admin on launch day.
-- Safe to run more than once.

CREATE TABLE IF NOT EXISTS public.launch_interest (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email       text NOT NULL UNIQUE,
  role        text,
  source      text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  notified_at timestamptz
);

ALTER TABLE public.launch_interest ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS myah_website_access ON public.launch_interest;
CREATE POLICY myah_website_access ON public.launch_interest FOR ALL TO public USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';

-- ───────────────────────────────────────────────────────────────────
-- From supabase/allow-website-access.sql
-- ───────────────────────────────────────────────────────────────────
-- Let the website use the newer tables.
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

NOTIFY pgrst, 'reload schema';

-- ───────────────────────────────────────────────────────────────────
-- Founders' login: callumandniamh@grottositters.com → info@myahsits.com
-- Password, page and admin access stay the same (admin comes from the
-- callumandniamh page, not the email). If another account already uses
-- info@myahsits.com this step stops with a "duplicate key" error and
-- the login is left as it was: tell Claude.
-- ───────────────────────────────────────────────────────────────────
UPDATE users
SET email = 'info@myahsits.com'
WHERE id = (SELECT user_id FROM profiles WHERE slug = 'callumandniamh');

-- ───────────────────────────────────────────────────────────────────
-- Check: one row should show info@myahsits.com, verified, and true for
-- the billing and launch-list tables.
-- ───────────────────────────────────────────────────────────────────
SELECT u.email,
       p.slug,
       p.id_check_status                              AS id_check,
       to_regclass('public.billing') IS NOT NULL         AS billing_table,
       to_regclass('public.launch_interest') IS NOT NULL AS launch_list_table
FROM profiles p JOIN users u ON u.id = p.user_id
WHERE p.slug = 'callumandniamh';

-- ───────────────────────────────────────────────────────────────────
-- From supabase/email-verification.sql (27 Oct 2026)
-- ───────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'email_verified_at') THEN
    ALTER TABLE users ADD COLUMN email_verified_at TIMESTAMPTZ;
    UPDATE users SET email_verified_at = COALESCE(created_at, now());
  END IF;
END $$;
