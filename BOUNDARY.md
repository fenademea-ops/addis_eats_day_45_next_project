# Trust and data boundaries

## Browser to server

The browser is not trusted to choose a price, subtotal, total, owner, role,
or order status. Checkout sends only dish IDs and quantities. The server
validates them, reloads the current dish prices from `public/menu-data.json`,
and calculates the subtotal, delivery fee, and total itself.

The cart is persisted in local storage and contains no private server data.
Changing local storage may change the cart, but it cannot grant access to a
different user's order or set an authoritative order price.

## Session boundary

The browser receives a seven-day HMAC-signed session cookie marked
`httpOnly`, `sameSite=lax`, and `secure` in production. The signing key is
read from `SESSION_SECRET`; it is never included in the repository.
Middleware protects `/checkout` and `/orders`. API handlers, Server
Components, and Server Actions also perform their own session and role
checks instead of treating middleware as the only defense.

## Ownership and staff roles

Order reads filter by both the requested order ID and the authenticated
user ID. A missing order and another user's order both return not found.
Cancellation is an atomic update constrained by order ID, owner ID, and
the cancellable `received` status.

Kitchen pages and mutations require the signed-in `staff` role on the
server. A hidden field or client-side role indicator is never used as
authorization.

## Local-demo limitations

The SQLite file is suitable for local development, not serverless or
multi-instance deployment. Demo accounts are source-seeded, and there is
no registration, password reset, session revocation store, payment
processor, or production account provider. Deployments need durable shared
storage and a production identity lifecycle.
