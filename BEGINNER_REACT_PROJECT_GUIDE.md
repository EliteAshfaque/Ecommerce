# Lumera Ecommerce — Beginner-Friendly Project Guide

This is a full-stack ecommerce application with two React applications and one Node.js API:

1. **Storefront (`client/`)** — the website a customer uses to browse, save products, buy, pay, manage an account, and request returns.
2. **Admin dashboard (`dashboard/`)** — the protected website used by administrators to manage products, orders, customers, promotions, storefront content, messages, and returns.
3. **API server (`server/`)** — an Express application that owns authentication, business rules, PostgreSQL data, Stripe payments, uploads, email, AI search, and real-time events.

The application is branded **LUMERA** and sells in AED. It is a JavaScript project using ES modules (`import` / `export`), React 19, Vite, Tailwind CSS, Redux Toolkit, Express, PostgreSQL, Socket.IO, and Stripe.

> **Important:** This document describes the code that exists now. Environment files contain secrets and are intentionally ignored by Git; examples below use fake values. Do not put a password, Stripe secret, database URL, JWT secret, SMTP password, or Cloudinary secret in a `VITE_*` variable, a committed file, or a browser bundle.

---

## 1. The application in one picture

```text
Customer browser                 Admin browser
client/ (Vite + React)           dashboard/ (Vite + React)
        |                                  |
        | Axios REST requests + cookie     | Axios REST requests + cookie
        | Socket.IO events                 | Socket.IO events
        +------------ HTTPS / WSS ---------+
                         |
                         v
             server/ (Express + Socket.IO)
          routes -> middleware -> controllers
                         |
          +--------------+-------------------+----------------+
          v              v                   v                v
     PostgreSQL       Stripe            Cloudinary       SMTP / Gemini
     permanent data   payments/webhooks image storage    email / AI search
```

The short version of a customer purchase is:

```text
Product card -> Redux cart -> Payment page -> POST /order/new
  -> server re-checks price/stock, reserves stock, saves draft order
  -> server creates Stripe PaymentIntent -> client confirms Stripe payment
  -> Stripe sends signed webhook -> server marks payment Paid
  -> Socket.IO informs customer and administrators -> screens refetch data
```

The server, not the browser, is the source of truth for product prices, stock, discounts, order payment state, roles, and permissions. This is essential: a user can edit browser data, but cannot be trusted to decide a payment amount or whether they are an admin.

---

## 2. React fundamentals used in this project

### 2.1 What React is

React is a UI library. A React application describes **what the screen should look like for the current data**, rather than manually changing HTML one element at a time.

```jsx
function Greeting({ name }) {
  return <h1>Hello, {name}</h1>;
}
```

`Greeting` is a **component**: a JavaScript function that returns JSX. JSX looks like HTML but is JavaScript syntax compiled by Vite/Babel tooling into browser instructions. `{name}` means “evaluate this JavaScript value here.”

This project follows the same pattern. For example, `client/src/components/Products/ProductCard.jsx` receives one product and displays a card; `client/src/pages/Home.jsx` composes several smaller home components; `client/src/App.jsx` composes the shared shell and chooses a page from the URL.

### 2.2 Components, composition, and single responsibility

A component should have a clear job. Components can be nested like building blocks.

```text
App
├── Navbar, Sidebar, overlays, LiveUpdates, Footer   (shared shell)
└── Routes
    └── Home
        ├── HeroSlider
        ├── DepartmentRail
        ├── ProductSlider
        │   └── ProductCard (many times)
        └── NewsletterSection
```

The outer component supplies data; the inner component focuses on rendering or a small interaction. `ProductSlider` does not need to know how the entire home page works, and `ProductCard` does not need to know which page placed it on screen. That makes components reusable.

### 2.3 Props: input flowing down

**Props** are read-only inputs passed from a parent to a child. In this project:

```jsx
// Home.jsx (parent)
<ProductSlider products={newProducts} title="New arrivals" />

// ProductSlider.jsx (child)
const ProductSlider = ({ products = [], title }) => { /* render products */ };
```

`products` and `title` are props. The child must not directly change them. If an action needs to affect data owned by the parent, the parent can pass a callback prop:

```jsx
<Pagination currentPage={currentPage} onPageChange={goToPage} />
```

`Pagination` calls `onPageChange(nextPage)`; `Products.jsx` decides how to update the URL and fetch products. This is the normal React direction: **data down through props, events up through callbacks**.

Project examples of prop-based composition include:

| Child component | Important props | Parent/use |
|---|---|---|
| `ProductCard` | `product`, `layout` | Product grids, sliders, favourites, related items |
| `ProductFilters` | `filters`, `onChange`, `onClear`, `categories`, `mobile` | `pages/Products.jsx` |
| `Pagination` | `currentPage`, `totalPages`, `onPageChange` | `pages/Products.jsx` |
| `ReviewsContainer` | `productId` | `pages/ProductDetail.jsx` |
| `PaymentForm` | `amount` | `pages/Payment.jsx`, inside Stripe `Elements` |
| `AddressBook` | `onSelect`, `deliveryIntent`, `onIntentHandled` | `ProfilePanel` |
| `ProductForm` | `initial`, `onSubmit`, `onCancel`, `saving` | Admin Products page |
| `StatCard` | `label`, `value`, `caption`, `icon`, `tone` | Admin Overview and Sales pages |

### 2.4 State: data that changes over time

**State** is data React remembers between renders. `useState` returns a current value and a function to update it.

```jsx
const [open, setOpen] = useState(false);

<button onClick={() => setOpen(true)}>Open</button>
{open && <Dialog />}
```

Calling `setOpen(true)` schedules a re-render. It does not mutate the old variable in place.

This project uses local state for information that belongs to one UI area:

- `LoginModal` stores the active mode and typed form values.
- `FAQ` stores which accordion answer is open.
- `ProductDetail` stores selected image and desired quantity.
- `Payment` stores shipping form fields, local validation errors, promotion input, selected address, and location state.
- `Contact`, `NewsletterSection`, `ProductForm`, `Storefront`, `Support`, and `Returns` store their own form/modal/loading state.
- `ProductCard` stores hover state for its image interaction.

Use **local `useState`** when only that component (or a closely related child) needs the value. Use Redux when unrelated screens need the same data, such as the cart or signed-in user.

### 2.5 Rendering lists and keys

Product cards, reviews, order lines, navigation links, and table rows are normally produced with `.map()`:

```jsx
{products.map((product) => (
  <ProductCard key={product.id} product={product} />
))}
```

`key` gives React a stable identity for each item. Prefer a database ID such as `product.id`, never an array index when items can be reordered, filtered, inserted, or deleted.

### 2.6 Conditional rendering

React uses normal JavaScript conditions to show loading states, errors, empty states, signed-in views, and modals:

```jsx
if (isCheckingAuth) return <AuthLoader />;

return authUser ? <ProfilePanel /> : <LoginModal />;
// or
{loading ? <Spinner /> : <ProductGrid products={products} />}
```

`App.jsx` displays a full-page loader while the initial `getUser()` request checks the cookie. `AdminRoute` displays a loader, redirects a guest to `/login`, and redirects a non-admin away from dashboard content.

### 2.7 Hooks used here

A **hook** is a React function beginning with `use`. Hooks must be called at the top level of a React component or custom hook, not conditionally or in a loop.

| Hook | Meaning | Project examples |
|---|---|---|
| `useState` | Component-local changing data | forms, accordions, mobile drawer, selected image |
| `useEffect` | Synchronise React with something outside rendering | initial API fetches, timers, sockets, browser storage, Maps script |
| `useMemo` | Cache a derived calculation until dependencies change | cart totals, filtered favourites, Stripe promise, related products, dashboard chart maxima |
| `useCallback` | Cache a function reference | slider scroll handler, address loading/callback functions, hero advance function |
| `useRef` | Keep a mutable value/DOM node without re-rendering | input focus, slider container, map/marker, current socket filter values |
| `useContext` | Read context supplied above the component | `useTheme()` in Navbar |
| `useDispatch` / `useSelector` | React-Redux hooks for sending actions and reading global Redux state | almost every data-driven screen |
| `useNavigate` | Navigate programmatically | checkout, search, payment completion |
| `useParams` | Read route placeholders | product ID in `/product/:id` |
| `useSearchParams` | Read/write URL query parameters | products filtering/search/page |
| `createPortal` | Render UI into another DOM location | Profile panel modal layer |

`useEffect` needs special care. Its dependency array tells React when to run it:

```jsx
useEffect(() => {
  dispatch(fetchProducts(filters));
}, [dispatch, filters]);
```

Effects should clean up subscriptions and timers. `HeroSlider` clears its interval; `LiveUpdates` removes socket listeners; `LocationPickerDialog` manages external Maps resources. Without cleanup, the app can leak work or respond to an event multiple times.

### 2.8 Context: a small shared service

`client/src/contexts/ThemeContext.jsx` creates a `ThemeContext`. `ThemeProvider` wraps the app in `main.jsx`, provides `{ theme, toggleTheme }`, saves the choice in `localStorage`, and adds/removes the `.dark` class on `<html>`.

`Navbar` calls `useTheme()` to read the current theme and toggle it. This avoids passing a theme prop through every intermediate component.

Context is useful for stable, app-wide concerns such as theme, locale, or an authenticated client. This project uses Redux for larger server/data state and uses context only for theme. Do not put every local value into context; it can make dependencies hard to follow.

### 2.9 `StrictMode`

Both `main.jsx` files wrap the app in `<StrictMode>`. In development React deliberately re-runs some lifecycle work to reveal unsafe effects. The Socket.IO components account for this with refs and listener cleanup. Seeing an effect run twice in development is not necessarily a production bug; it is often Strict Mode helping find one.

---

## 3. Repository map and startup path

```text
Ecommerce/
├── client/                         # Customer-facing React/Vite application
│   ├── index.html                  # HTML shell with <div id="root">
│   ├── vite.config.js              # React Vite build/dev configuration
│   ├── tailwind.config.js          # Tailwind tokens, content scan, animations
│   ├── postcss.config.js           # Tailwind + Autoprefixer processing
│   ├── .env                        # Browser build-time configuration; ignored
│   ├── public/                     # Static files copied unchanged to dist/
│   └── src/
│       ├── main.jsx                # React entry point/providers/global CSS
│       ├── App.jsx                 # shared UI shell, initial loads, routes
│       ├── index.css               # global theme, base styles, reusable classes
│       ├── App.css                 # older standalone styles; currently not imported by App
│       ├── pages/                  # route-level customer screens
│       ├── components/             # reusable UI grouped by feature
│       ├── store/                  # Redux store and feature slices
│       ├── contexts/               # Theme Context
│       ├── lib/                    # Axios, Socket.IO, Maps/location helpers
│       ├── data/                   # fallback/sample data
│       └── assets/                 # imported build assets
├── dashboard/                      # Admin React/Vite application
│   ├── index.html, vite.config.js, tailwind.config.js, postcss.config.js
│   ├── .env                        # admin browser configuration; ignored
│   └── src/                        # equivalent entry/app/pages/components/store/lib structure
├── server/                         # Node.js Express API and Socket.IO server
│   ├── server.js                   # creates HTTP server, schema, Socket.IO, listens
│   ├── app.js                      # Express middleware, webhook, route mounting
│   ├── config/loadEnv.js           # loads config/config.env using dotenv
│   ├── config/config.env           # server secret config; ignored
│   ├── database/db.js              # PostgreSQL `Pool`
│   ├── router/                     # URL -> middleware/controller mapping
│   ├── controller/                 # validation, business logic, database work
│   ├── middlewares/                # auth, role checks, async/error handling
│   ├── models/                     # SQL `CREATE TABLE` definitions
│   ├── realtime/socket.js          # Socket.IO server/auth/room/event helpers
│   ├── utils/                      # JWT, email, AI, seed, schema utilities
│   ├── scripts/                    # explicit data seed scripts
│   └── uploads/                    # temporary upload files; must be writable
├── REALTIME.md                     # concise existing Socket.IO setup notes
├── README.md                       # currently only the project title
└── BEGINNER_REACT_PROJECT_GUIDE.md # this guide
```

### 3.1 What happens when the customer site starts

1. The browser receives `client/index.html`. It contains the root element.
2. Vite serves source modules during development or compiled files from `client/dist/` after production build.
3. `client/src/main.jsx` calls `createRoot(...).render(...)` and supplies Redux, theme context, toast notifications, and global CSS.
4. `client/src/App.jsx` calls `getUser()`, `fetchProducts()`, and `fetchStorefront()` once in an effect.
5. While user identity is unknown, it displays `AuthLoader`. When the check finishes it mounts `BrowserRouter`, the common layout/overlays, `LiveUpdates`, the matched page, and the footer.
6. A page reads Redux/local state, renders, and responds to user actions. API results update Redux, which causes interested components to render again.

### 3.2 What happens when the admin site starts

`dashboard/src/main.jsx` supplies Redux and toast notifications. `dashboard/src/App.jsx` first dispatches `getUser()`. The nested protected route uses `AdminRoute` to ensure the user exists and `authUser.role === "Admin"`; only then does `DashboardLayout` render its `Outlet` (the selected admin page). The layout owns the navigation/sidebar and the inner route pages own their content.

### 3.3 What happens when the API starts

1. `server/server.js` imports `app.js`; importing `app.js` loads `config/config.env` first.
2. `database/db.js` creates a PostgreSQL connection pool and performs a simple database check.
3. `startServer()` runs `createTables()` to enable `pgcrypto`, create tables/indexes, and apply compatible `ALTER TABLE` upgrades.
4. Node's `createServer(app)` creates the HTTP server; `initializeSocketServer(httpServer)` attaches Socket.IO to that **same port**.
5. The server listens on `process.env.PORT`.

The automatic `CREATE TABLE IF NOT EXISTS` setup is convenient for this project. For a mature production system, use versioned database migrations as well, so every schema change has an auditable up/down history.

---

## 4. Routing and navigation

React Router maps URLs to components without a full browser page reload. `BrowserRouter` watches the history API; `<Link to="/products">` changes location client-side; `<Routes>` renders the matching `<Route>`.

### Customer routes — `client/src/App.jsx`

| URL | Page file | Purpose |
|---|---|---|
| `/` | `pages/Home.jsx` | Homepage: content-managed hero/categories/offers plus product sections |
| `/password/reset/:token` | `pages/Home.jsx` + `LoginModal` | Password reset deep link; modal reads the token/location |
| `/products` | `pages/Products.jsx` | Search, filters, sort, pagination, grid |
| `/product/:id` | `pages/ProductDetail.jsx` | One product, gallery, quantity, related items, reviews |
| `/cart` | `pages/Cart.jsx` | Full cart review and checkout link |
| `/favourites` | `pages/Favourites.jsx` | Signed-in saved products, local filtering |
| `/orders` | `pages/Orders.jsx` | Customer orders, return requests and status tabs |
| `/payment` | `pages/Payment.jsx` | Shipping/address, promotion, Stripe payment step |
| `/about` | `pages/About.jsx` | Brand/about information |
| `/faq` | `pages/FAQ.jsx` | Accordion frequently asked questions |
| `/contact` | `pages/Contact.jsx` | Contact form to the support inbox |
| anything else | `pages/NotFound.jsx` | 404-like fallback page |

The customer `Navbar`, `Sidebar`, `SearchOverlay`, `CartSidebar`, `ProfilePanel`, `LoginModal`, AI search modal, live update listener, delivery prompt, and `Footer` are mounted outside `Routes`. That is why they can appear on every customer page.

### Admin routes — `dashboard/src/App.jsx`

| URL | Page file | Access and purpose |
|---|---|---|
| `/login` | `pages/Login.jsx` | Admin sign-in screen; rejects a regular user UI-side |
| `/` | `pages/Overview.jsx` | Protected dashboard summary, trend and recent orders |
| `/orders` | `pages/Orders.jsx` | Protected fulfilment table and status changes/deletion rules |
| `/returns` | `pages/Returns.jsx` | Protected return workflow/moderation |
| `/support` | `pages/Support.jsx` | Protected contact inbox and response/status fields |
| `/products` | `pages/Products.jsx` | Protected product listing, create/edit/delete form |
| `/users` | `pages/Users.jsx` | Protected customer list/delete action |
| `/storefront` | `pages/Storefront.jsx` | Protected CMS for banners/categories/offers/news |
| `/sales` | `pages/Sales.jsx` | Protected promotions plus sales analytics |

Nested routes are important here: `AdminRoute` returns an `Outlet` only for an administrator, and `DashboardLayout` returns another `Outlet` inside the dashboard shell. Route protection in React improves the user experience, but is **not security by itself**. Express repeats the role check for every protected API endpoint.

### URL parameters and query strings

`ProductDetail` calls `useParams()` to obtain `id` from `/product/:id`. `Products` calls `useSearchParams()` to keep filters/search/page in the address bar, such as:

```text
/products?category=Beauty&search=serum&page=2&sort=price-low
```

This makes product results shareable and refresh-safe. The component translates values into `fetchProducts(filters)`; the thunk translates them into an API query string.

### Production routing requirement

`BrowserRouter` needs the web server to return `index.html` for a deep link such as `/product/uuid`, then React Router selects the page. Configure this history fallback in Nginx/hosting. If omitted, the homepage may work but refreshing a product page can return a server 404.

---

## 5. Customer pages, from top to bottom

### `pages/Home.jsx`

Reads `product` and `storefront` Redux state. It passes API-managed banners/categories/offers to presentational components and passes product groups such as `newProducts`/`topRatedProducts` to reusable sliders/cards. It is the landing-page composer, not the place where product fetching is implemented; `App.jsx` starts the fetch and `storefrontSlice`/`productSlice` store the result.

Its home components are:

- `HeroSlider` — rotating, clickable banner slides. It uses state/effect for an interval and cleans that interval up.
- `DepartmentRail` and `CategoryGrid` — category links; fallback category data is available when managed content is absent.
- `ProductSlider` — reusable horizontal scroll rail with refs, buttons, progress, and cards.
- `MarketplaceDeals`, `MarketplaceSignals`, `PopularSearches`, `FeatureSection` — merchandising/trust/discovery presentation.
- `RecentlyViewed` — reads locally stored product history and displays it through `ProductSlider`.
- `NewsletterSection` — controlled email form that posts to `/storefront/newsletter`.

### `pages/Products.jsx`

This is the catalogue/search page. It combines URL state with local UI state (`showFilters`, temporary text input) and Redux product data. When category, price, rating, availability, sort, search, or page changes, it dispatches `fetchProducts`. It renders `ProductFilters`, a responsive mobile filter area, a product-card grid, and `Pagination`.

The API accepts `availability`, `price`, `category`, `ratings`, `search`, `page`, and `sort`. Client-side fallback categories in `src/data/products.js` make category controls useful before CMS categories are populated.

### `pages/ProductDetail.jsx`

Gets the `id` route parameter, dispatches `fetchProductDetails(id)`, and clears stale product data when appropriate. It displays gallery images, price/stock, selected quantity, shipping/trust information, related products derived with `useMemo`, and `ReviewsContainer`.

Adding a product dispatches `addToCart({ product, quantity })`. The cart reducer limits quantity using the product's known stock, but checkout still rechecks on the server because the browser's copy can be stale. The page saves recently viewed product information for the home rail.

### `pages/Cart.jsx`

Reads `state.cart.cart`. It calculates AED values, maps cart lines, and dispatches `updateCartQuantity`, `removeFromCart`, or `clearCart`. The checkout button navigates to `/payment`. An empty cart shows a clear recovery link instead of an unusable checkout screen.

### `pages/Payment.jsx` and `components/PaymentForm.jsx`

`Payment` is the checkout coordinator. It reads the cart and auth user; requests active promotions and saved addresses; keeps shipping fields/local errors/delivery choice in component state; optionally fills location via the Maps/geolocation helper; and validates required fields before dispatching `placeNewOrder`.

The server returns Stripe's **PaymentIntent client secret**, an order ID, and server-calculated total. The page uses `@stripe/stripe-js` / `@stripe/react-stripe-js` `Elements` to supply Stripe context to `PaymentForm`. `PaymentForm` uses Stripe's `PaymentElement` and `stripe.confirmPayment()`. On success it clears the local cart, resets order flow state, shows a toast, and navigates to orders.

Never build or transmit raw card number fields yourself. Stripe Elements tokenizes/handles card entry, while the server's signed webhook establishes the final paid status.

### `pages/Favourites.jsx`

Reads server-backed `wishlist.products` from Redux and locally filters by text/category using `useMemo`. It shows a sign-in prompt by dispatching `toggleAuthPopup` if there is no authenticated user. The shared `ProductCard` displays cards and can toggle a saved item.

### `pages/Orders.jsx`

For an authenticated customer, dispatches `fetchMyOrders()` and separately reads `/order/returns/me`. It has status tabs, expandable `OrderCard`s, order items/payment/shipping display, and `ReturnRequestForm`. A customer can submit supported return reasons and line quantities with `POST /order/:orderId/returns`. The page groups returns by order using `useMemo`.

### `pages/Contact.jsx`

Uses a controlled form object (`form`) and local submitting/error state. It performs basic client validation, posts to `/storefront/contact`, displays toast feedback, and clears fields after success. The message later appears in the admin Support screen.

### `pages/FAQ.jsx`, `pages/About.jsx`, and `pages/NotFound.jsx`

- FAQ uses simple local state for the active accordion item.
- About is mostly presentational content and React Router links.
- NotFound catches unknown customer URLs and points the visitor back to useful navigation.

---

## 6. Admin pages

### `pages/Login.jsx`

Uses controlled email/password inputs, dispatches dashboard `login`, and reacts to `authUser`. The shared server auth route allows user accounts to log in technically, but `AdminRoute` and the server's `authorizeRoles("Admin")` prevent a normal user from using admin content.

### `pages/Overview.jsx`

Dispatches `fetchDashboardStats()` on mount. It composes reusable `StatCard` boxes, a small `SalesTrend` display, recent-order data, and links to operational pages. The API calculates its metrics from PostgreSQL rather than trusting dashboard calculations.

### `pages/Products.jsx` and `components/ProductForm.jsx`

Reads the `admin` Redux slice, fetches an optional category/page view, and opens `ProductForm` for create/edit. `ProductForm` owns local inputs and image files. Its parent chooses `createAdminProduct` (POST) or `updateAdminProduct` (PUT); those thunks send `FormData` when files are included. The server restricts these endpoints to admins, uploads images to Cloudinary, writes PostgreSQL, and emits a catalogue event.

### `pages/Orders.jsx`

Fetches all orders through `fetchAdminOrders`. Administrators can move only through allowed status transitions. The server requires a paid payment before fulfilment status changes; cancelling a paid order asks Stripe for a refund, restores stock when appropriate, and emits real-time changes. Paid orders cannot simply be deleted because they are financial records.

### `pages/Users.jsx`

Fetches paginated customer data using `fetchAdminUsers(page)` and can dispatch `deleteAdminUser`. The API filters sensitive fields and requires the admin role. In production, carefully decide data retention and auditing rules before allowing customer deletion.

### `pages/Sales.jsx`

Combines dashboard statistics with Redux CRUD thunks for promotion codes. It displays a revenue/category view and lets administrators create, edit, activate/deactivate, and delete code-based promotions. Checkout revalidates every code and its dates/minimum/discount server-side, so a browser cannot invent a discount.

### `pages/Storefront.jsx`

This is a small CMS. It has local state for selected resource (`banners`, `categories`, `offers`, or `news`), an editable item, saving/loading flags, and uses Axios directly for the generic `/admin/storefront/:resource` endpoints. Saving emits `storefront:changed`, so open shopper home pages refetch content.

### `pages/Support.jsx`

Loads `contact_messages` from `/admin/support/messages`, shows counts/statuses, and edits a selected message's status/admin reply. It uses page-local state rather than Redux because this isolated inbox data is not reused by other dashboard screens.

### `pages/Returns.jsx`

Loads all return requests, computes pending counts locally, opens a selected request, and PUTs its status/admin note. The server validates the allowed return workflow. It emits changes to the owning customer and to admins.

### Shared dashboard components

- `AdminRoute.jsx` — UI-level authentication/role gate; renders an `Outlet` on success.
- `DashboardLayout.jsx` — responsive dashboard sidebar/header, navigation, account info, logout, and child-route `Outlet`.
- `LiveUpdates.jsx` — one non-visual socket listener that refetches relevant operational Redux data.
- `ProductForm.jsx` — reusable controlled create/edit product form.
- `StatCard.jsx` — small metric card plus reusable `money()` formatter.

---

## 7. Styling, CSS, layout, hover, transitions, and responsive design

### 7.1 The styling stack

The apps use **Tailwind CSS** for most component styling. A Tailwind class is a small class with one visual responsibility:

```jsx
<button className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:scale-[1.02] hover:bg-accent-deep">
  Add to bag
</button>
```

Read it as: rounded corners, primary background, padding, small bold text, a transition, and a slightly larger/darker hover state. Tailwind scans `index.html` and `src/**/*.{js,jsx}` as configured in `tailwind.config.js`, then generates only the classes it finds during build.

`postcss.config.js` runs `tailwindcss` followed by `autoprefixer`, which adds browser vendor prefixes when needed. `index.css` starts with:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

These directives become Tailwind's generated CSS during Vite processing.

### 7.2 Global styling structure

Both applications have a similar global design system:

| File | Role |
|---|---|
| `client/src/index.css` | Customer global tokens, dark variables, base styles, app utility/component classes and keyframes |
| `dashboard/src/index.css` | Admin global tokens, base styles, dashboard component classes and float animation |
| each `tailwind.config.js` | Maps CSS variables to semantic Tailwind colors, fonts, and animation names |
| component/page JSX | Uses Tailwind utility classes close to the element being styled |
| `client/src/App.css` | Legacy standalone styles (`counter`, `hero`, etc.); it is not imported by current `main.jsx`/`App.jsx`, so do not rely on it unless you intentionally import/refactor it |

The CSS custom properties in `:root` represent semantic tokens: `--ink`, `--fog`, `--primary`, `--accent`, `--card`, `--border`, and so on. Tailwind maps them to classes such as `bg-fog`, `text-ink`, `bg-primary`, and `border-border`. The client `.dark` selector changes the variable values; `ThemeContext` toggles the class. This is better than sprinkling one fixed hex color throughout components because the visual system can be changed in one place.

### 7.3 Global CSS versus component-level styling

Use **global CSS** for resets, fonts, color tokens, global backgrounds, common keyframes, and reusable multi-rule patterns. Use **Tailwind utilities inside a component** for layout and small component-specific decisions. This repository does not use CSS Modules or styled-components.

For example, the `button` can be styled in JSX with utilities; a shared complex `.ambient-orb` or `.surface-card` style can live under `@layer components` in `index.css` so Tailwind understands layering and it is easy to reuse.

When adding a new visual pattern:

1. First use existing semantic tokens/classes (`bg-card`, `text-muted-foreground`, `border-border`).
2. If the pattern repeats, make a named class in `@layer components`.
3. If the values should be a design token, add a CSS variable and Tailwind mapping in **both** app configurations if both applications need it.
4. Avoid arbitrary colors scattered everywhere unless the design truly needs a one-off.

### 7.4 Layout and responsiveness

Tailwind is mobile-first. An unprefixed class applies at all sizes; `md:` applies at the medium breakpoint and above; `lg:` applies at large and above.

```jsx
<section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
```

This creates one card per row on small screens, two at `sm`, and four at `lg`. The customer sidebar/overlays and dashboard mobile menu use local state plus responsive classes to adapt navigation; page grids, product cards, checkout columns, cards, tables, and controls similarly use `sm:`, `md:`, and `lg:` utilities.

Keep these accessibility points in mind:

- A desktop table needs a usable mobile layout (horizontal scroll, simplified rows, or cards).
- Do not hide the only way to complete an action at a breakpoint.
- Use semantic `<button>`, `<label>`, `<input>`, `<nav>`, and headings before adding ARIA.
- Keep focus visible and ensure overlay dialogs can be escaped/closed and do not trap inaccessible background clicks.

### 7.5 Hover, focus, transitions, and animations

Common Tailwind state variants include `hover:`, `focus:`, `focus-visible:`, `active:`, and `disabled:`. Transitions animate the change **between states**:

```jsx
className="transition-colors duration-200 hover:bg-primary hover:text-primary-foreground"
```

This project uses hover emphasis on cards, links, buttons, images, and sidebar links. It uses `transition`, `transition-colors`, transform/scale states, borders/shadows, and opacity to avoid abrupt interactions. Prefer a modest duration (usually 150–300 ms) and ensure keyboard focus receives a comparable visible state.

Animations are named motion sequences. `tailwind.config.js` extends animations including `fade-up`, `fade-in`, `fade-in-up`, `drift`, `slide-in-left`, `slide-in-top`, `slide-in-right`, and `scale-in`. Customer `index.css` also declares keyframes such as `aurora-shift`, `glow-pulse`, `hero-pan`, and `ambient-float`. Use classes like `animate-fade-up` or `animate-drift`. The app's auth loaders use `animate-spin` for a clear loading indicator.

Animations should communicate a state change or add gentle hierarchy, not make reading harder. Respect users who prefer reduced motion when enhancing this system further with `motion-reduce:` variants or a `prefers-reduced-motion` rule.

### 7.6 Forms, cards, tables, modals, and buttons

- **Buttons:** Use `button` with `type="button"` outside forms or `type="submit"` inside forms. Disable while a request is pending to avoid duplicate API calls.
- **Forms:** The project mainly uses controlled inputs: value comes from state and `onChange` writes a new state value. `Payment`, LoginModal, Contact, AddressBook, admin ProductForm, Sales, Support, and Storefront are examples.
- **Cards:** Product cards and stat cards combine rounded containers, surface color, border/shadow, a responsive interior, and hover feedback. Reuse `ProductCard`/`StatCard` before duplicating markup.
- **Tables:** Admin order/customer pages map records to semantic table rows. Ensure an empty/loading/error branch exists before rendering a large table.
- **Modals/overlays:** Popup Redux flags control global overlays (`LoginModal`, search, cart, AI); a portal is used for `ProfilePanel`; page-local selected/open state controls admin dialogs and returns. Modals need a backdrop, close button, keyboard/focus behavior, and a clear loading/submit state.

---

## 8. Redux Toolkit: state management and data flow

### 8.1 Why Redux is used

Redux stores data shared across far-apart components in a predictable central store. A cart count appears in Navbar, CartSidebar, Cart page, and Payment page; user identity matters to navigation, profile, favourites, order pages, socket rooms, and route protection. Passing all of that through many prop layers would be awkward.

`configureStore` creates each app's store. `<Provider store={store}>` in `main.jsx` makes it available. A component reads a value with:

```jsx
const cart = useSelector((state) => state.cart.cart);
```

It changes state by dispatching an action:

```jsx
dispatch(addToCart({ product, quantity: 1 }));
```

### 8.2 Core terms

| Term | Plain meaning | Example here |
|---|---|---|
| Store | The complete Redux state tree | `client/src/store/store.js` |
| Slice | One feature's state plus its reducers/actions | `cartSlice`, `authSlice`, `productSlice` |
| Action | Description of an event, often with a payload | `cart/addToCart` with product/quantity |
| Reducer | Pure state-update rule responding to an action | `addToCart(state, action)` |
| Dispatch | Send an action/thunk to the store | `dispatch(fetchProducts(filters))` |
| Selector | Function/expression that reads store state | `state.auth.authUser` |
| Thunk | Async action that can call APIs and dispatch other actions | `fetchProducts`, `login`, `placeNewOrder` |
| `extraReducers` | Reducer cases for thunk pending/fulfilled/rejected actions | set `loading` and store API result |

Redux Toolkit uses Immer internally, so reducers look as though they mutate `state` (`state.cart.push(...)`). Immer safely produces a new immutable state behind the scenes. Do not perform network calls or random side effects inside a reducer.

### 8.3 Customer store — `client/src/store/store.js`

```text
state
├── auth        authSlice
├── popup       popupSlice
├── cart        cartSlice
├── product     productSlice
├── order       orderSlice
├── wishlist    wishlistSlice
└── storefront  storefrontSlice
```

| Slice | What it owns | Key actions/thunks |
|---|---|---|
| `authSlice` | `authUser` and flags for sign-up/login/session/profile/password/reset | register, login, getUser, logout, forgotPassword, resetPassword, updatePassword, updateProfile |
| `popupSlice` | UI-only booleans for auth/sidebar/search/cart/AI modal | `toggleAuthPopup`, `toggleSidebar`, `toggleSearchBar`, `toggleCart`, `toggleAIModal` |
| `cartSlice` | `cart` line items, persisted locally | `addToCart`, `removeFromCart`, `updateCartQuantity`, `clearCart` |
| `productSlice` | list/detail/new/top-rated products, filters, pagination, request/status/error values | fetch list/detail, post/delete review, AI search, `clearProduct` |
| `orderSlice` | customer orders and checkout flow (`orderStep`, intent, total, order ID) | fetch orders, place order, fetch one, reset/clear checkout actions |
| `wishlistSlice` | saved products and request state | fetch, toggle, clear |
| `storefrontSlice` | CMS categories, banners, offers, news | `fetchStorefront` |

There are two cart persistence implementations to notice. `cartSlice` persists under `lumera-cart-v1`, while `store.js` also preloads/subscribes under `forma-cart`. The current cart slice's own `lumera-cart-v1` logic is the one that aligns with cart actions; the old `forma-cart` store subscription is redundant and should be consolidated to one storage key in a future cleanup. Neither should ever store tokens, cards, or payment secrets.

### 8.4 Admin store — `dashboard/src/store/store.js`

```text
state
├── auth   dashboard authSlice
└── admin  adminSlice
```

The dashboard auth slice is intentionally smaller: login, session check, logout, and loading flags. `adminSlice` holds dashboard statistics, paginated users/products, orders, promotions, their loading/saving flags, and an error field. Its thunks map directly to admin API operations: fetch statistics/users/products/orders/promotions; create/update/delete product; update/delete order; and promotion CRUD.

Support, returns, and storefront CMS pages use Axios with local state rather than `adminSlice`. That is not wrong; it is a design boundary. If those values need to be shown or refreshed in multiple dashboard pages, moving them into an additional Redux slice would be sensible.

### 8.5 One complete Redux flow: add to cart

```text
1. ProductCard's button receives a click.
2. It dispatches addToCart({ product, quantity: 1 }).
3. cartSlice finds the existing line or appends one, respecting local stock.
4. Redux publishes the new state.
5. Navbar/CartSidebar/Cart/Payment selectors receive the updated cart and rerender.
6. cartSlice saves the cart to localStorage for the next refresh.
7. At checkout, POST /order/new verifies the authoritative price/stock again.
```

### 8.6 One complete async flow: products

```text
Products.jsx -> dispatch(fetchProducts(filters))
  -> thunk builds URLSearchParams and calls Axios
  -> product/fetchProducts/pending sets loading = true
  -> server GET /api/v1/product validates/query filters PostgreSQL
  -> thunk resolves/rejects
  -> fulfilled stores products/pages/groups OR rejected stores error
  -> selector-driven components rerender loading/grid/error state
```

### 8.7 Selectors and derived values

Current selectors are inline functions like `(state) => state.auth.authUser`. That is fine for simple reads. When a selector is repeated or expensive, create a named selector function near the slice, for example:

```js
export const selectCartItems = (state) => state.cart.cart;
export const selectCartCount = (state) =>
  state.cart.cart.reduce((count, line) => count + line.quantity, 0);
```

Use `useMemo` for a derivation local to a component (filtered favourites, payment totals), and a reusable memoized selector when many components need the same derived global data.

---

## 9. REST API integration and frontend/backend communication

### 9.1 Axios clients

`client/src/lib/axios.js` and `dashboard/src/lib/axios.js` create Axios instances with:

```js
baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000/api/v1",
withCredentials: true,
```

Every relative call such as `axiosInstance.get("/product")` becomes `GET {baseURL}/product`. `withCredentials: true` is required because the JWT lives in an HTTP-only cookie; it tells the browser to include an allowed cross-origin cookie on API requests.

Most network work is placed in Redux thunks. Some isolated page-specific features call Axios directly: contact/newsletter, addresses, active promotions, customer/admin returns, support inbox, and storefront CMS. In either case, use `try/catch`, show a useful message, reset submitting state in `finally`, and do not trust browser-side validation alone.

### 9.2 API URL map

The actual base prefix is `/api/v1` in `server/app.js`.

| Group | Main endpoints | Who uses it |
|---|---|---|
| Health | `GET /health` | deployment/uptime check |
| Auth | `POST /auth/register`, `/auth/login`, `GET /auth/me`, `/auth/logout`, password/profile routes | customer and admin auth slices |
| Public products | `GET /product`, `GET /product/singleProduct/:id` | customer catalogue/detail, admin product view |
| Admin products | `POST /product/admin/create`, `PUT /product/admin/update/:id`, `DELETE /product/admin/delete/:id` | dashboard Products |
| Reviews/AI | `PUT/DELETE` review routes; `POST /product/ai-search` | detail reviews, AI modal; requires signed-in user |
| Orders | `POST /order/new`, customer order/detail/returns routes, admin order/returns routes | payment, customer Orders, dashboard Orders/Returns |
| Payments | `POST /payment/webhook` | Stripe only; raw signed payload |
| Wishlist | `GET/POST/DELETE /wishlist...` | ProductCard/Favourites/LiveUpdates; authenticated |
| Addresses | `GET/POST /address`, `PUT/DELETE /address/:id`, default route | Profile/Payment/delivery prompt; authenticated |
| Promotions | public `GET /promotion/active`, protected `/promotion/admin...` | Payment and dashboard Sales |
| Storefront | public `GET /storefront`, contact/newsletter posts | Home, Contact, Newsletter |
| Storefront CMS | `/admin/storefront/:resource` CRUD | dashboard Storefront; admin-only |
| Admin/Support | users/statistics and `/admin/support/messages` routes | dashboard Overview/Users/Support; admin-only |

### 9.3 Server request lifecycle

An incoming API request passes through:

```text
Express app middleware
  -> CORS / cookie parser / JSON or upload parser
  -> route matches URL and HTTP method
  -> isAuthenticated (when needed)
  -> authorizeRoles("Admin") (when needed)
  -> controller validates input and runs business rules
  -> PostgreSQL/Stripe/Cloudinary/SMTP work
  -> JSON success response or next(error)
  -> errorMiddleware returns { success: false, message }
```

`catchAsyncErrors` turns rejected async controller promises into Express errors. `errorMiddleware` normalizes status/message and recognizes duplicate key (`23505`) and JWT problems. Frontend thunks normally read `error.response?.data?.message`, toast it, and use `rejectWithValue(message)` so Redux stores an error/loading result.

### 9.4 CORS and cookies

The server allows the configured `FRONTEND_URL` and `DASHBOARD_URL`; it permits extra localhost Vite ports only outside production. CORS uses `credentials: true` and only `GET`, `POST`, `PUT`, `DELETE`. Production browser origins must exactly match the public origin strings, including scheme (`https://`) and port if nonstandard.

Login/register creates a signed JWT and sends it in an HTTP-only `token` cookie. JavaScript cannot read an HTTP-only cookie, which reduces token theft from many XSS situations. When `NODE_ENV=production` or `FRONTEND_URL` begins with HTTPS, cookie options are `secure: true` and `sameSite: "none"`; HTTPS is mandatory in that scenario.

The response also currently includes `token` JSON from `sendToken`. Frontends do not need it because the cookie authenticates requests. A security-hardening improvement is to remove the token from the JSON response and rely on the HTTP-only cookie only.

---

## 10. Database and server business rules

### 10.1 PostgreSQL connection

`server/database/db.js` creates a `pg.Pool`. A pool keeps reusable database connections for simultaneous storefront, admin, webhook, and socket work. It accepts either one managed-provider `DATABASE_URL` or separate `DB_USER`, `DB_HOST`, `DB_NAME`, `DB_PASSWORD`, `DB_PORT`. Set `DB_SSL=true` for providers that require encrypted connections (the current code uses `rejectUnauthorized: false`; prefer provider CA verification where available).

### 10.2 Tables and their relationships

| Table(s) | Purpose / relation |
|---|---|
| `users` | accounts, roles, avatar, password/reset values |
| `products` | catalogue, pricing, stock, images JSON, creator |
| `reviews` | one review per `(product_id, user_id)` |
| `wishlist_items` | one saved product per user/product pair |
| `orders` | buyer, server-calculated totals/tax/shipping/discount/status |
| `order_items` | lines belonging to an order and product |
| `shipping_info` | one delivery destination per order |
| `payments` | one Stripe payment/refund record per order |
| `return_requests`, `return_items` | return workflow and requested order-line quantities |
| `user_addresses` | saved customer addresses, at most one default per user |
| `promotions` | code-based sales campaigns |
| `storefront_categories/banners/offers/news` | admin-managed customer homepage content |
| `contact_messages`, `newsletter_subscribers` | support inbox and marketing signup |

Foreign keys and `ON DELETE` rules preserve relationships; unique indexes prevent duplicate wishlist rows/reviews/default addresses. `createTables()` creates independent tables before dependent tables and enables `pgcrypto` for `gen_random_uuid()`.

### 10.3 Product rules

`productController.js` supports public filtering/paging/details, reviews, AI-assisted filtering, and admin CRUD. Product create/update accepts uploads through `express-fileupload`; images are stored in Cloudinary and their metadata goes into the product `images` JSON column. Admin product writes emit `catalogue:changed`.

The AI search route requires a logged-in user and uses `GEMINI_API_KEY` via `utils/getAIRecommondation.js`. Treat an AI response as a recommendation/filter helper, not a security or pricing authority. The database still supplies the actual product records.

### 10.4 Checkout, stock, discount, VAT, and payment rules

The server's `placeNewOrder` controller is deliberately more authoritative than `Payment.jsx`:

1. Validates complete address/delivery data and a non-empty, valid item array.
2. Fetches products from PostgreSQL, rejects missing items/insufficient stock, and computes line prices using database prices.
3. Validates any promotion against active dates, minimum amount, fixed/percentage/max discount rules.
4. Calculates discount, 5% UAE VAT, and standard/express shipping server-side.
5. Atomically reduces stock with `UPDATE ... WHERE stock >= quantity`, which is the final protection against two people buying the last unit.
6. Saves order, order lines, and shipping info; restores reserved stock if a database step fails.
7. Creates a Stripe PaymentIntent and stores its ID/status as `Pending`.
8. Returns only the client secret/order summary necessary for Stripe confirmation.

Stripe calls the raw-body `/api/v1/payment/webhook` endpoint. The server verifies Stripe's signature before doing anything. `payment_intent.succeeded` changes `payments` to `Paid` and records `paid_at`; failure marks payment failed, restores stock, and cancels the order. The conditional update makes duplicate webhook delivery safe. Never mark an order paid solely because the browser says it succeeded.

Administrators may change a paid order through `Processing -> Shipped -> Delivered`, or cancel an eligible order. Cancellation asks Stripe for an idempotent refund, records its state, restores stock, and emits events. The Stripe webhook also updates asynchronous refund status.

### 10.5 Authentication and authorization

| Concern | Implementation |
|---|---|
| Password storage | `bcrypt` hashes password before database save; never return it in API response |
| Identity | JWT signed with `JWT_SECRET_KEY`, stored in HTTP-only cookie |
| Request auth | `isAuthenticated` reads/verifies cookie and loads current user from PostgreSQL into `req.user` |
| Role auth | `authorizeRoles("Admin")` rejects any other role with 403 |
| Forgot/reset password | secure reset token generation + expiry, email template/SMTP, reset route |
| Avatar uploads | authenticated profile route, Cloudinary upload, old image cleanup |
| Frontend guards | initial `/auth/me` and `AdminRoute`; convenience, not a replacement for server middleware |

Use a long random `JWT_SECRET_KEY`, strong password policy, HTTPS, rate limiting for auth/reset routes, and CSRF protection appropriate to your cookie architecture before public launch. The current source does not show a rate limiter, security headers, request logging, CSRF protection, or automated tests; those are recommended production additions.

---

## 11. Socket.IO and real-time data

### 11.1 Why a socket is used

REST is request/response: the browser asks for data. Socket.IO provides a long-lived connection so the server can tell connected clients “data changed.” This project does not send a whole new database record through a socket. Instead, it sends a small event and the client refetches authoritative data through its existing API thunk. That is a good pattern for correctness and simple cache handling.

### 11.2 Server setup and rooms

`server/realtime/socket.js` attaches Socket.IO to the HTTP server. Socket handshake authentication reads the same `token` cookie as REST; if valid, it loads user ID/role from PostgreSQL. On connection:

```text
authenticated customer -> room user:<userId>
authenticated Admin    -> room user:<userId> and room admins
anonymous visitor      -> no private room, may receive public catalogue/CMS events
```

Events emitted by controllers include:

| Event | Audience | Meaning |
|---|---|---|
| `catalogue:changed` | all clients | Product/stock data changed |
| `storefront:changed` | all clients | Homepage CMS content changed |
| `order:changed` | owning `user:id` and `admins` | order/payment/refund/fulfilment change |
| `admin:changed` | `admins` | administrative resource changed (catalogue/users/promotions/dashboard/storefront) |

### 11.3 Client setup

Both `src/lib/realtime.js` files make a Socket.IO client with `autoConnect: false`, `withCredentials: true`, and WebSocket/polling transports. `VITE_SOCKET_URL` is optional; otherwise it removes `/api/v1` from `VITE_API_URL`.

`client/src/components/LiveUpdates.jsx` is non-visual. It listens for catalogue/storefront/order events, remembers current product/filter values with refs, refetches products/details/storefront/orders as appropriate, fetches the wishlist after login, and clears it on logout.

`dashboard/src/components/LiveUpdates.jsx` listens for operational events and refetches the current products/users page, orders, statistics, or promotions. Both remove listeners in the effect cleanup and reconnect when user identity changes.

### 11.4 Production socket requirements

WebSocket traffic must reach the same API service and preserve the upgrade headers. Configure the reverse proxy for Socket.IO (example later), set both `FRONTEND_URL` and `DASHBOARD_URL`, use HTTPS/WSS, and allow the API host in browser CORS. If a load balancer has multiple API instances, use sticky sessions for polling or configure a Socket.IO adapter (for example Redis) for cross-instance room broadcasts.

---

## 12. Forms, validation, errors, and loading states

### 12.1 Controlled forms

Most forms use state as the single source of truth:

```jsx
const [email, setEmail] = useState("");
<input value={email} onChange={(event) => setEmail(event.target.value)} />
```

Advantages: easy validation, reset, submit disabling, prefill, error messages, and predictable rendering. File uploads use `FormData` because a file cannot be represented as normal JSON.

### 12.2 Validation layers

Use validation in layers:

1. **Browser/UI:** required fields, correct input types, numeric limits, clear inline error text; `Payment` is the most complete example.
2. **Client request:** avoid sending clearly impossible data and disable repeated submission while `saving`/`processing`.
3. **Server controller:** required fields, allowed enum/status values, role, ownership, data shape, stock, promotion availability, and payment logic.
4. **Database:** foreign keys, `NOT NULL`, check constraints, unique indexes.

Only the last two are a security boundary. A malicious client can skip client validation.

### 12.3 Error and loading patterns

Redux thunks use `pending`, `fulfilled`, and `rejected` cases. Typical state is:

```text
pending   -> loading = true, clear stale error
fulfilled -> loading = false, save response data
rejected  -> loading = false, save message; optionally show toast
```

The project uses loaders during auth checks, product/order/admin fetches, Stripe processing, location lookup, form saving, and lists. It uses `react-toastify` for success/failure messages through a single `ToastContainer` in each `main.jsx`. Good screens also render useful empty states (empty cart, no favourites, no records) instead of a blank rectangle.

For a future improvement, standardize all errors with an Axios response interceptor, add an error boundary around the React tree for render crashes, and report server/browser exceptions to an observability service. Never show raw SQL errors, JWTs, provider secrets, or stack traces to customers.

---

## 13. Utilities, third-party libraries, and reusable patterns

| Library / utility | Why it exists here |
|---|---|
| React / React DOM | component UI and browser mounting |
| React Router DOM | pages, links, URL parameters, nested protected routes |
| Redux Toolkit / React Redux | shared state, slices, async thunks, Provider/hooks |
| Axios | configured REST client with credentialed requests |
| Tailwind CSS / PostCSS / Autoprefixer | utility styling, generated CSS, browser compatibility |
| Lucide React | SVG icons as React components |
| React Toastify | success/error notification toasts |
| Socket.IO / socket.io-client | real-time server/client events |
| Stripe / React Stripe JS | PaymentIntent, secure Payment Element, webhooks/refunds |
| `pg` | PostgreSQL pool/query client |
| bcrypt / jsonwebtoken | password hashing and signed identity cookies |
| Cloudinary / express-fileupload | product/avatar image upload and hosted image delivery |
| Nodemailer | password-reset email delivery through SMTP |
| Google Maps JavaScript/Places API | delivery location/geocoding/autocomplete |
| Gemini API helper | AI-assisted product filtering/recommendation |
| nodemon | restart Node server automatically during development |

`client/src/lib/location.js` is a good utility example: it lazily loads Google Maps only after a feature needs it, transforms Maps response shapes into a project-friendly location object, requests browser geolocation only after a user action, and stores the delivery pin locally. Browser location is an aid; the saved server address/order shipping details remain the customer transaction data.

`ProductCard`, `ProductSlider`, `ProductFilters`, `Pagination`, `PaymentForm`, `AddressBook`, `DashboardLayout`, `ProductForm`, and `StatCard` are reusable UI building blocks. Before creating a near-duplicate component, check whether an existing one can accept a prop or whether a small extraction would make it reusable.

---

## 14. Environment variables and configuration

### 14.1 How Vite variables work

Vite exposes only variables beginning with `VITE_` to browser code via `import.meta.env`. They are substituted **at build time**. Anyone can inspect a browser bundle, so VITE values are public configuration, not secrets.

Current customer variables:

```env
# client/.env (development example — values are public build configuration)
VITE_API_URL=http://localhost:4000/api/v1
VITE_SOCKET_URL=http://localhost:4000
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_replace_me
VITE_DASHBOARD_URL=http://localhost:5174
VITE_GOOGLE_MAPS_API_KEY=browser_key_restricted_to_localhost_or_your_domain
```

Current dashboard variables:

```env
# dashboard/.env (development example)
VITE_API_URL=http://localhost:4000/api/v1
VITE_SOCKET_URL=http://localhost:4000
VITE_STORE_URL=http://localhost:5173
```

The existing client `.env` contains Stripe, Dashboard, and Maps settings; API/socket variables have localhost fallbacks in code. The dashboard existing `.env` supplies Store URL; API/socket variables similarly have fallbacks. Explicit environment-specific variables are safer for staging/production than relying on defaults.

### 14.2 Server variables

`server/config/loadEnv.js` specifically loads `./config/config.env`, not a root `.env` file. Current keys used by the application include:

```env
# server/config/config.env — example only; keep this file secret and uncommitted
NODE_ENV=production
PORT=4000
FRONTEND_URL=https://shop.example.com
DASHBOARD_URL=https://admin.example.com

DATABASE_URL=postgresql://app_user:strong_password@db-host:5432/lumera
DB_SSL=true

JWT_SECRET_KEY=generate_a_long_random_value_here
JWT_EXPIRES_IN=7d
COOKIE_EXPIRES_IN=7

STRIPE_SECRET_KEY=sk_live_replace_me
STRIPE_WEBHOOK_SECRET=whsec_replace_me

CLOUDINARY_CLIENT_NAME=replace_me
CLOUDINARY_CLIENT_API=replace_me
CLOUDINARY_CLIENT_SECRET=replace_me

SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SERVICE=
SMTP_MAIL=no-reply@example.com
SMTP_PASSWORD=replace_me

GEMINI_API_KEY=replace_me
GEMINI_MODEL=gemini-flash-latest

# Needed only by the seed catalog script, never expose to clients.
SEED_ADMIN_EMAIL=admin@example.com
SEED_ADMIN_PASSWORD=replace_me
```

`DATABASE_URL` wins over separate DB variables. `STRIPE_FRONTEND_KEY` appears in the current server environment but is not used by the browser code; the public Stripe key belongs in `client` as `VITE_STRIPE_PUBLISHABLE_KEY`, and Stripe secret keys belong only on the server.

### 14.3 Development, staging, and production

| Environment | Suggested URLs / service choices | Configuration rule |
|---|---|---|
| Development | `localhost:5173` storefront, `localhost:5174` dashboard, `localhost:4000` API, local/test DB and Stripe test mode | separate test credentials, `NODE_ENV=development` |
| Staging | `staging-shop.example.com`, `staging-admin.example.com`, `staging-api.example.com`, isolated database and Stripe test mode | never point staging at production database/payment secrets |
| Production | `shop.example.com`, `admin.example.com`, `api.example.com`, managed/secured PostgreSQL and Stripe live mode | `NODE_ENV=production`, HTTPS only, live secrets in secret manager/server environment |

Vite supports `.env.development`, `.env.staging`, and `.env.production` files, selected with `vite --mode <mode>`, but those files do not exist in this repository today. You can add ignored local files or have CI create them securely before each build. For example:

```bash
cd client
npm run build -- --mode production
```

Because Vite embeds public configuration at build time, building one `client/dist` for staging and then pointing it at production is wrong if API URLs differ. Build separately for each environment.

The server currently always reads `config/config.env`. In a managed platform, the recommended approach is to provide real environment variables and adjust `loadEnv.js` so dotenv only fills missing values, or deploy a correct secret `config.env` file outside Git. Do not use the same database/JWT/Stripe keys across environments.

---

## 15. Vite and local development

### 15.1 What Vite does

Vite is the frontend development server and build tool. In development it serves ES modules quickly with hot module replacement (HMR). In production `vite build` resolves imports, transforms JSX, processes Tailwind/PostCSS, fingerprints/assets bundles, minifies, and writes static files to `dist/`.

`@vitejs/plugin-react` enables React JSX transform and fast refresh. Customer `vite.config.js` currently only registers the React plugin. Dashboard pins local development to port 5174 with `strictPort: true`; customer Vite defaults to 5173 unless occupied.

### 15.2 Run locally

Use three terminal sessions:

```bash
# Terminal 1: API
cd server
npm ci
npm run dev

# Terminal 2: storefront
cd client
npm ci
npm run dev

# Terminal 3: dashboard
cd dashboard
npm ci
npm run dev
```

Use `npm install` only when intentionally changing dependencies; use `npm ci` for reproducible installs from each committed lockfile. Ensure PostgreSQL, test API keys, and matching environment config exist before starting the server. The server's schema initializer runs on start. Seed only when you understand it:

```bash
cd server
npm run seed:catalog
npm run seed:storefront
```

The seed scripts use `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD`; never run an unreviewed seed against a production database.

### 15.3 Build and preview

```bash
cd client && npm run build && npm run preview
cd dashboard && npm run build && npm run preview

cd server && npm start
```

`npm run preview` is a local verification server, not a production host. Client has `npm run lint` (configured with oxlint); dashboard does not currently define a lint script; server has only a placeholder `test` script. Add meaningful lint/test scripts before making CI a release gate.

---

## 16. Production deployment: what you need to buy or configure

### 16.1 Required services checklist

| Need | Why | Typical choice |
|---|---|---|
| Domain | human-friendly names for storefront/admin/API | purchase from a registrar; use subdomains |
| DNS | maps subdomains to hosting/load balancer | registrar DNS, Cloudflare, Route 53, etc. |
| Static hosting or web server | serves Vite `dist/` assets | Nginx on VM, object storage/CDN, Vercel/Netlify/Cloudflare Pages |
| Node hosting | runs Express + Socket.IO + webhooks | VM with systemd/PM2, container platform, managed app service |
| PostgreSQL | permanent transactional data | managed PostgreSQL is recommended |
| SSL/TLS certificate | HTTPS/WSS, secure cookies, payment/location trust | Let's Encrypt or managed certificate; often free |
| Stripe account | live card payments and webhook endpoint | Stripe production account, verified business/bank/tax setup |
| Image service | product/avatar storage | Cloudinary account/bucket configuration |
| Email service | password reset emails | SMTP provider/domain-authenticated email |
| Google Maps API | optional address autocomplete/geocoding | Google Cloud project, billing, restricted browser key |
| Gemini API | optional AI product search | provider account/key and cost limits |
| Monitoring/backups | detect outages and recover data | uptime check, logs, DB backups, error tracking |

Recommended public layout uses separate subdomains, which avoids Vite base-path complexity:

```text
https://shop.example.com     -> client/dist
https://admin.example.com    -> dashboard/dist
https://api.example.com      -> Express + Socket.IO on an internal port
```

Register an SSL certificate for all three names (or a wildcard certificate). Configure DNS A/AAAA/CNAME records. Allow TCP 80/443 to the reverse proxy, but do **not** expose PostgreSQL or internal Node port 4000 publicly unless the platform requires it.

### 16.2 Pre-launch checklist

1. Create separate production services/accounts and secrets; do not reuse development values.
2. Provision PostgreSQL, create a least-privilege application user/database, enable backups, and set `DATABASE_URL`/`DB_SSL=true`.
3. Configure `FRONTEND_URL=https://shop.example.com` and `DASHBOARD_URL=https://admin.example.com` exactly. Build both frontends with `VITE_API_URL=https://api.example.com/api/v1` and `VITE_SOCKET_URL=https://api.example.com`.
4. Add Stripe live secret/webhook secret on the API server. In Stripe, register `https://api.example.com/api/v1/payment/webhook` and subscribe to payment intent/refund events used by the controller.
5. Configure Cloudinary, SMTP, Maps domain restrictions, and optional Gemini key/cost caps.
6. Build frontend files; run unit/integration/build checks; deploy artifacts.
7. Start API with a process manager, expose it through an HTTPS reverse proxy with WebSocket upgrade support.
8. Verify `/api/v1/health`, login cookie behaviour, admin authorization, deep-link refresh, checkout in Stripe test/live-safe mode, a Stripe webhook delivery, image upload, email, and Socket.IO refresh.
9. Set monitoring, log rotation, database backup/restore tests, alerts, and a rollback plan.

### 16.3 Example production frontend environment files

Build-time values can be injected by Jenkins, a hosting platform, or temporary ignored `.env.production` files:

```env
# client/.env.production
VITE_API_URL=https://api.example.com/api/v1
VITE_SOCKET_URL=https://api.example.com
VITE_DASHBOARD_URL=https://admin.example.com
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_replace_me
VITE_GOOGLE_MAPS_API_KEY=restricted_browser_key

# dashboard/.env.production
VITE_API_URL=https://api.example.com/api/v1
VITE_SOCKET_URL=https://api.example.com
VITE_STORE_URL=https://shop.example.com
```

The Stripe publishable and Maps browser key are intentionally visible to users, but still restrict the Maps key by approved HTTP referrers and API scope. Never prefix server-only keys with `VITE_`.

### 16.4 Example Nginx configuration

This is an example for three subdomains on one Linux server. Adapt certificate paths, user, release paths, and DNS. Static files can instead be put behind a CDN/managed host.

```nginx
# shop.example.com
server {
  listen 443 ssl http2;
  server_name shop.example.com;
  root /var/www/lumera/client/current;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }
}

# admin.example.com
server {
  listen 443 ssl http2;
  server_name admin.example.com;
  root /var/www/lumera/dashboard/current;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }
}

# api.example.com
server {
  listen 443 ssl http2;
  server_name api.example.com;

  location / {
    proxy_pass http://127.0.0.1:4000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_read_timeout 60s;
  }
}
```

Also configure HTTP (port 80) to redirect to HTTPS, certificates with Certbot/your provider, a firewall, server updates, restrictive file permissions on secrets, and an OS service. If Express must know it is behind a TLS proxy for other future cookie/IP features, add the appropriate `app.set("trust proxy", 1)` after understanding your proxy topology.

### 16.5 Keep the API alive with systemd (one VM option)

Install a supported Node LTS version, place code under a non-root deploy user, run `npm ci --omit=dev` in `server`, and create a service such as:

```ini
# /etc/systemd/system/lumera-api.service
[Unit]
Description=Lumera Express API
After=network.target

[Service]
Type=simple
User=lumera
WorkingDirectory=/srv/lumera/server/current
EnvironmentFile=/etc/lumera/api.env
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

The current code loads `server/config/config.env`; if using `EnvironmentFile`, adjust `loadEnv.js` to avoid overwriting injected values or securely copy the generated configuration file into the release. Run `systemctl daemon-reload`, `systemctl enable --now lumera-api`, and inspect `journalctl -u lumera-api`. A container platform can perform the same role without systemd.

---

## 17. CI/CD and Jenkins

### 17.1 What CI/CD means

**CI (Continuous Integration)** means every branch/merge change is automatically checked: install exact dependencies, lint, test, build, and perhaps security scan. It detects integration problems early.

**CD (Continuous Delivery/Deployment)** takes a successfully checked artifact and makes it available in staging or production. *Continuous delivery* may pause for human approval before production; *continuous deployment* releases automatically after checks.

There is currently **no Jenkinsfile, GitHub Actions workflow, GitLab CI file, Dockerfile, or deployment script in this repository**. Therefore CI/CD does not currently happen automatically. The pipeline below is a recommended implementation, not a claim about existing automation.

### 17.2 What Jenkins is

Jenkins is a self-hosted automation server. It watches source-control events, runs a pipeline defined as code (usually a `Jenkinsfile`), stores credentials securely, shows build logs/status, and can deploy artifacts or tell another platform to deploy. Teams use it when they need control over their own build agents, private network access, custom release approvals, or integrations.

GitHub/GitLab remains the source of code; Jenkins is the worker/orchestrator. A GitHub/GitLab webhook informs Jenkins of a push or merge request. Jenkins checks out the commit with a restricted credential/app/token, runs pipeline stages, and reports pass/fail status back to the pull request/commit.

### 17.3 Recommended deployment pipeline

```text
Developer pushes branch / opens merge request
        -> GitHub/GitLab webhook triggers Jenkins
        -> checkout exact commit
        -> npm ci in client, dashboard, server
        -> lint / unit tests / dependency-security checks
        -> build client + dashboard using target public configuration
        -> API smoke/schema checks in isolated environment
        -> package immutable release artifact
        -> deploy automatically to staging
        -> health check + browser/API/Stripe webhook smoke tests
        -> optional manual approval
        -> deploy same tested artifact to production
        -> restart/roll API, health check, monitor
        -> keep prior release for fast rollback
```

Do not rebuild a different artifact after staging approval. Promote the same commit/artifact so production is exactly what passed staging. Do not place secrets in the Jenkinsfile; store them in Jenkins Credentials, a cloud secret manager, or protected GitHub/GitLab variables.

### 17.4 Jenkins setup for this repository

1. Run Jenkins on a hardened server or managed environment. Use a modern supported Java/Jenkins version; protect it with SSO/MFA/least privileges.
2. Install needed plugins: Pipeline, Git, GitHub Branch Source *or* GitLab, Credentials Binding, SSH Agent (if deploying over SSH), and an appropriate notification plugin.
3. Create credentials: source-control app/deploy key, production SSH key or cloud token, and deployment-only secret references. Do not give Jenkins a personal administrator password.
4. Give build agents Node LTS, npm, SSH/rsync or cloud CLI, and (if needed) Docker. Use isolated ephemeral agents when possible.
5. Create a Multibranch Pipeline for the repository. Set webhook events for push and merge request/pull request. In GitHub, add the Jenkins webhook URL and secret; in GitLab, add a project webhook/connection. Verify Jenkins receives a test event.
6. Commit a reviewed `Jenkinsfile` at repository root. Protect `main`/release branches and require successful CI before merge.
7. Configure protected staging/production credentials and an approval gate for production. Limit who can approve/deploy.

### 17.5 Illustrative `Jenkinsfile`

This example is deliberately a template. Replace deploy host/path commands and enable real test commands after adding tests. Store `lumera-deploy-ssh` in Jenkins Credentials; do not hard-code it.

```groovy
pipeline {
  agent { label 'node-lts' }

  options { timestamps(); disableConcurrentBuilds() }

  environment {
    NODE_ENV = 'production'
    // Public build values can be injected from protected Jenkins config.
    VITE_API_URL = 'https://api.example.com/api/v1'
    VITE_SOCKET_URL = 'https://api.example.com'
    VITE_STORE_URL = 'https://shop.example.com'
  }

  stages {
    stage('Checkout') {
      steps { checkout scm }
    }
    stage('Install') {
      steps {
        sh 'cd client && npm ci'
        sh 'cd dashboard && npm ci'
        sh 'cd server && npm ci'
      }
    }
    stage('Quality') {
      steps {
        sh 'cd client && npm run lint'
        // Add dashboard lint and real client/server test commands before release.
      }
    }
    stage('Build static apps') {
      steps {
        withCredentials([string(credentialsId: 'stripe-publishable-production', variable: 'VITE_STRIPE_PUBLISHABLE_KEY'),
                         string(credentialsId: 'maps-browser-production', variable: 'VITE_GOOGLE_MAPS_API_KEY')]) {
          sh 'cd client && npm run build -- --mode production'
          sh 'cd dashboard && npm run build -- --mode production'
        }
      }
    }
    stage('Archive') {
      steps {
        sh 'tar -czf lumera-release.tgz client/dist dashboard/dist server --exclude=server/node_modules --exclude=server/config/config.env'
        archiveArtifacts artifacts: 'lumera-release.tgz', fingerprint: true
      }
    }
    stage('Deploy staging') {
      when { branch 'main' }
      steps {
        sshagent(credentials: ['lumera-deploy-ssh']) {
          sh './deployment/deploy-staging.sh lumera-release.tgz'
        }
        sh 'curl --fail --retry 5 https://staging-api.example.com/api/v1/health'
      }
    }
    stage('Production approval') {
      when { branch 'main' }
      steps { input message: 'Deploy the tested release to production?', ok: 'Deploy' }
    }
    stage('Deploy production') {
      when { branch 'main' }
      steps {
        sshagent(credentials: ['lumera-deploy-ssh']) {
          sh './deployment/deploy-production.sh lumera-release.tgz'
        }
        sh 'curl --fail --retry 5 https://api.example.com/api/v1/health'
      }
    }
  }
  post {
    always { cleanWs() }
  }
}
```

The `deployment/*.sh` paths are illustrative and do not currently exist. A safe deploy script normally uploads an artifact to a new versioned release directory, installs production server dependencies, links `current` atomically, restarts/rolls the API, health-checks it, and preserves the previous release directory for rollback. Do not use an unreviewed `git pull` directly in a live web root as a deployment strategy.

### 17.6 GitHub/GitLab connection flow

```text
GitHub/GitLab push -> signed webhook -> Jenkins multibranch scan/build
Jenkins -> Git provider API/deploy key -> checks out precise commit
Jenkins -> build status API -> commit/PR status shown to developers
Jenkins -> SSH/cloud deployment credential -> staging/production environment
```

Use GitHub Apps or GitLab project access tokens/deploy keys with the smallest possible scopes. Protect webhook secrets. Avoid long-lived personal access tokens with administrator rights.

---

## 18. Deploying for another client or user

Treat each client as a separate environment/tenant unless the product is intentionally designed as multi-tenant. Do **not** casually point a new client's domain at the same database if their users/orders must be isolated.

For a separate client deployment:

1. Obtain that client's domain/DNS access and decide `shop`, `admin`, and `api` names.
2. Create their own PostgreSQL database/user/backups, Stripe account or properly isolated account setup, Cloudinary folder/account, SMTP sender/domain, Maps key restrictions, and optional Gemini limits.
3. Create fresh JWT/SMTP/Stripe/database secrets; record ownership, billing, renewal, and emergency contacts.
4. Configure production origins/secrets for that client. Build the two Vite sites using **that client's** public API/admin/store URLs.
5. Deploy the API, frontends, proxy/SSL, Stripe webhook, and monitoring under their infrastructure/account where practical.
6. Seed only initial catalog/CMS/admin data approved by the client. Create the first admin securely; rotate temporary credentials.
7. Run a client-specific acceptance checklist: account flow, cookie across subdomains, normal/admin permissions, upload, contact email, a Stripe test payment/refund/webhook, shipping/promotion math, Maps, real-time product/order updates, deep links, mobile layout, backups, and rollback.
8. Document handover: domains, registrar, hosting, source repository, secrets owner, billing owner, deployment procedure, database backup restore, monitoring, and support boundaries.

If sharing one codebase, put branding/feature differences in approved configuration/content rather than editing code directly on a client's server. Use separate CI/CD environment credentials and release records.

---

## 19. Practical feature walkthroughs

### Browse and add a product

1. `App` dispatches `fetchProducts` and product data enters `state.product`.
2. `Home`, `Products`, or `ProductDetail` passes a product to `ProductCard`.
3. `ProductCard` uses props to render image/name/price/stock and reads Redux auth/wishlist state.
4. Clicking “add” dispatches a cart reducer action; all cart selectors update and local cart storage is written.
5. Clicking the product link navigates with `Link` to `/product/:id`; detail page fetches fresh full product data.

### Sign in and show account-aware UI

1. User submits LoginModal or dashboard Login controlled form.
2. Auth thunk posts credentials to `/auth/login` using Axios `withCredentials`.
3. Server validates bcrypt hash, signs JWT, writes HTTP-only cookie, and returns safe user data.
4. Auth fulfilled reducer stores `authUser`; components using `state.auth.authUser` rerender.
5. Socket listener reconnects/joins a user or admin room based on the cookie handshake.
6. On refresh, `getUser` calls `/auth/me`; the browser sends the cookie and state is restored without local token storage.

### Admin changes a product

1. Admin ProductForm creates normal data plus selected files in `FormData`.
2. Admin thunk posts/puts authenticated request.
3. `isAuthenticated` and `authorizeRoles("Admin")` run before controller.
4. Controller validates, stores images in Cloudinary, updates PostgreSQL, returns product, and emits `catalogue:changed`/`admin:changed`.
5. Admin slice updates its visible list immediately; customer LiveUpdates refetches its current product list/detail; other admin screens refetch current data.

### Customer pays and then sees order status

1. Payment collects shipping data and only then dispatches `placeNewOrder`.
2. Server calculates the real total/discount/tax/shipping and reserves stock before creating Stripe PaymentIntent.
3. Client uses the returned client secret inside Stripe Elements to confirm payment.
4. Stripe, not the browser, calls the signed webhook; server changes payment/order state.
5. Server emits `order:changed`. Customer Orders and Dashboard data refetch. The cart was already cleared only after client-side confirmation, while server payment state remains authoritative.

---

## 20. Recommended next engineering improvements

These are not claims about features already implemented; they are the highest-value hardening steps before or alongside a public launch.

1. Add real automated unit, API integration, and end-to-end checkout tests; replace the server's placeholder test script and add dashboard lint/test scripts.
2. Add CI pipeline files and deployment scripts, with artifact promotion and rollback as described above.
3. Add HTTP security headers (Helmet), API rate limiting, input schema validation (for example Zod/Joi), request IDs/logging, CSRF strategy for cross-site cookies, dependency scans, and error monitoring.
4. Add database migrations instead of relying only on startup schema creation; backup and restore-test PostgreSQL regularly.
5. Remove the redundant `forma-cart` persistence path or consolidate it with `lumera-cart-v1`.
6. Remove JWT from JSON login responses; rely on the existing HTTP-only cookie. Consider token rotation, login throttling, password rules, email verification, and audit logs.
7. Improve modal accessibility: focus trapping/restoration, Escape handling where missing, inert background behavior, labels/error announcements, and reduced-motion support.
8. Define a shared API contract/OpenAPI document and centralize repeated direct Axios page calls where shared caching/state would help.
9. Restrict Cloudinary uploads, Maps browser keys, Stripe webhook/IP policy where supported; store server secrets in a managed secret vault.
10. Plan a Socket.IO scaling strategy (Redis adapter/load-balancer behaviour) before running multiple API instances.

---

## 21. Glossary

| Word | Meaning in simple terms |
|---|---|
| API | A contract over HTTP that lets frontend and backend exchange data |
| Component | Reusable React UI function returning JSX |
| JSX | HTML-like JavaScript syntax used in React components |
| Prop | Read-only value passed from parent component to child |
| State | Data React remembers that can cause the UI to rerender |
| Hook | React helper beginning with `use`, such as `useState` |
| Context | A way to make a value available to descendants without prop drilling |
| Redux slice | One feature's global state, actions, and reducers |
| Reducer | Rule that calculates next state for an action |
| Thunk | Async Redux action, commonly used for API calls |
| Selector | Code that reads a value from Redux state |
| Route | URL-to-component mapping |
| CORS | Browser rule controlling which web origins may call an API |
| HTTP-only cookie | Cookie sent to server but hidden from browser JavaScript |
| JWT | Signed token that represents identity/claims |
| Webhook | Server-to-server HTTP callback, e.g. Stripe tells API a payment changed |
| WebSocket/Socket.IO | Persistent connection used for server-pushed events |
| Vite | Fast frontend dev server/build tool |
| `dist/` | Static build output ready for a web server/CDN |
| CI/CD | Automated integration checks and delivery/deployment pipeline |
| Jenkins | Self-hosted automation server that can run a CI/CD pipeline |
| Nginx | Common web server/reverse proxy for static files, HTTPS, API, and WebSocket traffic |

---

## 22. First-day learning order for a developer with under two years of experience

1. Run all three applications locally and use browser DevTools Network tab while browsing, logging in, adding to cart, and checking out in Stripe test mode.
2. Read `client/src/main.jsx`, then `client/src/App.jsx`, then one small page such as `FAQ.jsx` and one reusable component such as `ProductCard.jsx`.
3. Follow one Redux flow end-to-end: `cartSlice` -> Navbar/Cart -> Payment.
4. Follow one API flow end-to-end: `productSlice.fetchProducts` -> `server/router/productRoutes.js` -> `productController.js` -> PostgreSQL query -> Redux fulfilled state.
5. Read `ThemeContext.jsx`, `index.css`, and `tailwind.config.js`; make a small visual change using an existing token.
6. Follow `LiveUpdates.jsx` and `server/realtime/socket.js`; change a product as admin and watch the customer view refresh.
7. Follow payment carefully from `Payment.jsx` through order controller and Stripe webhook. Never test live charges while learning.
8. Read the production and Jenkins sections before deploying; make a staging environment first, then practice rollback and webhook/health checks.

When changing the application, ask four questions: **Who owns this state? Which component/API is the source of truth? What happens on loading/error? Is the server still validating the action?** Those questions prevent many common React and full-stack bugs.

---

## 23. Interview preparation: how this project matches the role

The job description is asking for two related things:

1. **Strong everyday React engineering** — component design, hooks, state, routing, forms, APIs, CSS, accessibility, testing, collaboration.
2. **Production scale engineering** — TypeScript, render performance, bundle size, very large lists, PWA/offline behavior, multilingual UI, monitoring, and CI.

This project gives you real examples for the first group and some of the second. It does **not** currently contain TypeScript, PWA configuration, virtualization, TanStack Query, automated tests, i18n, lazy-loaded routes, Core Web Vitals monitoring, or a CI pipeline. In an interview, be accurate about that. Do not say “I used virtualization” if this code does not virtualize a list. Instead say what is implemented, identify the scaling gap, and explain exactly how you would add it.

### 23.1 Requirement-to-project map

| Interview requirement | Is it in this codebase? | Where / how to discuss it |
|---|---|---|
| React components and hooks | **Yes** | `client/src/App.jsx`, pages, `ProductCard`, `useState`, `useEffect`, `useMemo`, `useRef`, `useContext` |
| Component architecture/reuse | **Yes** | `components/Home`, `components/Products`, `components/Layout`, dashboard `ProductForm`, `StatCard` |
| Props/data passing | **Yes** | `Home -> ProductSlider -> ProductCard`; filters/pagination callback props |
| Context/Hooks state | **Yes** | `contexts/ThemeContext.jsx`, `useTheme()` |
| Redux Toolkit | **Yes** | both `src/store/store.js` files and slices |
| Routing/protected routes | **Yes** | React Router in both `App.jsx`; dashboard `AdminRoute` |
| Forms/validation | **Yes** | `Payment`, `LoginModal`, `Contact`, `AddressBook`, dashboard forms |
| REST APIs/auth/realtime | **Yes** | Axios lib/thunks, Express auth middleware, Socket.IO `LiveUpdates` |
| Responsive CSS/accessibility foundations | **Yes, partly** | Tailwind responsive variants, semantic forms/buttons; some modal a11y improvements remain |
| Vite | **Yes** | `vite.config.js`, build scripts, environment variables |
| TypeScript | **No** | all app source files are `.js`/`.jsx`; explain a migration plan |
| TanStack Query | **No** | Redux async thunks own server fetch state; explain when Query would be better |
| Virtualized large lists/tables | **No** | product/order/user pages render available records normally; use `@tanstack/react-virtual` or `react-window` at scale |
| Memoization | **Yes, basic** | `useMemo`/`useCallback` in Payment, filters, product details, slider, maps; no `React.memo` currently |
| Code splitting/lazy loading | **No** | all route modules are statically imported; use `lazy`/`Suspense` |
| Bundle budgets | **No** | add build analysis and CI thresholds |
| Core Web Vitals/p95 | **No** | add `web-vitals` and real-user monitoring (RUM) |
| PWA/install/offline | **No** | needs manifest, service worker, caching strategy, icons |
| Multilingual UI | **No** | UI copy is mainly hardcoded English; introduce i18n keys/locales |
| Vitest / React Testing Library | **No** | package scripts show no test runner; add tests and CI gate |
| Git/GitLab/reviews | **Repository-ready, no pipeline config** | use feature branches, merge requests, review checklist, CI status |

An excellent interview answer has this shape:

> “In this project I used React Router for customer and protected admin routes, Redux Toolkit for shared cart/auth/catalogue state, Axios for cookie-authenticated REST calls, and Socket.IO to refetch data when stock or orders change. It is currently JavaScript/Vite, not TypeScript, and lists are not virtualized. For a large production dataset I would paginate at the API, virtualize the rendered rows, memoize expensive rows, profile before optimizing, and measure p75/p95 Core Web Vitals with real-user monitoring.”

That answer is specific, honest, and shows senior-level judgment even if you have not yet had five years of experience.

---

## 24. React interview foundation — before reading project code

### 24.1 The React mental model: render is a calculation

Treat a component as a function:

```text
UI = component(props, state, context)
```

When props, state, or subscribed context/Redux values change, React runs the component function again to calculate the next UI. It compares the result with the previous UI and changes only the necessary browser DOM parts. This is a **render**, not necessarily “redraw every pixel.”

Example from the project:

```jsx
const Cart = () => {
  const cart = useSelector((state) => state.cart.cart);
  const subtotal = cart.reduce(/* ... */);
  return <p>{subtotal}</p>;
};
```

When `addToCart` changes `state.cart.cart`, React Redux tells `Cart` that its selected value changed. React runs `Cart` again, calculates a new subtotal, and updates the relevant text/rows.

**Interview distinction:**

- **Render phase:** React calls components to calculate what UI should be.
- **Commit phase:** React applies the resulting changes to the DOM.
- **Effect phase:** `useEffect` runs after React commits, for outside work such as a fetch, timer, socket, subscription, or browser API.

Do not fetch data or update state directly during the render body. Rendering should be predictable and free of side effects.

### 24.2 What causes a component to render again?

A component may render again when:

1. Its own `useState` setter runs.
2. Its parent renders (unless React can safely skip it through memoization).
3. A context value it reads changes.
4. A Redux selector value it reads changes.
5. Its route changes and React Router provides different route data/props.

Example: `ProductCard` receives a `product` prop and selects auth/wishlist state. It can rerender if its parent maps a new product list, the signed-in user changes, or the wishlist selection changes.

Rendering is normal. Do not memoize every component prematurely; shallow comparisons and complicated dependencies also have a cost. Profile first and optimize a measured bottleneck.

### 24.3 Props versus state versus context versus Redux

Use this decision guide:

```text
Does only one component need it now?      -> local useState
Does a parent naturally own it?            -> parent state + props/callback
Is it a small, stable app-wide concern?   -> Context (theme, locale)
Do distant screens need shared complex data/actions? -> Redux/Zustand
Is it server data with caching/retry/staleness needs? -> TanStack Query (often)
```

| Tool | Good example in this project | Why |
|---|---|---|
| Prop | `ProductCard product={product}` | card should display what parent gives it |
| Callback prop | `Pagination onPageChange={...}` | child reports interaction; parent controls URL/fetch |
| Local state | FAQ open index, LoginModal form fields | value is private to one UI area |
| Context | ThemeProvider/theme toggle | many descendants need it, value changes infrequently |
| Redux | cart, auth user, product list | unrelated UI parts need the same state |
| Server cache tool | not currently used | useful when remote data is the main concern |

### 24.4 One-way data flow and “lifting state up”

React data normally travels **downward** from parent to child. A child requests a change by calling a passed callback. If two sibling components need the same value, move (“lift”) the state to their closest common parent.

```jsx
function ProductPage() {
  const [filters, setFilters] = useState({ category: "" });
  return (
    <>
      <ProductFilters filters={filters} onChange={setFilters} />
      <ProductGrid filters={filters} />
    </>
  );
}
```

`pages/Products.jsx` follows this idea: it owns the filter/URL coordination, passes filters to `ProductFilters`, receives changes, dispatches a fetch, and passes results to cards. It does not let each card invent its own catalogue filter state.

### 24.5 Controlled and uncontrolled inputs

A **controlled input** gets its value from React state and changes that state in `onChange`:

```jsx
const [email, setEmail] = useState("");
<input value={email} onChange={(e) => setEmail(e.target.value)} />
```

This project uses controlled inputs for login, checkout, contact, addresses, promotions, product CRUD, support replies, and return notes. It is predictable and makes validation straightforward.

An **uncontrolled input** lets the DOM keep the value; React reads it using a ref on submit. It can be useful for simple forms or integration with non-React code. File inputs are special: you normally read `event.target.files` and keep the `File` object, as dashboard `ProductForm` does.

### 24.6 The `useEffect` interview answer

`useEffect` synchronizes a rendered component with an external system. In this project, external systems include the REST API, Socket.IO, `localStorage`, browser geolocation, Google Maps script, timers, and Stripe.

```jsx
useEffect(() => {
  const timer = setInterval(next, 6500);
  return () => clearInterval(timer);
}, [next]);
```

This is the pattern used by `HeroSlider`: create resource/subscription/timer, then return a cleanup function. The dependency array says when old work must be cleaned up and fresh work made.

Common mistakes to explain in an interview:

- `useEffect(async () => ...)` — make an inner async function instead; effect callback should return nothing or cleanup, not a Promise.
- missing dependency — effect may use stale values.
- adding a newly-created object/function dependency — effect can run every render.
- no cleanup — duplicate socket listeners/timers/memory leaks.
- using effect for a value that could simply be calculated during render — causes unnecessary extra render/state.

### 24.7 `useMemo`, `useCallback`, and `React.memo`

These solve related but different problems:

```jsx
const total = useMemo(() => calculateTotal(lines), [lines]); // caches a VALUE
const onDelete = useCallback((id) => dispatch(remove(id)), [dispatch]); // caches a FUNCTION
const Row = React.memo(function Row({ item, onDelete }) { /* ... */ }); // may skip rerender if props are unchanged
```

Project examples:

- `Payment.jsx` uses `useMemo` for cart subtotal, discount, estimated total, and Stripe promise.
- `Favourites.jsx`, `Orders.jsx`, and `ProductDetail.jsx` use `useMemo` for filtering/grouping/related data.
- Home slider/address/map code uses `useCallback` for handlers used in effects or props.
- No source file currently imports `React.memo`; that is a possible targeted optimization for a costly row/card after profiling.

`useCallback` alone does not make a component fast. It matters when a stable function reference helps a memoized child avoid work or is required as an effect dependency. `useMemo` can also cost memory/complexity. Say: **measure first; memoize expensive calculation or expensive child rendering with stable inputs.**

### 24.8 Keys, reconciliation, and immutable updates

React uses a list item `key` to match old and new elements. Use a durable ID:

```jsx
products.map((product) => <ProductCard key={product.id} product={product} />)
```

Bad key example: array index in a filterable cart/order list. If the first item is removed, an index key can cause React to reuse another item's input/internal state in the wrong row.

Immutable updates mean do not mutate ordinary React state/props directly. Prefer:

```js
setItems((oldItems) => oldItems.filter((item) => item.id !== id));
```

Redux Toolkit reducer code may appear mutable (`state.cart.push(...)`) because Immer converts it to an immutable next state. Be ready to explain that distinction.

### 24.9 Custom hooks

A **custom hook** extracts reusable stateful behavior, not visual markup. It starts with `use` and can compose other hooks:

```jsx
function useDebouncedValue(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}
```

The project has one custom consumer hook: `useTheme()` wraps `useContext(ThemeContext)` and gives components a safe interface. A useful future extraction would be `useDeliveryLocation`, `useSocketEvent`, or `useProductFilters` because those behaviors are currently spread across components/utilities.

---

## 25. TypeScript for this project and interview

### 25.1 What TypeScript is

TypeScript is JavaScript with static type checking. It does not run in the browser as TypeScript; Vite transpiles it to JavaScript. Its purpose is to catch mistakes before runtime and make large codebases easier to navigate.

```ts
type Product = {
  id: string;
  name: string;
  price: number;
  stock: number;
  images: { url: string }[];
};

function productTotal(product: Product, quantity: number): number {
  return product.price * quantity;
}
```

With this type, TypeScript catches `product.prcie`, passing a string quantity, or rendering an image property that does not exist. It does **not** validate untrusted API data at runtime; use a schema validator (such as Zod) for that.

### 25.2 Current repository status

The source files are `.js` and `.jsx`, even though `@types/react` and `@types/react-dom` appear in frontend development dependencies. There is no `tsconfig.json` and no `.ts`/`.tsx` application source. Therefore TypeScript is **not currently being used**.

This is a good interview statement:

> “This repository is JavaScript today. I would migrate incrementally, starting at API models and reusable components, with `allowJs` enabled initially. The most valuable types are Product, CartLine, User, Order, API responses, form payloads, and Redux state. I would avoid `any`, use `unknown` for untrusted data, and validate API data at boundaries.”

### 25.3 Incremental migration plan

1. Add TypeScript and a `tsconfig.json` appropriate for Vite/React.
2. Turn on `allowJs: true`, `checkJs: false` first, so JavaScript and TypeScript coexist.
3. Create `src/types/` for core domain types: `Product`, `User`, `CartLine`, `Order`, `Address`, `Promotion`, `ApiResponse`.
4. Rename small leaf components from `.jsx` to `.tsx`; type their props.
5. Type Axios response functions and Redux slice state/thunk return values.
6. Add runtime request/response schemas at API boundaries; TypeScript alone cannot prove the server sent valid JSON.
7. Gradually enable stricter compiler options and remove `any`/unsafe assertions.

Example conversion of a product card:

```tsx
type ProductImage = { url: string };
type Product = {
  id: string;
  name: string;
  price: number;
  stock: number;
  ratings?: number;
  images?: ProductImage[];
};

type ProductCardProps = {
  product: Product;
  layout?: "slider" | "grid";
};

export function ProductCard({ product, layout = "slider" }: ProductCardProps) {
  return <article data-layout={layout}>{product.name}</article>;
}
```

### 25.4 TypeScript terms recruiters may ask about

| Term | Simple meaning |
|---|---|
| `type` / `interface` | describes the shape of a value/object |
| union (`"Paid" \| "Pending"`) | value must be one from a limited set |
| optional (`name?: string`) | property may be absent |
| generic (`Promise<ApiResponse<Product>>`) | reusable type with a placeholder |
| `unknown` | value exists but must be checked before use; safer than `any` |
| `any` | turns off checking; avoid except temporary migrations |
| narrowing | checking `typeof`, `in`, or discriminant before safely using a union |
| discriminated union | objects with a shared tag such as `{ status: "loading" }` / `{ status: "success", data }` |

For status values currently represented by strings in JavaScript, a TypeScript union prevents typo bugs:

```ts
type OrderStatus = "Processing" | "Shipped" | "Delivered" | "Cancelled";
```

---

## 26. React performance at scale

### 26.1 First rule: measure, do not guess

Performance work should follow this loop:

```text
Observe a user-visible problem
-> measure it in production-like conditions
-> find the bottleneck with profiling
-> make one focused change
-> measure again and guard against regression
```

Use Chrome DevTools Performance/Network/Lighthouse, React DevTools Profiler, server logs/traces, and real-user monitoring. A fast laptop and average score do not prove a good mobile experience. Interviewers like candidates who mention **p75/p95** latency: the 95th percentile describes a slow-tail experience that average values hide.

### 26.2 Core Web Vitals in simple language

| Metric | What it describes | Typical improvement direction |
|---|---|---|
| LCP (Largest Contentful Paint) | when the main visible content finishes loading | optimize hero image, critical CSS, server/CDN response, avoid blocking JS |
| INP (Interaction to Next Paint) | how quickly UI visibly responds to a click/tap/type interaction | reduce long JS tasks, avoid unnecessary rerenders, split/defer work |
| CLS (Cumulative Layout Shift) | unexpected layout movement while page loads | reserve image/ad dimensions, avoid late content jumping |
| FCP (First Contentful Paint) | when first content appears | reduce render-blocking work/assets |
| TTFB (Time to First Byte) | server/network response start | CDN/cache/API/server/database improvement |

This repository does not install `web-vitals` or send metrics to analytics. A production addition would record metrics with route/device/build version and alert on p75/p95 regression, not merely display a Lighthouse average from one machine.

```ts
// Illustrative main entry addition after installing web-vitals
import { onLCP, onINP, onCLS } from "web-vitals";

function report(metric: { name: string; value: number; id: string }) {
  navigator.sendBeacon("/rum", JSON.stringify(metric));
}

onLCP(report);
onINP(report);
onCLS(report);
```

The `/rum` endpoint should be designed to avoid collecting personal/card information and should sample/rate-limit appropriately.

### 26.3 Pagination versus virtualization

They solve different problems:

- **Pagination** reduces how many records the API sends. This project already paginates catalogue products (`page`, `totalPages`) and admin users/products.
- **Virtualization** reduces how many DOM rows are mounted at one time. It is needed when even one fetched page can contain hundreds/thousands of complex rows.

Without virtualization, a 10,000-row table creates 10,000 DOM row components. Scrolling, layout, memory, hover effects, and rerenders become slow. A virtualizer displays only the 20–50 rows currently visible plus a small overscan area, while using spacer height to preserve scroll position.

For this project, likely future candidates are the dashboard Orders/Users pages and a larger customer product grid. Keep server pagination even when virtualizing; use both for truly large data.

Illustrative `@tanstack/react-virtual` shape:

```tsx
const parentRef = useRef<HTMLDivElement>(null);
const rowVirtualizer = useVirtualizer({
  count: orders.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 56,
  overscan: 8,
});

return (
  <div ref={parentRef} style={{ height: 600, overflow: "auto" }}>
    <div style={{ height: rowVirtualizer.getTotalSize(), position: "relative" }}>
      {rowVirtualizer.getVirtualItems().map((virtualRow) => {
        const order = orders[virtualRow.index];
        return <OrderRow key={order.id} order={order} style={{ transform: `translateY(${virtualRow.start}px)` }} />;
      })}
    </div>
  </div>
);
```

In an interview, mention variable-height rows, keyboard accessibility, sticky headers, loading/error/empty rows, stable keys, overscan, and loading the next server page before the user reaches the end.

### 26.4 Memoization and expensive render work

The project already makes small targeted uses of `useMemo` and `useCallback`. For a performance hotspot:

1. Profile an interaction; find which component has expensive render time.
2. Keep object/array/function props stable where a memoized child depends on them.
3. Use `React.memo` around an expensive pure child, such as an OrderRow.
4. Move expensive filtering/sorting server-side when dataset is large.
5. Avoid putting one giant object in Context if every change rerenders every consumer; split contexts or use selectors.

Bad optimization example:

```jsx
const filters = { category, search }; // new object every render
return <MemoizedGrid filters={filters} />; // React.memo still sees a new prop object
```

Better when profiling proves it matters:

```jsx
const filters = useMemo(() => ({ category, search }), [category, search]);
return <MemoizedGrid filters={filters} />;
```

### 26.5 Code splitting and lazy loading

The current `client/src/App.jsx` statically imports every page and many overlay components. That is simple but bundles code for screens a visitor may never open (for example Payment, Orders, AI search). **Code splitting** creates a smaller initial JavaScript bundle and loads a module only when required.

```jsx
import { lazy, Suspense } from "react";

const Payment = lazy(() => import("./pages/Payment"));
const Orders = lazy(() => import("./pages/Orders"));

<Suspense fallback={<PageLoader />}>
  <Routes>
    <Route path="/payment" element={<Payment />} />
    <Route path="/orders" element={<Orders />} />
  </Routes>
</Suspense>
```

Use route-level splitting first. Keep the homepage shell/critical route eager. Preload a likely next route on intent (for example, cart/checkout hover) only if measurement supports it. Every split adds a request/loading boundary; too many tiny chunks can hurt on poor networks.

### 26.6 Bundle budgets

A **bundle budget** is a maximum acceptable size (for example, initial JavaScript gzipped size). CI fails or warns when a change crosses the budget. It prevents a large image/library from silently making every customer download more code.

For this project, inspect `client/dist/assets` after build and analyze the Vite Rollup output. Budget separately for customer and dashboard initial routes. Stripe, Maps, charting, and rich editor code are candidates for lazy loading. Also optimize images: serve WebP/AVIF where appropriate, resize at Cloudinary, reserve aspect ratio, and lazy-load below-the-fold media.

### 26.7 API and rendering performance

Frontend performance is also API performance:

- Request only fields needed by a list; fetch full details on detail page.
- Keep pagination/filter/sort server-side for large catalogue/order data.
- Debounce search input before calling the API; cancel obsolete requests.
- Avoid duplicate fetches (Redux state or TanStack Query cache helps).
- Use HTTP caching/CDN headers for public catalogue/static content where data freshness allows.
- Show a skeleton/loader immediately, but do not create layout shift.
- Handle sockets as invalidation signals, as this project does, rather than sending enormous payloads.

---

## 27. TanStack Query versus Redux Toolkit in this project

### 27.1 What TanStack Query is

TanStack Query (formerly React Query) is a library for **server state**: data that lives on an API/database and is fetched, cached, refetched, invalidated, retried, and marked stale. It is not a replacement for all React state.

```text
UI state: Is this modal open? What text is currently typed?     -> useState / Redux
Server state: What products did GET /product return?            -> TanStack Query is excellent
```

This code uses Redux Toolkit `createAsyncThunk` for both shared client state and server data. That works, but it means the project manually manages loading flags, errors, refetching, and socket refresh behavior in slices/components.

### 27.2 A TanStack Query product example

```tsx
function useProducts(filters: ProductFilters) {
  return useQuery({
    queryKey: ["products", filters],
    queryFn: async () => (await axiosInstance.get("/product", { params: filters })).data,
    staleTime: 30_000,
  });
}

function ProductsPage() {
  const { data, isPending, isError } = useProducts(filters);
  // data is cached by query key; same filters reuse cache.
}
```

After an admin changes stock, a socket listener can invalidate rather than hand-write every refetch:

```ts
queryClient.invalidateQueries({ queryKey: ["products"] });
```

For a write, use `useMutation`, then invalidate/update the relevant cached query. TanStack Query can also perform optimistic updates, retry policy, background refetch, infinite loading, cancellation, and cache garbage collection.

### 27.3 When to choose each

| Need | Better default |
|---|---|
| Cart line items, modal flags, local checkout step | Redux/local state (current project) |
| Theme/locale | Context (current project theme) |
| Products, orders, profile, CMS fetched from API | TanStack Query is often simpler |
| Complex cross-page client workflow/actions | Redux Toolkit can be strong |
| Existing Redux application with team convention | Redux thunks/RTK Query can be a valid consistent choice |

**RTK Query** is also worth mentioning in interviews. It is Redux Toolkit's data-fetching/caching solution and could be a less disruptive upgrade here than adding TanStack Query. The key interview idea is not “one library always wins”; it is separating client/UI state from remote/cacheable server state and choosing a tool deliberately.

---

## 28. PWA: installable and offline-capable React app

### 28.1 What a PWA is

A **Progressive Web App** is a web application that can provide app-like capabilities such as installation, offline behavior, fast cached assets, and sometimes push notifications. A PWA is not simply “a responsive website.”

The three basic pieces are:

1. **Web app manifest** — app name, icons, start URL, colors, display mode. It lets browsers offer installation.
2. **Service worker** — a background script that intercepts network requests and can cache responses/assets.
3. **HTTPS** — required outside localhost because a service worker has powerful network control.

This repository has no `manifest.webmanifest`, no service worker registration, and no Vite PWA plugin. It is **not currently a PWA**.

### 28.2 What should work offline in this ecommerce project?

Choose offline behavior by business risk:

| Resource | Good offline strategy |
|---|---|
| JS/CSS/fonts/logo/app shell | precache so previously visited app opens quickly |
| public product images/content | cache with expiration/stale-while-revalidate |
| product price/stock | show previously cached view with a visible “may be outdated” message; refresh online |
| cart | local persistence already exists, but validate inventory on checkout |
| checkout/payment/order submission | **network-only**; never queue/replay card/payment actions blindly |
| admin writes/status changes | network-only; show a clear offline error/retry, do not silently corrupt operations |

Offline does not remove server validation. This project's existing checkout stock/payment verification remains required.

### 28.3 Typical Vite PWA setup

Use `vite-plugin-pwa` after designing caching, icon, update, and test behavior:

```ts
// vite.config.ts — illustrative, not currently in this repo
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",
      manifest: {
        name: "Lumera",
        short_name: "Lumera",
        start_url: "/",
        display: "standalone",
        theme_color: "#ffffff",
        background_color: "#ffffff",
        icons: [
          { src: "/pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "/pwa-512x512.png", sizes: "512x512", type: "image/png" },
        ],
      },
    }),
  ],
});
```

Test a service worker in production build over HTTPS, not only localhost. Explain update behavior to users: with `registerType: "prompt"`, show “A new version is available — refresh” rather than unexpectedly replacing an active checkout screen. Audit offline cache for private/authenticated data; do not put sensitive user/order responses in a shared cache without careful design.

---

## 29. Internationalization (i18n) and multilingual UI

### 29.1 Why hardcoded text does not scale

This project contains English UI strings directly in components, for example button labels, toast messages, statuses, navigation labels, and validation text. That is fine for one language but makes EN/FR/DE/ES difficult: translators must edit code, wording duplicates, grammar/plural/date/currency formats differ, and RTL languages need layout support.

This is **not currently multilingual**. `toLocaleString("en-AE", { currency: "AED" })` is a good start for AED formatting, but it is not a complete i18n solution.

### 29.2 A practical design

Use a library such as `react-i18next`, organize translations by feature, and keep stable message keys:

```json
// locales/en/cart.json
{
  "title": "Your bag",
  "items_one": "{{count}} item",
  "items_other": "{{count}} items",
  "checkout": "Secure checkout"
}
```

```jsx
const { t, i18n } = useTranslation("cart");
<h1>{t("title")}</h1>
<p>{t("items", { count: cartCount })}</p>
<button>{t("checkout")}</button>
```

Do not build strings by concatenating translated fragments; grammar order changes across languages. Use pluralization/interpolation support. Format user-facing dates/numbers with `Intl` using current locale:

```js
new Intl.NumberFormat(locale, { style: "currency", currency: "AED" }).format(amount);
new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(order.created_at));
```

### 29.3 Project-specific i18n plan

1. Add a `LocaleProvider`/i18n initialization near `ThemeProvider` in `main.jsx`.
2. Convert shared navigation, buttons, validation/toast text, page headings, checkout content, and status labels into translation keys.
3. Keep dynamic database content separate: product names/descriptions/CMS banners need translated database fields or a CMS locale model, not only frontend JSON files.
4. Store user language preference (local storage/account preference) and use locale-aware `Intl` formatting.
5. Add a language selector; lazy-load translation files by locale to avoid initial bundle growth.
6. Test plural forms, long translations, accented characters, date/currency, empty state, and right-to-left layout if Arabic/Hebrew is planned.

---

## 30. Testing with Vitest and React Testing Library

### 30.1 Current status and test pyramid

There are no Vitest, React Testing Library, or test scripts configured in the frontend package files, and the server `test` script is a placeholder. This is a significant production gap for the job requirement “keep tests green.”

Use layers of tests:

| Test type | What it checks | Good project examples |
|---|---|---|
| Unit | one function/reducer/component behavior | cart reducers, AED formatters, location normalizers, promotion math helpers |
| Component | what a user can see/do in one component | ProductCard button, LoginModal validation, Pagination callback |
| Integration | several components/store/router/API mocking together | products filters -> request -> grid; AdminRoute redirect |
| API/server | route/controller/middleware/database behavior | user cannot access admin route; order rechecks stock; webhook signature path |
| E2E | a browser performs key journey | login, browse, cart, Stripe test checkout, admin product update visible to shopper |

### 30.2 React Testing Library philosophy

React Testing Library (RTL) encourages testing behavior as a user sees it: query a label/text/role, click/type, and assert visible result. Avoid testing private component state or implementation details.

```tsx
it("adds a product to the bag", async () => {
  const user = userEvent.setup();
  render(<ProductCard product={product} />, { wrapper: AppTestProviders });

  await user.click(screen.getByRole("button", { name: /add to bag/i }));

  expect(mockDispatch).toHaveBeenCalledWith(
    addToCart({ product, quantity: 1 })
  );
});
```

For better confidence, render an actual test Redux store and assert cart-count text changes rather than mocking every implementation detail. Use MSW (Mock Service Worker) to intercept Axios/HTTP at the network boundary for API-like tests.

### 30.3 Vitest setup sketch

```bash
cd client
npm install -D vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

```ts
// vite.config.ts / vitest config concept
test: {
  environment: "jsdom",
  setupFiles: "./src/test/setup.ts",
  globals: true,
}
```

```ts
// src/test/setup.ts
import "@testing-library/jest-dom/vitest";
```

Add scripts such as `"test": "vitest run"`, `"test:watch": "vitest"`, and a coverage command. The exact config should be added/reviewed with a TypeScript/Vite migration rather than copying snippets blindly into the current JS config.

### 30.4 High-value first tests for Lumera

1. Cart reducer: adds, merges quantity, does not exceed stock, removes, clears, persists safely.
2. Auth/admin guard: guest redirects, User redirects, Admin sees Outlet.
3. Products page: URL search parameters produce correct thunk/API request and loading/error/empty UI.
4. Payment form: missing required shipping field prevents `placeNewOrder`; successful Stripe mock clears cart only after confirmation.
5. Server order controller: edited browser price is ignored, no oversell under concurrent requests, invalid promotion rejected.
6. Stripe webhook: invalid signature rejected; duplicate success does not double-process order; failure restores stock once.
7. Socket LiveUpdates: event invalidates/refetches the active view and cleanup removes listener.

Tests should be deterministic: use fixed time/data, mock external providers, clean storage between tests, and use a separate test database. Never use live Stripe, production email, or production PostgreSQL in automated tests.

---

## 31. Accessibility and UI/UX design implementation

The role asks for turning designs into accessible, high-quality interfaces. “Pixel-perfect” is not enough if a keyboard, screen-reader, slow-network, or mobile user cannot complete the workflow.

### 31.1 Semantic HTML first

Use correct native elements before ARIA:

| Need | Prefer |
|---|---|
| action | `<button>` rather than clickable `<div>` |
| navigation | `<nav>` and `<a>`/React `<Link>` |
| text input | `<label htmlFor>` + `<input id>` |
| field errors | text associated with input via `aria-describedby` when useful |
| product/card grouping | `<article>` with heading/link |
| data table | `<table>`, `<thead>`, `<th scope>`, `<tbody>` |
| modal | dialog semantics, focus management, Escape/close behavior |

### 31.2 A practical component checklist

For every reusable component such as `ProductCard`, `ProductForm`, `CartSidebar`, or `LoginModal`, check:

1. Can I operate it with keyboard only? Tab order, Enter/Space, Escape for overlays.
2. Is visible focus present, not only hover?
3. Does every input have a label and meaningful error message?
4. Does color alone communicate error/stock/status?
5. Is text contrast sufficient across light/dark theme?
6. Does it work at 320px and at large widths, with 200% zoom and long translated text?
7. Are images meaningful (`alt`) or explicitly decorative (`alt=""`)?
8. Does loading preserve layout and convey status accessibly?
9. Does motion honor reduced-motion preference?
10. Does a screen reader hear appropriate name, role, value, and state?

Project strengths are semantic links/buttons, Tailwind responsive layouts, toast feedback, global color tokens, and a theme context. Recommended improvements are formal dialog focus trapping/restoration, more explicit aria relationships for validation, `prefers-reduced-motion`, automated accessibility checks, and testing with keyboard/screen reader.

---

## 32. Git, GitLab/GitHub, code review, and team collaboration

### 32.1 Everyday Git workflow

```text
main (protected, deployable)
  -> create feature branch
  -> make small focused commits
  -> run lint/tests/build locally
  -> push branch
  -> open GitHub Pull Request / GitLab Merge Request
  -> CI runs checks
  -> teammate reviews
  -> address comments / squash or rebase according to team policy
  -> merge after approval
```

Good commit message examples:

```text
feat(cart): prevent quantity above available stock
fix(checkout): restore reserved stock after failed payment intent
test(products): cover filters and empty state
perf(admin): virtualize order rows above 100 records
```

### 32.2 What to look for in a React code review

- Correctness: does it handle loading, error, empty, retry, cancelled request, permissions, and race conditions?
- State ownership: is local state/props/context/Redux/server cache chosen sensibly?
- React behavior: correct effect dependencies/cleanup, stable list keys, no state mutation, no unnecessary derived state.
- Performance: unnecessary renders, big images, huge list, duplicated fetch, bundle impact, debounce/cancel requirements.
- Accessibility: semantic controls, labels, keyboard/focus, contrast, mobile behavior.
- Security: server authorization still enforced, no secret in browser/config/logs, input validated, payment/webhook unchanged safely.
- Tests/docs: changed behavior has tests; environment/API/type contract documented.

### 32.3 Collaboration with backend, QA, design, and product

| Partner | Effective frontend collaboration behavior |
|---|---|
| Backend | agree endpoint/schema/error/pagination/auth contracts; share mock examples/OpenAPI; discuss cache invalidation/webhooks |
| QA | provide acceptance criteria, test IDs only when semantic queries are insufficient, loading/error edge cases, test payment environment |
| Design | confirm responsive states, loading/empty/error, hover/focus/disabled, long text/localization, dark mode, accessible colors |
| Product | clarify user outcome, analytics/metrics, feature flag/rollout, edge cases, operational policy for returns/refunds |

When API needs change, avoid silently coding around ambiguity. Write a small contract: URL, method, request body, success shape, error codes/message, auth/role, pagination/filter rules, and real-time invalidation event.

---

## 33. Vite in detail, in simple language

### 33.1 Vite's two jobs

**Development:** Vite starts a local web server. Instead of building one giant bundle every time you save, it serves modern JavaScript modules directly and updates the changed module through **HMR (Hot Module Replacement)**. React Fast Refresh tries to preserve component state while you edit UI.

**Production:** `vite build` prepares files for a real web server. It transforms JSX, resolves imports, removes development helpers, processes Tailwind/PostCSS, minifies/compresses code, produces cache-friendly hashed filenames, and writes static output to `dist/`.

```text
src/main.jsx + imports + CSS + assets
                |
                v
          Vite development server (npm run dev)
          OR production compiler (npm run build)
                |
                v
       dist/index.html + dist/assets/index-<hash>.js/css + assets
```

### 33.2 Important files in this repository

| File | What it means |
|---|---|
| `client/index.html` / `dashboard/index.html` | HTML entry document; Vite reads it and finds the module script/root element |
| `src/main.jsx` | JavaScript/React entry module imported by HTML |
| `vite.config.js` | Vite configuration; both enable `@vitejs/plugin-react` |
| dashboard `vite.config.js` | pins `server.port: 5174` and `strictPort: true` |
| `tailwind.config.js` | tells Tailwind which files to scan and extends theme tokens/animations |
| `postcss.config.js` | runs Tailwind and Autoprefixer while CSS is built |
| `.env` | Vite build-time environment values, only `VITE_*` exposed to app source |
| `public/` | copied unchanged to `dist/`; reference files from `/filename` |
| `src/assets/` | imported assets; Vite fingerprints/optimizes references |
| `dist/` | generated output; deploy this for each frontend, do not hand-edit it |

### 33.3 NPM commands decoded

| Command | Result |
|---|---|
| `npm run dev` | starts Vite dev server with HMR |
| `npm run build` | writes optimized production bundle to `dist/` |
| `npm run preview` | serves the already-built `dist/` locally to sanity-check it |
| `npm run lint` (client) | runs oxlint static checks; does not run app/server tests |

Dashboard development uses 5174 to allow customer Vite to use 5173 at the same time. Its `strictPort: true` fails rather than silently moving to another port. Customer Vite can choose the next port if 5173 is occupied; the API's development CORS permits local 5173–5179 ports. Production does not allow that flexible local rule: it uses exact public origins.

### 33.4 Vite environment modes

Vite loads files based on a mode:

```text
npm run dev                         -> development mode
npm run build                       -> production mode by default
vite build --mode staging           -> staging mode

.env                                -> all modes (local baseline)
.env.local                          -> all modes, ignored by Git
.env.production                     -> production build
.env.staging                        -> staging build
```

Only variables prefixed `VITE_` are sent to frontend code. This protects accidental exposure, but it is not permission control; a `VITE_STRIPE_SECRET_KEY` would still leak because of its prefix. Restart Vite after changing environment files in development. Build fresh bundles per environment because `import.meta.env` values are compiled into output.

### 33.5 Vite versus the Express server

Vite is **not** the production backend and it does not replace Express. Vite builds the two static browser applications. Express remains a long-running server for API routes, authentication cookies, PostgreSQL, Stripe webhooks, uploads, SMTP, and Socket.IO. Nginx/CDN/hosting serves `dist`, while a process/container platform runs `server/server.js`.

### 33.6 Useful Vite interview improvements

- Add `resolve.alias` such as `@/` for clean imports after agreeing team convention.
- Add `build.sourcemap` for production error debugging (protect/upload source maps correctly).
- Use `build.rollupOptions.output.manualChunks` only after bundle analysis; lazy routes/dependency splitting are usually a clearer first move.
- Configure dev proxy if desired to avoid local cross-origin setup, but keep production CORS/security correct.
- Use `.env.example` files listing variable names without values so onboarding is easy and secrets stay out of Git.
- Add bundle analysis and size budgets to CI.

---

## 34. Interview questions to practice with answers from this project

### “Explain props and state.”

Props are read-only input from a parent; state is data a component owns and can change. In Lumera, `Home` passes a product array as props to `ProductSlider`, which passes a product to `ProductCard`. `ProductCard` owns local hover state; the global cart belongs in Redux because Navbar, sidebar, cart page, and checkout all need it.

### “How does data move from a click to the database?”

For checkout: UI controlled state and Redux cart -> `placeNewOrder` thunk -> Axios POST with credential cookie -> Express route/auth middleware -> order controller validates server product prices/stock and promotion -> PostgreSQL saves order and Stripe intent -> Stripe webhook updates paid status -> Socket.IO invalidates relevant browser data. The browser never authorizes its own price or payment status.

### “Why Redux instead of Context?”

Context is used for the small theme concern. Redux is used for cross-page cart/auth/catalogue state with explicit actions, async thunk lifecycle, and predictable updates. For API-heavy cached data I would also consider RTK Query or TanStack Query to reduce manual loading/refetch/cache code.

### “How do you prevent unnecessary renders?”

First profile. Then use server pagination, list virtualization for thousands of rows, `useMemo` for measured expensive derivations, `useCallback`/stable props when a memoized child requires them, `React.memo` for costly pure rows, code split routes, and avoid broad context/global state updates. In this repo `useMemo` is already used for payment totals and filtered results, while virtualization/lazy routes remain improvements.

### “How would you make the Products page faster?”

Keep filtering/paging on API, debounce/cancel typed search, return lean list fields, lazy-load product images, use optimized Cloudinary image transforms, reserve image aspect ratio, split non-critical modules, cache/invalidate product queries, virtualize large grids, monitor LCP/INP/CLS at p75/p95, and verify with profiler/network traces before/after.

### “How does protected routing work?”

Dashboard `AdminRoute` checks Redux `authUser` and role then renders `Outlet` or redirects. That only protects UI navigation. The real protection is Express `isAuthenticated` verifying the HTTP-only JWT cookie and `authorizeRoles("Admin")` enforcing the role for each endpoint.

### “How do real-time changes work?”

The API and Socket.IO share an HTTP server. The socket validates the same cookie and joins user/admin rooms. Controllers emit a small event after product/order/CMS changes. Client `LiveUpdates` listens and dispatches REST refetch thunks, keeping data authoritative and avoiding huge socket payloads.

### “How would you add tests?”

Install/configure Vitest + React Testing Library + JSDOM, add tests from reducers/utilities through component/integration tests, use MSW for network boundaries, add API tests with an isolated PostgreSQL database and mocked Stripe, add E2E for critical checkout/admin flows, then make tests/lint/build required Jenkins/GitLab CI checks.

### “How would you add TypeScript safely?”

Use incremental migration: enable `allowJs`, model Product/User/Order/API types, convert leaf components first, type Redux state/thunks/Axios returns, validate runtime API data with schemas, then move toward strict options. I would not try to convert every file in one risky pull request.

### “What makes a PWA safe for checkout?”

Cache app shell and public content carefully; clearly label stale product data; keep payment/order submission network-only; never cache sensitive account data indiscriminately or replay card requests. Use HTTPS, a manifest, service worker, controlled update prompts, and offline tests.

---

## 35. Four-week preparation plan using this project

### Week 1 — React basics and project navigation

- Explain components, JSX, props, state, events, list keys, conditional rendering, controlled forms.
- Read `main.jsx`, `App.jsx`, `Home.jsx`, `ProductCard.jsx`, `FAQ.jsx`, and `Cart.jsx` slowly.
- Draw the customer route map without looking.
- Build one small new presentational component using existing Tailwind tokens.

### Week 2 — Hooks, state, APIs, and routing

- Explain `useEffect` cleanup/dependencies, `useMemo`, `useCallback`, `useRef`, Context, and render behavior.
- Trace `fetchProducts` from page -> Redux thunk -> Axios -> Express route/controller -> database -> UI.
- Trace sign-in and admin route protection.
- Trace the cart/checkout state path and explain why backend validation is necessary.

### Week 3 — Production React concepts

- Study TypeScript types/unions/generics and convert one simple component in a practice branch.
- Learn Vitest/RTL; write cart reducer, ProductCard, and AdminRoute tests.
- Learn React DevTools Profiler, Chrome Network/Performance, Core Web Vitals, image optimization, lazy loading, and virtualization.
- Design a PWA/i18n plan without pretending it exists now.

### Week 4 — Full-stack, deployment, and interview practice

- Explain cookie auth, CORS, JWT, authorization, Stripe webhook, PostgreSQL relationships, Socket.IO rooms.
- Read production/Jenkins sections and be able to describe build -> artifact -> staging -> approval -> production -> rollback.
- Practice the questions above aloud in 60–90 second answers.
- Prepare two stories: one bug you traced end-to-end and one improvement you would make (for example virtualized admin orders with test/metric proof).

The goal is not to memorize library definitions. It is to confidently explain **why a value belongs in a particular place, how a user action safely reaches the backend, what the UI does while waiting/failing, and how you would keep the system fast and testable as it grows.**

---

## 36. Tailwind CSS — complete practical guide for this project and interviews

### 36.1 What Tailwind CSS is

Tailwind CSS is a **utility-first CSS framework**. Instead of writing a new CSS selector for every small visual rule, you compose small, named utility classes directly on an element.

```jsx
// Traditional CSS approach
<button className="saveButton">Save</button>

// Tailwind approach used in this project
<button className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
  Save
</button>
```

The Tailwind classes mean:

| Class | CSS idea |
|---|---|
| `rounded-xl` | large border radius |
| `bg-primary` | background using the project primary color token |
| `px-4` | horizontal padding |
| `py-2` | vertical padding |
| `text-sm` | small font size |
| `font-semibold` | semi-bold font weight |
| `text-primary-foreground` | accessible foreground color paired with primary background |

Tailwind does **not** mean “no CSS knowledge.” You still need to understand box model, display, position, flexbox, grid, typography, color/contrast, overflow, stacking contexts, media queries, transitions, and accessibility. Tailwind gives those CSS decisions a fast, consistent vocabulary.

### 36.2 How Tailwind works in Lumera

```text
JSX files with Tailwind class names
             +
client/dashboard tailwind.config.js content patterns
             +
index.css @tailwind directives
             |
             v
Tailwind scans source at build time and generates only needed CSS
             |
             v
Vite/PostCSS puts compiled CSS into dist assets
```

This project uses Tailwind 3.4, PostCSS, and Autoprefixer in both apps.

| File | Role |
|---|---|
| `client/tailwind.config.js` | customer scanning, dark-mode strategy, design tokens, fonts, keyframes/animation names |
| `dashboard/tailwind.config.js` | equivalent dashboard design system configuration |
| `client/src/index.css` | imports Tailwind layers; customer global variables/base/component classes/keyframes |
| `dashboard/src/index.css` | imports Tailwind layers; dashboard global variables/base/component classes |
| `postcss.config.js` | tells Vite to run Tailwind then Autoprefixer |
| component/page `.jsx` files | compose actual visual UI with utility classes |

The `content` setting is important:

```js
content: ["./index.html", "./src/**/*.{js,jsx}"]
```

It tells Tailwind where to look. If you add a `components/` folder outside `src`, or dynamically create class names that Tailwind cannot see, the expected CSS may not be emitted. Update `content` or use a `safelist` deliberately.

### 36.3 Tailwind layers

At the top of each `index.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

Think of them this way:

| Layer | Use it for |
|---|---|
| `base` | reset/default element styling: `body`, headings, selection, focus defaults |
| `components` | named, reusable multi-property patterns such as a surface/card/button pattern |
| `utilities` | atomic classes used directly in JSX, including responsive/state variants |

If a repeated style needs a reusable name, write it in `@layer components` with `@apply` sparingly:

```css
@layer components {
  .surface-card {
    @apply rounded-2xl border border-border bg-card shadow-sm;
  }
}
```

Then use `<article className="surface-card p-5">`. Do not put every one-off element into global CSS: the component’s JSX is often clearer for a style used only once.

### 36.4 The CSS box model in Tailwind

Every element is a box:

```text
margin -> border -> padding -> content
```

Common utility groups:

| CSS concern | Tailwind examples | Meaning |
|---|---|---|
| Width/height | `w-full`, `w-12`, `max-w-6xl`, `min-h-screen`, `h-10` | sizing constraints |
| Padding | `p-4`, `px-6`, `py-3`, `pt-8` | space inside border |
| Margin | `m-4`, `mx-auto`, `mt-6` | space outside border |
| Gap | `gap-2`, `gap-x-6`, `gap-y-4` | spacing between flex/grid children; usually cleaner than margins |
| Border | `border`, `border-border`, `border-2`, `rounded-xl` | visible boundary/corners |
| Shadow | `shadow-sm`, `shadow-lg` | elevation/visual separation |
| Overflow | `overflow-hidden`, `overflow-auto`, `overflow-x-auto` | clipping/scrolling content |

Project examples:

- `min-h-screen` in `App.jsx` makes a page at least viewport height.
- `mx-auto max-w-*` style patterns center content and cap line length.
- `gap-*` appears across product grids, forms, cards, and dashboard layout.
- `overflow-hidden` is used where an image/card/slider should not escape rounded corners.
- admin tables should use `overflow-x-auto` when they cannot fit a narrow screen.

### 36.5 Flexbox: one-dimensional layout

Use **flexbox** when arranging items along one main direction: a row or column.

```jsx
<div className="flex items-center justify-between gap-3">
  <h2>Products</h2>
  <button>Add product</button>
</div>
```

| Utility | CSS meaning | Typical use |
|---|---|---|
| `flex` | `display: flex` | put children in flex layout |
| `flex-col` / `flex-row` | main direction | stack form fields / header row |
| `items-center` | align on cross axis | vertically center icon + label |
| `justify-between` | push children to ends | title left, action right |
| `justify-center` | center on main axis | loader/content center |
| `flex-1` | grow into available space | search input/content column |
| `shrink-0` | do not shrink | icon/avatar/fixed button |
| `flex-wrap` | allow next line | filter chips/actions on mobile |
| `gap-*` | space between items | consistent spacing |

Project examples include Navbar icon/label groups, CartSidebar rows, dashboard navigation links, `AuthLoader`, and checkout action bars.

Common interview pitfall: `justify-*` follows the **main axis**, which changes when you add `flex-col`; `items-*` follows the cross axis. Explain that you choose flex for a linear layout, not for a two-dimensional card grid.

### 36.6 Grid: two-dimensional layout

Use **CSS Grid** when both columns and rows matter. Product galleries, card catalogues, dashboard stats, and form layouts are good fits.

```jsx
<section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
  {products.map((product) => <ProductCard key={product.id} product={product} />)}
</section>
```

| Utility | Meaning |
|---|---|
| `grid` | `display: grid` |
| `grid-cols-1`, `grid-cols-2`, `grid-cols-4` | number of equal columns |
| `col-span-2` | item covers two columns |
| `grid-rows-*` | defines rows where needed |
| `auto-rows-*`, `auto-cols-*` | automatic track sizes |
| `place-items-center` | center on both axes |
| `gap-*` | consistent row/column spacing |

This project’s `grid grid-cols-1 ... sm:grid-cols-2 lg:grid-cols-4` pattern is a useful interview example: it starts on a single small-screen column and progressively creates a denser desktop product grid. Grid chooses the page/card structure; flex handles the content inside each card.

### 36.7 Positioning, z-index, and overlays

| Utility | Meaning / project use |
|---|---|
| `relative` | creates a positioning reference for absolutely positioned children; common on cards/galleries |
| `absolute inset-0` | pin an overlay to all edges of parent |
| `fixed inset-0` | cover entire viewport; auth loader, modal backdrop, side panels |
| `sticky top-0` | stick header/filter while scrolling (use carefully) |
| `z-10`, `z-50`, `z-[100]` | stacking level for cards/header/modal/loader |
| `pointer-events-none` | decorative overlay cannot intercept clicks |

`client/src/App.jsx`’s `AuthLoader` is a good read: `fixed inset-0 z-[100]` produces a full screen authentication overlay. It has `relative` interior positioning and `absolute` animated orbs. A page may look broken if z-indexes are unplanned, so define a simple team scale (content, sticky header, dropdown, overlay, modal, toast) instead of choosing random huge numbers everywhere.

Important CSS fact: `z-index` only competes inside stacking contexts. Properties such as `transform`, `opacity`, `filter`, and positioned elements can create a new stacking context. If `z-50` “does not work,” inspect the parent stacking context before making it `z-[99999]`.

### 36.8 Responsive design: mobile-first Tailwind

Tailwind is mobile-first. A class without a breakpoint applies on all sizes. A prefixed class adds/overrides it at that minimum width and larger.

The project does not override Tailwind’s default `screens`, so standard breakpoints apply:

| Prefix | Minimum viewport width | Read it as |
|---|---:|---|
| none | 0px | mobile/default |
| `sm:` | 640px | small tablet/large phone and up |
| `md:` | 768px | tablet and up |
| `lg:` | 1024px | laptop and up |
| `xl:` | 1280px | desktop and up |
| `2xl:` | 1536px | very wide screen and up |

```jsx
<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
```

Read it as: “On a phone, stack children vertically with gap. At 768px or wider, arrange them in a row, center them cross-axis, and spread them apart.”

#### A responsive product/grid example

```jsx
<main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
    {/* cards */}
  </div>
</main>
```

This creates:

```text
mobile:  full-width main, 1 product column, 16px side padding
sm:      2 product columns, 24px side padding
lg:      3 product columns, 32px side padding
xl:      4 product columns, content remains capped at max width
```

#### What responsive design really includes

Responsive design is not only adding `md:` classes. Check:

- touch targets (usually at least approximately 44 × 44 CSS pixels for primary actions);
- long product names/translations and large system font settings;
- keyboard focus and hover features that do not exist on touch screens;
- mobile navigation and filters rather than squeezing desktop menus;
- product images with stable aspect ratio to prevent layout shift;
- table usability on small width;
- safe fixed bottom actions that do not cover content or phone browser UI;
- 320px width, 200% zoom, landscape, and slow network tests.

### 36.9 Responsive visibility and order

Useful patterns:

```jsx
<button className="md:hidden">Open mobile menu</button>
<nav className="hidden md:flex">Desktop links</nav>

<aside className="order-2 lg:order-1">Filters</aside>
<section className="order-1 lg:order-2">Products</section>
```

`hidden` removes the element from layout and accessibility tree. Use it only when another accessible control replaces it. `sr-only` visually hides text while keeping it readable to screen readers; it is useful for icon-only controls when a visible label is not feasible:

```jsx
<button aria-label="Open cart"><ShoppingCart /><span className="sr-only">Open cart</span></button>
```

Avoid rendering two focusable copies of the same action without thinking. On responsive navs, the hidden desktop/mobile version should not leave invisible tab stops.

### 36.10 Typography and content

| Need | Tailwind examples |
|---|---|
| Font family | `font-sans`, `font-display` (project custom) |
| Size | `text-xs`, `text-sm`, `text-base`, `text-xl`, `text-3xl` |
| Weight | `font-medium`, `font-semibold`, `font-bold` |
| Line height | `leading-tight`, `leading-relaxed` |
| Letter spacing | `tracking-wide`, `tracking-[0.28em]` |
| Alignment | `text-left`, `text-center` |
| Overflow | `truncate`, `line-clamp-*` (requires plugin/config if used) |
| Responsive type | `text-2xl sm:text-3xl lg:text-5xl` |

Lumera extends `fontFamily` with `font-display` (Syne) and `font-sans` (Outfit). Use display type sparingly for brand headings and readable sans text for forms/body. Do not fix a layout with `truncate` when the full product name is critical; provide full text via title/detail or use responsive wrapping.

### 36.11 Colors and the Lumera design-token system

Tailwind includes named colors, but this project deliberately maps semantic Tailwind names to CSS variables:

```js
colors: {
  ink: "rgb(var(--ink) / <alpha-value>)",
  fog: "rgb(var(--fog) / <alpha-value>)",
  primary: {
    DEFAULT: "rgb(var(--primary) / <alpha-value>)",
    foreground: "rgb(var(--primary-foreground) / <alpha-value>)",
  },
  card: "rgb(var(--card) / <alpha-value>)",
  border: "rgb(var(--border) / <alpha-value>)",
}
```

That is why code uses `bg-fog`, `text-ink`, `bg-primary`, `text-primary-foreground`, `bg-card`, and `border-border` rather than scattered literal colors. The variables are defined in `:root`; customer `.dark` changes them. `/` opacity syntax works because Tailwind receives an RGB variable with an alpha placeholder:

```jsx
<div className="border border-primary/20 bg-primary/10 text-primary" />
```

**Interview answer:** “We use semantic design tokens so components describe purpose rather than a hard-coded hex. Theme changes update variables in one place. A primary button uses the matching foreground token for contrast, not an arbitrary text color.”

### 36.12 Dark mode in this project

`darkMode: "class"` means Tailwind’s `dark:` variant responds to a `dark` class, not necessarily to operating-system preference directly.

```jsx
<div className="bg-fog text-ink dark:bg-[#0c0e12]">...</div>
```

`ThemeProvider` reads the saved preference, toggles `document.documentElement.classList`, sets `colorScheme`, and stores the choice in `localStorage`. `Navbar` uses `useTheme()` to switch it.

Two valid theming approaches appear together:

1. Most colors change automatically through CSS variable token values under `.dark`.
2. Rare explicit dark differences use `dark:` utilities.

Prefer token changes for broad theme design. Excessive `dark:bg-[...]` one-offs make a theme harder to maintain. Consider system preference as a default using `window.matchMedia("(prefers-color-scheme: dark)")`, while preserving a user’s explicit selection.

### 36.13 Pseudo-class and state variants

Tailwind variants generate CSS for a state. Important ones:

| Variant | Use | Example |
|---|---|---|
| `hover:` | pointer hovering | `hover:bg-primary` |
| `focus:` | element has keyboard/programmatic focus | `focus:ring-2` |
| `focus-visible:` | show focus mainly for keyboard navigation | `focus-visible:outline-none focus-visible:ring-2` |
| `active:` | currently pressed | `active:scale-[0.98]` |
| `disabled:` | disabled control | `disabled:cursor-not-allowed disabled:opacity-50` |
| `group-hover:` | child changes when parent `.group` hovers | product image/action overlay |
| `peer-*` | sibling changes based on form input state | checked/error input patterns |
| `data-[state=open]:` | based on data attribute | headless component state |
| `dark:` | dark class active | dark-theme variation |
| `motion-reduce:` | user prefers reduced motion | disable/reduce animation |

An accessible primary button pattern:

```jsx
<button
  disabled={saving}
  className="rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground transition-colors hover:bg-accent-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
>
  {saving ? "Saving…" : "Save changes"}
</button>
```

Do not make important information hover-only. Touch users cannot hover, and keyboard users need focus state. `transition` without a focus state is not accessibility.

### 36.14 Transitions and animation

**Transition** animates a change from one state to another:

```jsx
className="transition-colors duration-200 ease-out hover:bg-primary"
```

**Animation** runs a keyframe timeline by itself or when a class appears:

```jsx
className="animate-fade-up"
```

Lumera’s Tailwind configuration defines `fade-up`, `fade-in`, `fade-in-up`, `drift`, slide-ins, and `scale-in`. Its customer global CSS includes additional named keyframes for hero/ambient motion. The auth loader uses built-in `animate-spin`.

Good animation uses:

- show an item entering or a panel opening;
- give a loader meaning;
- gently guide attention without blocking task completion.

Poor animation uses:

- long animations on every card/page interaction;
- movement that shifts layout unexpectedly;
- motion that cannot be reduced for sensitive users;
- animation used instead of loading/error feedback.

Add reduced-motion support for project animations:

```jsx
<div className="animate-fade-up motion-reduce:animate-none">...</div>
```

### 36.15 Forms in Tailwind

Forms need visual consistency **and** correct HTML behavior. A reusable input class can be a local constant (as `Payment.jsx` does) or a component:

```jsx
const inputClass =
  "w-full rounded-xl border border-border bg-card px-3 py-2.5 text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60";

<label className="grid gap-1.5 text-sm font-medium text-ink">
  Email address
  <input className={inputClass} type="email" autoComplete="email" value={email} onChange={onChange} />
</label>
```

Error state example:

```jsx
<input
  aria-invalid={Boolean(errors.email)}
  aria-describedby={errors.email ? "email-error" : undefined}
  className={`${inputClass} ${errors.email ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""}`}
/>
{errors.email && <p id="email-error" className="text-sm text-red-700">{errors.email}</p>}
```

Project forms use local React state/Redux thunks/Axios, not a form library. That is acceptable for current complexity. For very large forms, React Hook Form plus a schema validator can reduce rerenders and centralize validation; understand the trade-off before adding it.

### 36.16 Cards, images, tables, and modals

#### Product card

`components/Products/ProductCard.jsx` is a reusable card pattern: it receives a product prop, resolves images, shows price/stock/rating/badge, links to detail, dispatches cart/wishlist actions, and has hover interactions. A card should preserve image space to avoid layout shift:

```jsx
<img className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-105" alt={product.name} />
```

`aspect-square` reserves shape; `object-cover` crops safely; `group-hover` lets parent hover animate image. Always give meaningful product images correct `alt` text.

#### Tables

Dashboard order/user tables can become wider than mobile screens. Wrap in `overflow-x-auto`, keep headers semantic, and do not hide critical actions. At a large data scale, combine server pagination and row virtualization (Section 26).

```jsx
<div className="overflow-x-auto rounded-2xl border border-border">
  <table className="min-w-full text-left text-sm">...</table>
</div>
```

#### Modals and drawers

The project has global overlays for login/search/cart/AI and uses a portal for `ProfilePanel`. A basic visual Tailwind pattern is not enough; dialog focus behavior matters:

```jsx
<div className="fixed inset-0 z-50 grid place-items-center bg-ink/50 p-4">
  <section role="dialog" aria-modal="true" aria-labelledby="dialog-title" className="w-full max-w-lg rounded-2xl bg-card p-6 shadow-2xl">
    <h2 id="dialog-title">Edit profile</h2>
  </section>
</div>
```

Production dialog requirements: close on Escape if appropriate, move focus into dialog, trap tab focus while open, return focus to trigger when closed, prevent inaccessible background interaction, and avoid overflowing on a short mobile viewport. A maintained dialog primitive/library can help.

### 36.17 Dynamic class names: a Tailwind gotcha

Tailwind scans **complete class strings**, not arbitrary runtime construction. This may fail:

```jsx
// Avoid: Tailwind cannot reliably see `bg-red-500` at build time.
<div className={`bg-${tone}-500`} />
```

Use a static mapping:

```jsx
const tones = {
  success: "bg-emerald-100 text-emerald-800",
  warning: "bg-amber-100 text-amber-800",
  error: "bg-rose-100 text-rose-800",
};
<span className={tones[status]}>{status}</span>
```

`dashboard/src/pages/Overview.jsx`, `Sales.jsx`, `Returns.jsx`, and `Support.jsx` use status/style mapping patterns. They are more reliable, readable, and safer than dynamic string building.

### 36.18 Class composition and conflicting utilities

When a component needs optional classes, string templates work for small cases:

```jsx
className={`rounded-xl p-4 ${selected ? "border-primary bg-primary/5" : "border-border"}`}
```

For a large shared component library, consider `clsx` for conditional joining and `tailwind-merge` to resolve conflicts such as `p-2 p-4`. This repository does not currently install either, so do not claim it does. Keep class order understandable: base layout -> spacing -> colors -> effects -> states -> responsive variants is one readable convention.

### 36.19 Arbitrary values: useful, but not the default

Tailwind allows exact values such as `w-[42px]`, `z-[100]`, `tracking-[0.28em]`, and `bg-[#0c0e12]`. The project uses a few, including the loader z-index and special tracking/dark color.

Use arbitrary values when a value is genuinely unique. If a value repeats, add a semantic token or extend Tailwind configuration. Excessive arbitrary values recreate unstructured CSS in JSX and weaken the design system.

### 36.20 Tailwind interview questions and strong answers

**“Why Tailwind instead of CSS Modules?”**

Tailwind gives consistent spacing/color/typography tokens and keeps most visual decisions beside markup, which speeds component work and prevents many one-off CSS selectors. CSS Modules provide local named classes and can be clearer for large complex styles. I choose based on team/design-system needs; Tailwind does not eliminate the need for semantic components and global tokens.

**“How does responsive Tailwind work?”**

It is mobile-first. `grid-cols-1 md:grid-cols-3` means one column by default and three at 768px+. I start with small-screen content order/touch targets, then enhance at breakpoints rather than designing desktop first and hiding problems.

**“How do you support dark mode?”**

This project uses `darkMode: "class"`. ThemeContext toggles a `dark` class on `<html>` and persists preference. Most colors are CSS-variable semantic tokens updated under `.dark`; `dark:` utilities handle exceptions. I test contrast and use a system preference as a reasonable default.

**“How do you avoid a large Tailwind CSS file?”**

Tailwind scans configured source files and emits utilities it finds. Correct `content` paths are essential. I avoid dynamic string classes Tailwind cannot detect, analyze production bundles, and do not add broad safelists without need.

**“How do you make Tailwind accessible?”**

Tailwind only styles; accessibility comes from semantic HTML and behavior. I add visible `focus-visible` states, disabled/loading semantics, labels/errors, correct contrast, touch targets, keyboard-friendly modals, responsive behavior, and reduced-motion variants. Hover alone is never the only interaction.

### 36.21 Tailwind practice tasks for this project

Practice these in a non-production feature branch:

1. Make a `Button` component with primary/secondary/danger variants, loading state, visible focus, disabled state, and `type` prop.
2. Improve an admin table to scroll safely on narrow widths and show a card-like mobile alternative.
3. Add `motion-reduce:animate-none` to one existing animated component.
4. Extract a repeated `surface-card` pattern into `@layer components`, then remove duplicated visual classes.
5. Create a fully responsive product-grid skeleton that preserves image/card dimensions while API data loads.
6. Toggle theme and verify every card/input/modal/status has sufficient light/dark contrast.
7. Test Navbar, cart drawer, and filter controls at 320px, 768px, 1024px, 200% zoom, keyboard-only, and dark mode.

Be able to explain why you chose grid versus flex, why your breakpoint changes content structure, how focus/disabled state works, and how you avoided layout shift. That is much more valuable than reciting every Tailwind utility.

---

## 37. How to crack this React interview: practical strategy

### 37.1 Read the job description as a scoring rubric

The role emphasizes these six themes:

```text
1. Correct React architecture        4. Production performance
2. TypeScript and reusable UI        5. Quality: accessibility and tests
3. APIs/auth/realtime/PWA            6. Collaboration and delivery
```

Prepare one project story and one technical explanation for every theme. Use the Lumera codebase where it is real; label plans as plans where the feature is absent.

| Theme | Real Lumera story | Improvement story you can discuss |
|---|---|---|
| Architecture | shared ProductCard/layout pages/Redux slices | migrate server data to Query/RTK Query boundaries |
| API/auth/realtime | cookie JWT, admin roles, Axios, Socket.IO rooms | add standardized error/interceptor/contract tests |
| Responsive UI | Tailwind grids/dark theme/customer/admin layouts | systematic modal/table accessibility audit |
| Performance | server catalogue pagination; `useMemo` totals/filtering | virtualize admin rows, lazy routes, measure WVs/budgets |
| Type safety/testing | explain incremental migration/testing plan honestly | type Product/Order and add reducer/RTL/API test suite |
| Delivery | Vite three-app build, health endpoint, Jenkins plan | actual artifact CI/staging/rollback implementation |

### 37.2 Use a concise answer structure

For conceptual questions, use:

```text
Definition -> Why it matters -> Concrete project example -> Trade-off / edge case
```

Example for `useEffect`:

> “`useEffect` synchronizes a rendered component with an external system. In Lumera, HeroSlider starts an interval and cleans it up, while LiveUpdates subscribes to Socket.IO and removes listeners on cleanup. I keep dependencies accurate to avoid stale values or repeat subscriptions; I do not use an effect for a value I can calculate in render.”

For behavioral questions, use **STAR**:

```text
Situation -> Task -> Action -> Result -> What you learned
```

If you do not have a production metric, do not invent one. Say what you measured or what you would measure: “I would compare before/after p75 INP, LCP, bundle size, render duration, and API p95.”

### 37.3 During a live coding task

1. Repeat the requirements and clarify user/edge cases (loading, empty, error, permissions, mobile, accessibility).
2. State a short plan before typing: components, state ownership, API boundary, tests.
3. Start with semantic structure and a working simple version.
4. Keep state minimal; calculate derived values instead of duplicating them.
5. Use stable list keys and controlled form inputs when validation matters.
6. Add loading/error/empty feedback and keyboard/focus behavior before decorative polish.
7. Explain performance choices appropriate to scale: pagination/debounce/memoization/virtualization only when justified.
8. Narrate trade-offs. Interviewers evaluate communication, not only the final code.
9. At the end, name tests and improvements you would add with more time.

### 37.4 A sample implementation answer: “Build a searchable product list”

Say something like:

> “I would keep the typed search input local, debounce it before network requests, and keep the applied query in URL search params so the result is shareable. The API owns pagination/filtering. I would render loading, error, empty, and results states; use a semantic form/search label; lazy-load images; and use product IDs as keys. At thousands of rows I would keep API pagination and add virtualization. I would test the debounce/query behavior, loading/error state, and keyboard flow.”

This is stronger than immediately writing a `useEffect` that fetches on every keystroke.

### 37.5 Performance deep-dive answer: “The page is slow; what do you do?”

```text
1. Define slow: LCP, INP, API p95, JS long task, scroll jank, memory?
2. Reproduce on throttled mobile/prod-like data.
3. Profile: React Profiler + Chrome Performance + Network + server traces.
4. Locate root cause: image size, large DOM, rerender, bundle, API/database, third party.
5. Apply focused remedy and check regression.
6. Ship metric/alert/budget so the problem does not return.
```

Map remedy to cause:

| Root cause | Likely remedy |
|---|---|
| Largest hero image delays LCP | responsive Cloudinary sizes, modern format, preload only critical image, reserve dimensions |
| thousands of table DOM nodes | server pagination + virtualized rows |
| all cards rerender on one input | state closer to input, stable props, memoize expensive rows after profiling |
| giant initial JS bundle | lazy routes/dependencies, bundle analyzer/budget |
| search API called per character | debounce, cancellation, query cache |
| slow API p95 | indexed/filtering query, reduce response payload, cache safe public data, backend trace |
| interaction blocked by computation | defer/split compute, Web Worker for heavy CPU, avoid unnecessary work |

### 37.6 Questions you should ask the interviewer

Good questions show you think about product and engineering outcomes:

- What are the largest user journeys and their current LCP/INP/p95 targets?
- What is the largest table/list today, and how do you handle pagination/virtualization?
- Does the team use Redux, Zustand, TanStack Query, RTK Query, or a combination? How is server state cached/invalidated?
- How are design tokens, accessibility checks, visual regression, and component reuse managed?
- What does the frontend test pyramid look like? Are E2E tests required before release?
- How is PWA/offline behavior scoped, especially around authenticated or payment flows?
- How are locales/content translations managed? Which languages and RTL requirements matter?
- What does CI/CD do on pull requests and production releases? What is the rollback process?
- How do frontend, backend, QA, design, and product agree API/design contracts?

### 37.7 What not to do

- Do not claim TypeScript/PWA/TanStack Query/virtualization/tests exist in this repo when they do not.
- Do not say `useMemo` always improves performance; explain trade-offs and profiling.
- Do not say frontend route protection secures an API; server authorization is required.
- Do not store Stripe secret keys/JWTs/card data in browser code or `localStorage`.
- Do not use `index` as key for changing lists.
- Do not call a page “responsive” only because it has one `md:` class; test the whole interaction.
- Do not focus only on happy path; mention loading, failure, retries, empty state, permissions, slow network, and accessibility.
- Do not give a long generic answer without a codebase example or trade-off.

### 37.8 Final day checklist

Before the interview, practice explaining without reading notes:

- [ ] Props vs state vs Context vs Redux vs TanStack Query
- [ ] What triggers a React render; render/commit/effect; effect cleanup
- [ ] Controlled form, validation layers, error/loading/empty states
- [ ] React Router nested/protected routes and why server authorization still matters
- [ ] Axios API request and cookie/JWT/CORS flow
- [ ] Socket.IO event/room/invalidation path
- [ ] Flex vs grid; mobile-first Tailwind breakpoints; dark mode; focus/hover/animation
- [ ] `useMemo`/`useCallback`/`React.memo`; pagination vs virtualization; code splitting; Core Web Vitals/p95
- [ ] TypeScript benefits/union/generics/runtime validation and migration approach
- [ ] PWA manifest/service worker/caching risks for checkout
- [ ] i18n keys/Intl/plurals/RTL/CMS content implications
- [ ] Vitest/RTL/MSW/E2E testing strategy
- [ ] Vite development versus production build; `VITE_*` values are public/build-time
- [ ] Build -> artifact -> staging -> test -> approval -> production -> health check -> rollback

If you can explain every item above in simple language and connect it to a real file/flow in Lumera, you will sound prepared, practical, and trustworthy—exactly what strong frontend interviewers look for.

---

## 38. Exact client library reference — what every package does

This section is an exact beginner-friendly map of `client/package.json`. It answers two interview questions: **“Why is this package in the project?”** and **“Where is it used?”**

### 38.1 Runtime dependencies: shipped/used by the customer application

| Package | Plain-English purpose | Where it is used in Lumera |
|---|---|---|
| `react` | lets us create component functions, JSX, hooks, and stateful UI | every `.jsx` file; `useState`, `useEffect`, `useMemo`, etc. |
| `react-dom` | connects React components to the browser DOM | `src/main.jsx` calls `createRoot`; `ProfilePanel` uses `createPortal` |
| `react-router-dom` | maps browser URLs to React pages and provides no-reload links/navigation | `App.jsx`, all route pages, Navbar, Footer, Sidebar, product/search/checkout navigation |
| `@reduxjs/toolkit` | creates the Redux store, slices, reducers, actions, and async thunks with less boilerplate | `src/store/store.js` and every `src/store/slices/*Slice.js` |
| `react-redux` | React bridge for Redux; provides `<Provider>`, `useSelector`, and `useDispatch` | `main.jsx`, App, pages, Layout, ProductCard, LiveUpdates |
| `axios` | HTTP client used to call Express REST endpoints | `src/lib/axios.js`, Redux thunks, contact/address/checkout/newsletter/search requests |
| `socket.io-client` | keeps a real-time connection to the Socket.IO server | `src/lib/realtime.js`; `components/LiveUpdates.jsx` |
| `@stripe/stripe-js` | securely loads Stripe.js and creates the Stripe promise from a public key | `pages/Payment.jsx` |
| `@stripe/react-stripe-js` | React components/context for Stripe Payment Element | `Payment.jsx` wraps `Elements`; `components/PaymentForm.jsx` confirms payment |
| `lucide-react` | ready-made accessible SVG icon React components | Navbar, buttons, product cards, admin-style visual controls, loaders/icons throughout client |
| `react-toastify` | popup success/error notification system | `main.jsx` has `ToastContainer`; auth/product/order/forms call `toast.success/error` |

### 38.2 Development dependencies: help build/check code, not customer features

| Package | Plain-English purpose | Current status in Lumera |
|---|---|---|
| `vite` | fast local dev server and production build tool | `npm run dev`, `npm run build`, `npm run preview` |
| `@vitejs/plugin-react` | tells Vite how to transform React JSX and enable Fast Refresh | `vite.config.js` |
| `tailwindcss` | generates the utility CSS classes used in JSX | `tailwind.config.js`, `index.css`, PostCSS |
| `postcss` | CSS processing pipeline used by Vite | `postcss.config.js` |
| `autoprefixer` | adds browser prefixes when needed to generated CSS | `postcss.config.js` |
| `oxlint` | fast static checker run by the current `npm run lint` script | client package script |
| `eslint` | JavaScript linting engine | config/dependency exists, although current script runs Oxlint instead |
| `eslint-plugin-react-hooks` | lint rules that catch invalid Hook use/dependencies | available to ESLint configuration; helps prevent Hook mistakes |
| `eslint-plugin-react-refresh` | lint support for Vite React Fast Refresh rules | available for Vite/React code quality |
| `globals` | standard browser/Node global definitions for lint configuration | used by lint configuration if needed |
| `@types/react` / `@types/react-dom` | type descriptions for React editor tooling/TypeScript | installed, but project source is currently JavaScript, not TypeScript |

### 38.3 Packages that are **not** installed in this client

Knowing absences prevents an incorrect interview answer.

| Concept/package | Current reality |
|---|---|
| Zustand | not installed and not used |
| TanStack Query / React Query | not installed and not used |
| RTK Query | not configured; Redux uses `createAsyncThunk` |
| React Hook Form | not installed; forms are controlled with `useState` |
| Zod/Yup | not installed; validation is handwritten in UI/server controllers |
| `vite-plugin-pwa` | not installed; customer site is not yet a PWA |
| Vitest / React Testing Library | not installed; automated frontend tests are not yet configured |
| `react-window` / `@tanstack/react-virtual` | not installed; large lists are not virtualized |
| `react-i18next` | not installed; customer UI is mainly hardcoded English |
| Figma API/plugin | not connected to this codebase; Figma is a design handoff source, not an installed runtime library |

When an interviewer asks about a package, use this answer structure:

> “This project uses `axios` as the shared REST client. `lib/axios.js` sets the API base URL and `withCredentials: true`, so Redux thunks and forms can call Express using the HTTP-only auth cookie. We use `socket.io-client` separately for server-pushed change events, not to replace normal REST reads/writes.”

---

## 39. State management: local state, Context, Redux Toolkit, Zustand, and React Query

These tools solve different problems. You do not choose one because it is fashionable; you choose based on where data lives, who needs it, and how it changes.

### 39.1 Five kinds of state

| Kind of state | Example | Best first home |
|---|---|---|
| Local UI state | open FAQ answer, typed input, selected gallery image | `useState` |
| Parent/shared UI state | product filter controlled by one page and children | lift state to parent, use props/callbacks |
| Small application setting | dark theme, selected language | Context |
| Cross-page client state | cart lines, global overlays, multi-step checkout state | Redux Toolkit or Zustand |
| Server state | products/orders/profile from API | TanStack Query, RTK Query, or carefully managed Redux thunk cache |

### 39.2 Redux Toolkit — used in Lumera

Redux Toolkit is the current client state solution. It is best understood as a predictable event/state system:

```text
Component button
  -> dispatch(action or thunk)
  -> reducer changes one slice of central store
  -> useSelector values update
  -> subscribed components render current UI
```

Example — cart:

```jsx
// ProductCard sends an event.
dispatch(addToCart({ product, quantity: 1 }));

// Cart/Navbar/Payment read the same source.
const lines = useSelector((state) => state.cart.cart);
```

`createSlice` groups feature state + reducers/actions. `createAsyncThunk` handles an API request and gives Redux three lifecycle actions:

```text
pending   -> set loading flag
fulfilled -> save API response
rejected  -> store/display friendly error
```

Lumera slices:

| Slice | Why Redux is sensible here |
|---|---|
| `auth` | Navbar, profile, login modal, wishlist/orders/checkout guards and Socket.IO all need identity |
| `cart` | card, header, sidebar, cart page and payment page need exactly the same bag |
| `product` | Home, catalogue, detail, review/AI search and socket invalidation share data/request state |
| `order` | checkout creates an order/Stripe intent and Orders displays its history |
| `wishlist` | card heart state and favourites route must agree |
| `popup` | Navbar/product buttons can open global overlays mounted in App |
| `storefront` | Home sections share CMS data and update together after real-time event |

### 39.3 Zustand — not used, but important to understand

Zustand is a small state-management library. It commonly feels simpler than Redux for lightweight shared client state because you create a hook/store directly and call it from components. It does not require action types, a Provider, or slices in the same way.

Illustrative cart store:

```ts
import { create } from "zustand";

type CartStore = {
  lines: CartLine[];
  add: (product: Product) => void;
};

export const useCartStore = create<CartStore>((set) => ({
  lines: [],
  add: (product) => set((state) => ({
    lines: [...state.lines, { product, quantity: 1 }],
  })),
}));

// Component usage
const add = useCartStore((state) => state.add);
```

| Redux Toolkit | Zustand |
|---|---|
| More explicit actions/reducers and established conventions | Minimal API, less boilerplate |
| Excellent devtools/middleware/large-team predictability | Excellent for small-to-medium shared client state |
| Current Lumera choice | Not installed in Lumera |
| `dispatch(action)` communicates a state event | components call selected store functions directly |

Neither is automatically better. For Lumera’s existing cross-page auth/cart/catalogue workflow, Redux Toolkit is a reasonable choice. For a small app with a cart/theme/sidebar and no need for Redux conventions, Zustand can be clearer. Use selectors in either tool so a component subscribes only to the state it needs.

### 39.4 TanStack Query / React Query — not used, but ideal for server cache

TanStack Query treats API data as a cache with a lifecycle: fetched, fresh, stale, refetching, failed, invalidated, garbage-collected. It is especially useful for product/order data, where the server is the source of truth.

```tsx
const query = useQuery({
  queryKey: ["products", filters],
  queryFn: () => getProducts(filters),
  staleTime: 30_000,
});
```

| Redux async thunks in Lumera | TanStack Query concept |
|---|---|
| manually set `loading`, `error`, data fields in slice | library exposes `isPending`, `isError`, `data` |
| `LiveUpdates` dispatches refetch thunks | socket event can call `invalidateQueries(["products"])` |
| cache behaviour must be designed manually | query keys, stale time, retry/cancel/cache are built in |
| works well for client workflows too | focuses specifically on remote/server state |

Do not put a modal-open boolean in React Query. Do not assume API data becomes trustworthy merely because it is cached. The server remains authoritative and writes should invalidate/update cache correctly.

### 39.5 Best interview comparison answer

> “In Lumera, local inputs and accordion state use `useState`; theme uses Context; cross-page cart/auth/catalogue state uses Redux Toolkit; remote product/order data is fetched through Redux thunks. Zustand is not installed, but I would consider it for lightweight shared client state. TanStack Query is not installed either; it would simplify server-state caching, retries, invalidation, and background refetches, especially when Socket.IO says catalogue data changed. I would avoid duplicating the same data in Redux and Query without a clear ownership rule.”

---

## 40. WebSocket and real-time updates — from beginner to project flow

### 40.1 REST versus WebSocket

| REST API | WebSocket / Socket.IO |
|---|---|
| browser asks, server responds once | browser and server keep a connection open |
| good for fetch/create/update/delete | good when server must notify browser of a later change |
| Lumera: product fetch, login, order creation, address CRUD | Lumera: stock/order/CMS change notification |

Socket.IO is a library that adds convenient events, reconnection, rooms, and a fallback transport around real-time browser/server connections. It is not simply a raw WebSocket API, although it can use WebSocket transport.

### 40.2 Lumera connection path

```text
client/src/lib/realtime.js
  -> creates one `realtimeSocket` with API-derived socket URL
  -> does not connect immediately (`autoConnect: false`)

client/src/components/LiveUpdates.jsx (mounted by App)
  -> attaches event listeners
  -> connects socket with credential cookie
  -> listens for change event
  -> dispatches normal REST/Redux refetch thunk

server/realtime/socket.js
  -> verifies same HTTP-only token cookie
  -> joins user:<id> and/or admins room
  -> controllers emit restricted/public event after successful database change
```

Example product change:

```text
Admin edits product
-> POST/PUT REST request is authenticated/authorized
-> Express controller writes PostgreSQL/Cloudinary
-> controller emits `catalogue:changed`
-> customer LiveUpdates hears event
-> dispatch(fetchProducts(currentFilters))
-> current screen renders fresh server data
```

This is called **event-driven invalidation/refetching**. It is safer than treating an event payload as the entire truth because the API request returns the latest permitted database state.

### 40.3 Socket terms to know

| Term | Simple meaning | Lumera example |
|---|---|---|
| connection/handshake | initial request that opens real-time channel | cookie auth in `socket.js` |
| event | named message | `catalogue:changed`, `order:changed` |
| listener | client/server function responding to an event | `realtimeSocket.on(...)` |
| emit | send named event/payload | `emitOrderChange(...)` |
| room | named private recipient group | `user:<id>` and `admins` |
| reconnect | client re-establishes connection after network interruption | Socket.IO client handles this; UI still refetches truth |
| cleanup | remove listener when component/effect changes/unmounts | `realtimeSocket.off(...)` in LiveUpdates |

### 40.4 Security/performance rules

1. Authenticate the socket handshake on server; a hidden client-side button is not access control.
2. Put private order/admin events in rooms, never broadcast them publicly.
3. Validate any browser-to-server socket event just as carefully as HTTP input.
4. Do not transmit huge lists/events; send a small change signal and refetch/cache-invalidate.
5. Clean listeners in `useEffect` to avoid duplicate reactions in Strict Mode or route changes.
6. Plan Redis/socket adapter and load-balancer behaviour before scaling to multiple server instances.
7. Show reconnect/offline feedback for operations that require current data.

---

## 41. Figma to React: understand a design and start implementation correctly

Figma is a design collaboration tool. It is not the final code and it should not be copied as a collection of absolute positions. The frontend developer turns a visual specification into reusable, responsive, accessible components.

This repository has **no Figma file/API connection**. The workflow below is how you should approach a Figma design handoff for Lumera or an interview task.

### 41.1 Before writing code: understand the requirement

Ask product/designer questions before opening a component file:

| Area | Questions to clarify |
|---|---|
| User goal | Who uses this screen? What task must they complete? What is success? |
| States | What appear during loading, no data, API error, offline, permission denied, success? |
| Data | Which API fields populate this design? What can be missing/long/untrusted? |
| Interaction | What happens on click, hover, keyboard, mobile touch, submit, cancellation? |
| Responsiveness | Are mobile/tablet/desktop designs supplied? What changes, not merely shrinks? |
| Accessibility | labels, focus order, contrast, error messages, motion, screen reader names? |
| Business rules | role permissions, stock, price, validation, currency, localization, analytics? |
| Acceptance | How will design/QA/product agree that it is done? |

Write a tiny requirement note before coding:

```text
Feature: saved-address selector in checkout
User: authenticated customer
Success: selects or adds an address before creating an order
Data: GET/POST /address, order shipping payload
States: loading, empty, selected, validation error, API error, save pending
Responsive: single column mobile; summary/address two columns desktop
Accessible: labelled radio controls, visible focus, error announced
```

### 41.2 Read a Figma screen in the right order

```text
1. Page/screen purpose
2. Layout regions (header, main, side panel, footer)
3. Repeating components (cards, inputs, buttons, table rows)
4. Design tokens (color, type, spacing, radius, shadow)
5. Component variants/states (default, hover, focus, disabled, error, loading)
6. Responsive behavior and content priority
7. Assets/icons/images
8. Prototype interactions and edge states
```

Do not start by measuring every pixel. First find the component hierarchy:

```text
CheckoutPage
├── CheckoutHeader
├── ShippingAddressForm
│   ├── TextField (repeated)
│   └── AddressSelector
├── OrderSummary
│   └── CartLine (repeated)
└── PaymentSection
```

Then map it to Lumera’s existing parts. `Payment.jsx`, `PaymentForm`, `AddressBook`, `ProductCard`, `ProductSlider`, `DashboardLayout`, `ProductForm`, and `StatCard` may already solve some of the visual/behavioral problem. Reuse or improve them before duplicating markup.

### 41.3 Translate Figma tokens to the existing Tailwind system

| Figma item | Code decision in Lumera |
|---|---|
| Color style “Surface/Card” | `bg-card`, token from `--card` |
| Text color “Primary” | `text-ink` |
| Brand action color | `bg-primary text-primary-foreground` |
| 8/12/16/24px spacing | Tailwind spacing scale: `gap-2`, `gap-3`, `gap-4`, `gap-6` |
| 12/16px rounded corner | `rounded-xl` / `rounded-2xl` after checking design scale |
| Desktop/mobile layout variants | mobile base classes plus `md:`/`lg:` variations |
| Button variants | reusable Button component/semantic variants, not copy/paste |
| Icon asset | `lucide-react` if design system has matching icon; otherwise approved SVG asset |

If the Figma design introduces a repeated new token, add it to `:root` and `tailwind.config.js` deliberately. Do not use `bg-[#123456]` in twenty components. If it is a one-off illustration color, an arbitrary value can be acceptable.

### 41.4 Build a Figma design step by step

1. **Create semantic structure first.** Use `main`, `section`, headings, buttons, labels, links, table/list structure.
2. **Build the smallest reusable components.** Start with button/input/card/badge/row, not a 500-line page.
3. **Use existing tokens and Tailwind mobile-first layout.** Start at 320px, then add `sm:`/`md:`/`lg:` behavior.
4. **Connect real or shaped mock data.** Define the product/order/form data shape and account for null/long values.
5. **Add real interaction.** `useState`, props/callbacks, Redux/API thunk, Router navigation, or socket invalidation only where needed.
6. **Implement loading/error/empty/disabled/focus states.** These are part of the design, not afterthoughts.
7. **Compare visually at several widths.** Check spacing/type/image crop; do not hardcode absolute positions just to match one screenshot.
8. **Test keyboard, screen reader labels, dark mode, long content, slow network.**
9. **Ask designer/QA to review the interactive implementation**, not only a static screenshot.

### 41.5 Helpful interview answer: “How do you turn Figma into React?”

> “I first clarify the user flow and data/edge states, then inspect Figma for layout regions, repeated components, tokens, variants, and responsive behavior. I map tokens to our Tailwind theme and reuse existing components before creating new ones. I build semantic, mobile-first React components, connect API and state intentionally, then validate loading/error/empty/focus/keyboard states and compare the result at multiple breakpoints. I do not treat Figma as a fixed desktop screenshot.”

---

## 42. PWA on Android and iPhone/iPad when the live app is deployed

### 42.1 What changes when a PWA goes live?

When a deployed site has a manifest, icons, HTTPS, and a registered service worker/caching strategy, a user may install it to the device home/app launcher. It runs in an app-like window and can open an already-cached app shell when offline. It is still a web application served from your domain; it is not automatically an Android APK or iOS App Store application.

Lumera is **not currently a PWA**. Before launch, add a manifest/service worker strategy (commonly through `vite-plugin-pwa`), icons, install/update UI, offline tests, and a safe cache policy. Section 28 gives the base implementation plan.

### 42.2 Android user experience

On Android Chromium browsers, an eligible deployed web app can usually be installed through browser UI such as an install prompt/menu. The exact browser wording and automatic prompt behavior can vary, so the app should provide a clear user-initiated “Install app” button only when the browser exposes the install event.

```text
Customer opens https://shop.example.com in Chrome on Android
-> browser reads manifest/icons/start URL and service-worker capability
-> customer chooses Install / Add to Home screen
-> Lumera icon appears in launcher/home screen
-> opening icon starts the configured web app URL in standalone-like experience
-> service worker can serve approved cached assets/content while offline
```

Do not force an install prompt immediately on page load. Explain value first (“Install Lumera for faster access and order updates”) and only show the option when supported.

### 42.3 iPhone/iPad user experience

On iPhone/iPad, installation is traditionally a user action through the browser Share menu → **Add to Home Screen**. A web manifest with `display: "standalone"`/`"fullscreen"` gives the installed web app an app-like launch experience; Apple also supports manifest icons, with `apple-touch-icon` taking precedence when supplied. Current WebKit notes that iOS/iPadOS behavior has evolved further: on iOS/iPadOS 26, adding a site to Home Screen opens it as a web app by default, while the user can choose a browser bookmark instead. Test on the minimum iOS/iPadOS versions your product supports rather than assuming every device behaves identically. [WebKit: Home Screen web apps](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/), [WebKit: Safari 26 web app changes](https://webkit.org/blog/17333/webkit-features-in-safari-26-0/)

```text
Customer opens live site in Safari/iOS browser
-> taps Share
-> chooses Add to Home Screen (or browser-equivalent option)
-> confirms name/icon and installed web app option
-> opens Lumera from Home Screen
-> app runs in its installed web-app context
```

Important iOS rules:

- You cannot reliably show the same native browser install prompt as Android; give simple visual instructions when needed.
- Use real manifest icons **and** consider `apple-touch-icon` for iOS-specific icon control.
- Test login/cookie, Stripe redirect/return, offline cache, update behavior, safe-area spacing, and deep links on real iPhone/iPad devices.
- Home Screen web apps can request Web Push permission only after a direct user action; do not ask on first load. WebKit supports standards-based push for Home Screen web apps and documents this user-gesture requirement. [WebKit: Web Push for iOS/iPadOS](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/)

### 42.4 Offline strategy for this ecommerce app

| Customer situation | What the live PWA should do |
|---|---|
| First visit online | fetch app shell/data normally; cache only safe resources |
| Repeat visit offline | show cached shell/previous public catalogue with clear stale/offline notice |
| Customer opens saved cart | restore local cart but label stock/price as requiring online verification |
| Customer opens checkout | require network; do not cache/replay payment actions |
| Customer submits payment/order | network-only; server/Stripe/webhook remains truth |
| Admin changes product | cached customer view updates on next successful network/socket refresh |
| New frontend deployment | show “New version available — refresh” rather than replacing a payment flow mid-task |

Never cache HTTP-only cookies, raw payment data, secret responses, or one user’s sensitive API response in a public/shared cache. A service worker is powerful; review every caching rule as a security decision.

### 42.5 Android/iOS PWA live-release checklist

1. Deploy all frontend/API assets over HTTPS, including service worker scope.
2. Build with production `VITE_API_URL`, `VITE_SOCKET_URL`, Stripe public key, and correct public domains.
3. Add/validate manifest: name, short name, `id`, start URL, standalone display, theme/background colors, 192/512 icons, maskable icon where applicable.
4. Add an iOS `apple-touch-icon` and test the actual Home Screen icon.
5. Configure Vite PWA/service-worker precache/runtime cache rules; make checkout/admin writes network-only.
6. Test offline reload after a successful online visit; test stale product notice and reconnect.
7. Test install from Android Chrome and Add to Home Screen on target iOS/iPadOS browsers/devices.
8. Test login cookies, logout, protected routes, Stripe success/cancel/return, deep links, update prompt, and socket reconnection inside installed app contexts.
9. Request notification permission only after customers choose an understandable order-update feature; store/revoke subscription safely server-side.
10. Track install/offline/error/update metrics without logging private customer/payment information.

### 42.6 Best interview answer: “How would you make this React app a PWA?”

> “I would first decide which user journeys are safe offline. For Lumera I would precache the app shell and cache public catalogue/images with expiration, but keep checkout, payment, admin writes, and sensitive account data network-only. I would use a Vite PWA plugin to generate a manifest/service worker, deploy over HTTPS, add Android install handling and iOS Add-to-Home-Screen guidance, test on real devices, and use a controlled update prompt. The server still validates cart stock, prices, authorization, and Stripe webhooks; offline capability never changes the source of truth.”
