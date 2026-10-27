-- Email verification (27 Oct 2026): new accounts confirm their email before
-- they can log in. Everyone who already has an account counts as confirmed.
-- Safe to run more than once.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'email_verified_at') THEN
    ALTER TABLE users ADD COLUMN email_verified_at TIMESTAMPTZ;
    UPDATE users SET email_verified_at = COALESCE(created_at, now());
  END IF;
END $$;
