# Application strategy

## Route groups by purpose

### Public discovery

- `/` introduces the restaurant.
- `/menu` reads the server menu data and adds debounced client search and
  URL-based pagination.
- `/menu/[id]` loads a real dish, renders metadata and `MenuItem` JSON-LD,
  and offers a client-side add-to-cart control.
- `/api/dishes` and `/api/dishes/[id]` expose public menu data.
- `/sitemap.xml`, `/robots.txt`, and generated Open Graph images support
  discovery without including private pages.

### Customer-private

- `/cart` is entirely client-side until checkout.
- `/checkout` requires a valid session. The server validates item IDs and
  quantities, reloads prices from the menu file, and computes the total.
- `/orders` and `/orders/[id]` read only rows belonging to the signed-in
  user. The order detail page sends its server-loaded seed to an SWR client
  that refreshes status every five seconds.

### Staff

- `/kitchen` checks the signed session role on the server.
- Every kitchen status action independently checks that role before
  updating an order.

## Data flow

The public menu file is the source of truth for dish names, descriptions,
images, and prices. The cart persists only dish IDs and quantities in
browser storage. Order writes persist a price/name snapshot to SQLite so
that order history stays consistent even if the menu changes later.

See [BOUNDARY.md](./BOUNDARY.md) for trust and authorization boundaries.
