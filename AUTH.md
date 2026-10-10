# Authentication and authorization

## Local demo sign-in

The project seeds two local accounts into SQLite:

- `customer@addiseats.local` / `CustomerPass123!`
- `kitchen@addiseats.local` / `KitchenPass123!`

Their passwords are stored as salted scrypt hashes. These public demo
credentials are only for this learning project and must not be reused for
real accounts.

## Session cookie

Successful sign-in creates an HMAC-SHA-256 signed session with a seven-day
expiry. The cookie is `httpOnly`, `sameSite=lax`, `path=/`, and `secure`
when `NODE_ENV` is production. `SESSION_SECRET` must be at least 32
characters; `.env.example` documents the variable without containing a
secret. Middleware verifies the signature with Web Crypto.

For Vercel, set `SESSION_SECRET` to a unique random value of at least 32
characters and set `NEXT_PUBLIC_SITE_URL` to the deployed site's HTTPS
origin. Vercel's function filesystem is not writable at the project root,
so the SQLite fallback uses the function's temporary directory; set
`ADDIS_EATS_DB_PATH=/tmp/addis-eats.sqlite` to make that choice explicit.
Temporary storage is not durable or shared between serverless instances.
This SQLite demo therefore does not provide reliable cross-instance order
persistence on Vercel; use a shared managed database before relying on
production orders.

`getSession()` is the server-side helper used by pages, route handlers,
and Server Actions. Logout deletes the cookie. Sessions are not stored in
a server-side revocation table, so signing out does not invalidate a
previously copied cookie.

## Protected pages and ownership

Middleware has a narrow matcher for `/checkout` and `/orders`. API routes
still check the session themselves. `/kitchen` checks the staff role in its
Server Component, and each kitchen mutation repeats that check.

Order queries include the session user ID in the database predicate. This
prevents access by changing an order ID in the URL. Order cancellation
also verifies owner and current order status in its SQL update.

## Safe return paths

Sign-in accepts only same-site root-relative paths as `next` destinations.
Absolute URLs, protocol-relative values such as `//example.com`, and
backslash variants fall back to `/`.

## Production boundary

This is a local demo auth implementation, not a substitute for a
production identity provider. Before handling real users, replace the
seeded accounts with managed identities and add account lifecycle,
revocation, operational monitoring, and a shared durable database.
