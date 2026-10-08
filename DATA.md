# Data fetching and freshness

## SWR keys

| Surface | SWR key | Reason |
|---|---|---|
| Menu, first page with an empty search | `null` | The Server Component already supplies the full menu and the first six dishes. No duplicate initial API request is needed. |
| Menu search or later page | `/api/dishes?search=<encoded-term>&page=<page>` or `/api/dishes?page=<page>` | Search and page are both part of the key so SWR caches separate result sets. Empty search omits the search parameter. |
| Order details | `/api/orders/${encodeURIComponent(orderId)}` | The resource ID identifies the order; the HTTP-only session cookie scopes the server response to its owner. |

All keys use the shared `src/lib/fetcher.ts`. It throws for non-OK
responses, allowing SWR's `error` state to report a failed request.

## Refresh rules and freshness

- Menu search waits 300 ms after typing before updating its SWR key. This
  avoids a request for every keystroke.
- Menu results use `keepPreviousData` so a prior result set remains visible
  while a new search/page request is pending.
- The first menu page uses `fallbackData` from the server and a `null` key
  while the search is empty. It therefore starts without an initial
  spinner or duplicate request.
- Order details use server-rendered `fallbackData` and `refreshInterval:
  5000` to poll status every five seconds. Revalidation on focus refreshes
  a tab when a user returns to it.
- No `staleTime` option is configured: SWR does not provide a native
  `staleTime` setting. Its cache is revalidated according to the key,
  focus behavior, polling rule, and built-in request deduplication.
- Menu data comes from the local JSON source; changes are observed on a
  subsequent request/navigation. Orders are stored in SQLite and status
  updates become visible on the next poll or focus revalidation.

See the actual key usage in `src/app/menu/MenuBrowser.tsx` and
`src/app/orders/[id]/OrderStatus.tsx`.
