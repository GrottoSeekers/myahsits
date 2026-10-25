-- Move Callum & Niamh's login from callumandniamh@grottositters.com to
-- info@myahsits.com. Run in the Supabase SQL editor.
-- Your password, page, admin access and everything else stay the same:
-- admin access comes from the callumandniamh page, not the email.

-- STEP 1: check nothing else already uses the new address.
-- This should return no rows. If it returns one, stop and ask Claude:
-- that account would need removing first.
SELECT u.id, u.email, u.role, u.created_at
FROM users u
WHERE lower(u.email) = 'info@myahsits.com';

-- STEP 2: change the login email.
UPDATE users
SET email = 'info@myahsits.com'
WHERE id = (SELECT user_id FROM profiles WHERE slug = 'callumandniamh');

-- STEP 3: check it worked. This should show info@myahsits.com.
SELECT u.email, u.role, p.slug, p.name
FROM profiles p JOIN users u ON u.id = p.user_id
WHERE p.slug = 'callumandniamh';
