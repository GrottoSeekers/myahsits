-- Saved quotes (owner, 7 Nov 2026): an owner who asks for their quote by
-- email on a sitter's page. Used to send their quote straight away and, if
-- they ticked the box, one reminder about two days later unless they have
-- sent a booking request. Safe to run more than once.

CREATE TABLE IF NOT EXISTS public.saved_quotes (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token            text NOT NULL UNIQUE,
  slug             text NOT NULL,
  email            text NOT NULL,
  first_name       text,
  summary          text,
  state            text,
  date_from        date,
  date_to          date,
  remind           boolean NOT NULL DEFAULT false,
  created_at       timestamptz NOT NULL DEFAULT now(),
  reminder_sent_at timestamptz,
  booked_at        timestamptz,
  unsubscribed_at  timestamptz
);
CREATE INDEX IF NOT EXISTS saved_quotes_due ON public.saved_quotes (created_at) WHERE remind AND reminder_sent_at IS NULL AND booked_at IS NULL AND unsubscribed_at IS NULL;
CREATE INDEX IF NOT EXISTS saved_quotes_email ON public.saved_quotes (lower(email), slug);

ALTER TABLE public.saved_quotes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS myah_website_access ON public.saved_quotes;
CREATE POLICY myah_website_access ON public.saved_quotes FOR ALL TO public USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
