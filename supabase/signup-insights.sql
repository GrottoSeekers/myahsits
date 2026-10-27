-- Where sign-ups come from (27 Oct 2026), shown on /admin: country and city
-- (never closer), how they found MYAH and whether they were on a phone.
-- Safe to run more than once.
ALTER TABLE public.launch_interest ADD COLUMN IF NOT EXISTS country  text;
ALTER TABLE public.launch_interest ADD COLUMN IF NOT EXISTS region   text;
ALTER TABLE public.launch_interest ADD COLUMN IF NOT EXISTS city     text;
ALTER TABLE public.launch_interest ADD COLUMN IF NOT EXISTS referrer text;
ALTER TABLE public.launch_interest ADD COLUMN IF NOT EXISTS device   text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS signup_country text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS signup_city    text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS signup_device  text;
NOTIFY pgrst, 'reload schema';
