# Addis Eats

Addis Eats is a small Next.js App Router project for browsing Ethiopian
dishes, keeping a client-side cart, placing orders, and following order
status. The menu is read from `public/menu-data.json`.

## Run locally

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local`.
3. Set `SESSION_SECRET` in `.env.local` to a random value with at least
   32 characters. In PowerShell, generate one with:

   ```powershell
   [Convert]::ToHexString([Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
   ```

4. Start Next.js with `npm run dev` and open
   [http://localhost:3000](http://localhost:3000).

SQLite stores local orders in `data/addis-eats.sqlite`. Set
`ADDIS_EATS_DB_PATH` to change that location. The local database directory
is ignored by Git.

## Demo accounts

These seeded accounts are for local learning and are not a production
identity system:

| Role | Email | Password |
|---|---|---|
| Customer | `customer@addiseats.local` | `CustomerPass123!` |
| Kitchen staff | `kitchen@addiseats.local` | `KitchenPass123!` |

Passwords are stored as salted scrypt hashes. The sample credentials are
known and must not be used for real customer data.

## Main routes

- `/` — home page
- `/menu` — searchable, paginated menu
- `/menu/[id]` — dish details
- `/cart` — browser-persisted cart
- `/checkout` — authenticated order creation
- `/signin` — demo sign-in
- `/orders` and `/orders/[id]` — orders for the signed-in user
- `/kitchen` — staff-only order status controls
- `/api/dishes`, `/api/dishes/[id]`, `/api/orders`,
  `/api/orders/[id]` — JSON endpoints
- `/sitemap.xml`, `/robots.txt` — public discovery metadata

See [AUTH.md](./AUTH.md), [DATA.md](./DATA.md),
[STRATEGY.md](./STRATEGY.md), [BOUNDARY.md](./BOUNDARY.md), and
[PERF.md](./PERF.md) for implementation details.

## Checks

```bash
npm run lint
npm run build
```

## Known menu image mismatch

The existing dish data is intentionally unchanged. Several paths in
`public/menu-data.json` do not match files actually present in
`public/images` (including Doro Wot, Beef Tibs, Shiro, and Firfir).
Those images therefore cannot load until the JSON paths are mapped to
existing, correct image files. No image was downloaded, renamed, or
replaced for this project.

SQLite and the demo accounts make the project runnable locally; a real
deployment still needs a production identity provider, production-grade
account lifecycle, and a database designed for its hosting platform.
