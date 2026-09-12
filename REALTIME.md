# Real-time MVP setup

The server uses Socket.IO on the same host and port as the REST API. It publishes public catalogue changes to all storefront clients and sends order and operational changes only to authenticated user or admin rooms.

## Client configuration

Both `client` and `dashboard` support these optional Vite variables:

- `VITE_API_URL` — REST base URL, including `/api/v1`. Defaults to `http://localhost:4000/api/v1`.
- `VITE_SOCKET_URL` — Socket.IO host. Defaults to `VITE_API_URL` without `/api/v1`.
- `VITE_STRIPE_PUBLISHABLE_KEY` — required in `client` to show Stripe's payment element.

Example for local storefront development:

```env
VITE_API_URL=http://localhost:4000/api/v1
VITE_SOCKET_URL=http://localhost:4000
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_replace_me
```

The existing `server/config/config.env` is unchanged. Its `FRONTEND_URL` and `DASHBOARD_URL` must match deployed browser origins so credentialed HTTP and WebSocket requests are allowed.
