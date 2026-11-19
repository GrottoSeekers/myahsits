-- Bot protection (owner, 19 Nov 2026): one row per attempt on a form that
-- sends email, so lib/antibot.ts can allow a few an hour per connection.
-- The connection is stored as a one-way hash, never the address itself.
-- Old rows are cleared by the daily job. Safe to run more than once.

CREATE TABLE IF NOT EXISTS public.rate_limits (
  id         bigserial PRIMARY KEY,
  bucket     text NOT NULL,
  key        text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS rate_limits_lookup ON public.rate_limits (bucket, key, created_at);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS myah_website_access ON public.rate_limits;
CREATE POLICY myah_website_access ON public.rate_limits FOR ALL TO public USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
