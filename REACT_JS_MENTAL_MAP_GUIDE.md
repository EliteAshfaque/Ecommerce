# React.js Mental Map — Learn React in the Right Order

This guide is for a beginner-to-junior developer who wants to understand React before reading a large project.

Do not try to memorize every Hook or library first. Learn this mental map:

```text
JavaScript data
    -> React component calculates UI
    -> props pass data down
    -> event changes state
    -> React renders updated UI
    -> effects connect UI to outside world
    -> Router chooses page from URL
    -> API gives server data
    -> shared state tools coordinate distant components
```

In the Lumera project:

```text
ProductCard button click
  -> dispatch(addToCart)
  -> Redux cart state changes
  -> Navbar / CartSidebar / Cart / Payment rerender
  -> checkout API verifies stock and price on server
```

---

## 1. Start with the big picture

### React is a UI calculator

React does not ask you to manually find and edit HTML elements. You describe the screen for current data.

```jsx
function Greeting() {
  const name = "Aisha";
  return <h1>Hello, {name}</h1>;
}
```

React runs `Greeting`, sees the JSX, and displays an `h1` in the browser.

The core formula is:

```text
UI = f(props, state, context)
```

If props, state, or Context value changes, React calculates the UI again.

### The five questions to ask for every feature

When reading or building a React feature, ask:

1. What component owns this UI?
2. What data does it need?
3. Where should that data live: local state, parent, Context, Redux, or API cache?
4. What user event changes it?
5. What should loading, error, empty, success, mobile, and keyboard users see?

If you can answer these questions, you understand most React work.

---

## 2. Before React: JavaScript you need

React is JavaScript first. Be comfortable with these concepts.

### Variables and objects

```js
const product = {
  id: "p1",
  name: "Headphones",
  price: 299,
};

const priceWithVAT = product.price * 1.05;
```

Use `const` by default. Use `let` only when you will reassign the variable. Do not use `var` in modern React code.

### Destructuring

```js
const { name, price } = product;
const [firstProduct, secondProduct] = products;
```

React components use destructuring constantly:

```jsx
const ProductCard = ({ product, layout = "grid" }) => { /* ... */ };
```

### Spread syntax: copy instead of mutate

```js
const updatedUser = { ...user, name: "Sara" };
const nextProducts = [...products, newProduct];
const withoutDeleted = products.filter((item) => item.id !== deletedId);
```

React expects you to create a new object/array when normal React state changes. Do not do this:

```js
user.name = "Sara"; // bad when `user` is React state/prop
```

### Array methods

| Method | Purpose | React example |
|---|---|---|
| `.map()` | transform every item into another item | products -> `ProductCard` elements |
| `.filter()` | keep matching items | search/favourites/categories |
| `.find()` | get one matching item | cart line by product ID |
| `.reduce()` | combine items into one value | cart total/item count |
| `.some()` | does any item match? | is this product saved? |
| `.sort()` | reorder items | be careful: copy first with `[...items].sort()` |

```jsx
const total = cart.reduce(
  (sum, line) => sum + line.product.price * line.quantity,
  0
);
```

### Functions and arrow functions

```js
function formatPrice(amount) {
  return `AED ${amount}`;
}

const formatPrice = (amount) => `AED ${amount}`;
```

Both styles work. React projects commonly use arrow functions for components/handlers and normal functions for named utilities. Be consistent with the team style.

### Async JavaScript

```js
const loadProducts = async () => {
  try {
    const response = await axios.get("/product");
    return response.data;
  } catch (error) {
    throw error;
  }
};
```

`await` pauses only this async function until the Promise settles. It does not freeze the whole browser. Network calls can fail, so use `try/catch` or a library lifecycle (`pending` / `fulfilled` / `rejected`).

---

## 3. JSX: HTML-like JavaScript

JSX looks like HTML but is JavaScript syntax that Vite transforms for the browser.

```jsx
const title = "New arrivals";
const element = <h1>{title}</h1>;
```

### JSX rules

```jsx
// One parent element must be returned.
return (
  <section>
    <h1>Title</h1>
    <p>Description</p>
  </section>
);

// A Fragment groups elements without an extra DOM element.
return (
  <>
    <h1>Title</h1>
    <p>Description</p>
  </>
);
```

| HTML | JSX |
|---|---|
| `class` | `className` |
| `for` | `htmlFor` |
| `onclick` | `onClick` |
| `style="color: red"` | `style={{ color: "red" }}` |
| `<img>` | `<img />` (self-closing) |

Use `{}` to put JavaScript expressions into JSX:

```jsx
<p>{product.name}</p>
<p>{product.stock > 0 ? "In stock" : "Sold out"}</p>
```

Do not put statements directly inside JSX. This is invalid:

```jsx
// Bad
<p>{if (isLoggedIn) "Hello"}</p>
```

Calculate before return or use a ternary/logical expression:

```jsx
{isLoggedIn ? <Profile /> : <LoginButton />}
{cart.length > 0 && <CartSummary />}
```

---

## 4. Components: reusable UI building blocks

A component is usually a function that returns JSX.

```jsx
function Welcome() {
  return <h1>Welcome</h1>;
}
```

Use components like HTML elements:

```jsx
function HomePage() {
  return (
    <main>
      <Welcome />
      <ProductGrid />
      <Footer />
    </main>
  );
}
```

### Component hierarchy

```text
App
├── Navbar
├── CartSidebar
├── Routes
│   └── Products page
│       ├── ProductFilters
│       ├── ProductGrid
│       │   └── ProductCard x many
│       └── Pagination
└── Footer
```

### Good component boundaries

Create a component when it is:

- reused in more than one place;
- visually/logically separate;
- easier to test/read separately;
- a repeated list item, form field, modal, card, button, or layout section.

Avoid creating a component for one tiny element with no logic if it makes the page harder to follow.

### Presentational and container components

```text
Presentational component: receives props and renders UI.
  Example: Pagination, StatCard, ProductCard.

Container/page component: coordinates URL, state, API, and child components.
  Example: Lumera Products page, Payment page, App.
```

Real applications can mix these roles. The goal is not a strict rule; it is readable responsibility.

---

## 5. Props: data flows down

Props are read-only input from a parent component to a child.

```jsx
function ProductCard({ product, onAdd }) {
  return (
    <article>
      <h2>{product.name}</h2>
      <button onClick={() => onAdd(product)}>Add</button>
    </article>
  );
}

function ProductGrid({ products }) {
  const add = (product) => console.log("Add", product.id);
  return products.map((product) => (
    <ProductCard key={product.id} product={product} onAdd={add} />
  ));
}
```

```text
Parent owns data/action
   -> passes props down
Child renders data
   -> calls callback prop for user event
Parent decides what changes
```

Lumera examples:

| Parent | Child | Props/data flow |
|---|---|---|
| `Home` | `ProductSlider` | product arrays, title, subtitle |
| `ProductSlider` | `ProductCard` | one product |
| `Products` | `ProductFilters` | filters, `onChange`, `onClear`, categories |
| `Products` | `Pagination` | current/total page and page callback |
| `ProductDetail` | `ReviewsContainer` | route product ID |
| `Payment` | `PaymentForm` | server-calculated amount/Stripe context |

Never change a prop directly. Props belong to the parent.

---

## 6. State: data that can change

`useState` lets React remember a value between renders.

```jsx
import { useState } from "react";

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <button onClick={() => setCount((current) => current + 1)}>
      Count: {count}
    </button>
  );
}
```

### State update mental model

```text
User clicks button
-> event handler runs
-> setCount(...) asks React for next state
-> React renders Counter again
-> button displays new count
```

State setter functions are asynchronous from your code’s point of view. Do not expect this to show the new value immediately:

```js
setCount(count + 1);
console.log(count); // old render's value
```

When next state depends on old state, use functional update:

```js
setCount((current) => current + 1);
```

### Choose state ownership

```text
Only one component needs it?            useState in that component
Two sibling components need it?         lift state to closest parent
Many distant components need it?        Redux/Zustand/Context
It comes from an API/database?          server-state cache or managed fetch state
```

Lumera local state examples:

- `FAQ`: active accordion item.
- `ProductDetail`: chosen gallery image/quantity.
- `LoginModal`: typed login/register/reset fields.
- `Payment`: shipping fields, local validation errors, selected promotion.
- `HeroSlider`: visible campaign slide.
- `ProductCard`: current hover image.

### Do not duplicate derived state

```jsx
// Better: calculate total from the one source of truth.
const total = cart.reduce(/* ... */);

// Usually avoid: separate `total` state that must stay in sync with cart.
const [total, setTotal] = useState(0);
```

Use `useMemo` only when calculation is actually expensive or a stable derived value is needed for another optimization.

---

## 7. Events and forms

React event handlers use camelCase.

```jsx
<button onClick={handleAdd}>Add to bag</button>
<form onSubmit={handleSubmit}>...</form>
<input onChange={handleChange} />
```

### Controlled form

```jsx
function EmailForm() {
  const [email, setEmail] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    console.log(email);
  }

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="email">Email</label>
      <input
        id="email"
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />
      <button type="submit">Save</button>
    </form>
  );
}
```

The input value comes from React state. This makes validation, reset, prefilling, disabling, and error text predictable.

Lumera controlled forms: LoginModal, Contact, Newsletter, Payment, AddressBook, ProfilePanel, dashboard forms.

### Form checklist

- `<label>` is connected to every input.
- `event.preventDefault()` prevents browser page reload on submit.
- Validate simple user errors in UI.
- Validate again on server; browser validation is not security.
- Disable submit while saving.
- Show inline field error plus clear success/error feedback.
- Do not submit raw card data yourself; use Stripe Elements.

---

## 8. Lists, keys, conditional UI

### Lists and keys

```jsx
{products.map((product) => (
  <ProductCard key={product.id} product={product} />
))}
```

`key` identifies each item between renders. Use a stable database ID. Avoid array indexes for lists that can filter, reorder, insert, or delete.

### Conditional rendering

```jsx
if (loading) return <Spinner />;

return products.length === 0 ? (
  <EmptyState />
) : (
  <ProductGrid products={products} />
);
```

Important UI states:

```text
loading -> skeleton/spinner
error   -> useful message/retry
empty   -> explain why and next action
success -> data/action confirmation
```

Lumera Products page has all three catalogue paths: skeleton grid while loading, empty/filter-recovery state, and product grid/pagination after success.

---

## 9. Hooks mental map

Hooks let function components use React features. They must run at the top level, in the same order on every render.

```text
Need remembered local data?                  useState
Need external synchronization after render?  useEffect
Need cached expensive value?                 useMemo
Need stable function reference?              useCallback
Need DOM node/mutable value without render?  useRef
Need shared Context value?                   useContext
Need shared Redux state/action?              useSelector/useDispatch
Need URL information/navigation?             Router hooks
```

### `useState`

Already covered: local changing UI data.

### `useEffect`: synchronize with outside world

```jsx
useEffect(() => {
  const timer = setInterval(nextSlide, 6500);
  return () => clearInterval(timer);
}, [nextSlide]);
```

Use it for:

- API request on a specific lifecycle/dependency change;
- socket/event subscription;
- timer;
- browser storage;
- browser title/location/media query;
- third-party library/map/chart connection.

Do not use it for a value that can be calculated while rendering.

```jsx
// Bad: extra state/effect for a simple calculation.
const [fullName, setFullName] = useState("");
useEffect(() => setFullName(`${first} ${last}`), [first, last]);

// Good
const fullName = `${first} ${last}`;
```

Effects need cleanup:

```jsx
useEffect(() => {
  socket.on("catalogue:changed", refresh);
  return () => socket.off("catalogue:changed", refresh);
}, [refresh]);
```

Lumera uses this pattern in `LiveUpdates`, `HeroSlider`, `ProductSlider`, and Maps/location code.

### `useMemo`: cache a value

```jsx
const filtered = useMemo(
  () => products.filter((product) => product.category === category),
  [products, category]
);
```

Use it for expensive filtering/calculation or stable object/value needed by a memoized child. It does not automatically make every component fast.

### `useCallback`: cache a function reference

```jsx
const handleDelete = useCallback((id) => {
  dispatch(deleteProduct(id));
}, [dispatch]);
```

Use it when an effect depends on the function or a memoized child needs stable props. Do not add it everywhere without profiling/reason.

### `useRef`: remember without render

```jsx
const inputRef = useRef(null);
inputRef.current?.focus();
```

Use it for DOM nodes, timer IDs, current socket/filter values, Map instances, or previous values. Changing `ref.current` does not rerender.

### Custom Hooks

A custom Hook extracts reusable behavior:

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

Lumera’s `useTheme()` is a custom Hook that makes Theme Context easy/safe for components to read.

### Advanced React APIs: know what they are

Lumera uses the core Hooks above. The following React APIs are not currently used in the project, but are useful to know for interviews. Do not force them into an application just because they exist.

| API | Simple purpose | When to use it | Lumera status |
|---|---|---|---|
| `useReducer` | manages related/complex local state with a reducer function | complex form, wizard, or local state machine with many related transitions | not used; Redux reducers already manage global workflows |
| `useId` | creates stable IDs for accessibility relationships | `label` + input/error `aria-describedby` IDs | not used; useful for reusable form fields |
| `useLayoutEffect` | runs after DOM update but before browser paint | measure/position DOM where a visible flicker must be avoided | not used; prefer normal `useEffect` unless layout measurement truly needs it |
| `useImperativeHandle` | limits which imperative methods a parent gets through a ref | reusable input/modal exposing `focus()`/`open()` rather than all DOM details | not used; advanced component-library case |
| `useTransition` | marks a non-urgent update so typing/clicking stays responsive | expensive tab/list/chart update that should not block an input | not used; it does not replace API loading state |
| `useDeferredValue` | lets an expensive consumer lag slightly behind an urgent value | search text stays instant while a heavy results view catches up | not used; often paired with large client-side filtering |
| `useOptimistic` | temporarily shows a successful-looking update before server confirms it | like button, comment, small reversible save | not used; must handle failure/rollback |
| `useActionState` | manages state/pending result around an Action/form action | modern form/action workflows | not used; Lumera uses controlled forms and thunks |
| `use` | reads a Promise/Context in a Suspense-enabled architecture | framework/server-component or Suspense data patterns | not used in this Vite client SPA |
| `useSyncExternalStore` | safely subscribes to an external non-React store | library authors integrating browser/external store subscriptions | not needed in normal app components; React Redux handles its own integration |
| `useInsertionEffect` | injects styles before layout effects | CSS-in-JS library authors | not for normal application code |

Example `useReducer` for a local multi-step form:

```jsx
function reducer(state, action) {
  switch (action.type) {
    case "fieldChanged":
      return { ...state, [action.name]: action.value };
    case "reset":
      return initialState;
    default:
      throw new Error("Unknown action");
  }
}

const [form, dispatch] = useReducer(reducer, initialState);
```

Think of `useReducer` as local state with named events. Think of Redux Toolkit as the same reducer idea expanded for shared application state, middleware, devtools, and async workflows.

### Other important React building blocks

| API/concept | Meaning | Lumera example |
|---|---|---|
| `children` prop | JSX placed between a component's opening/closing tags | `ThemeProvider` receives and renders all application children |
| Fragment (`<>...</>`) | groups JSX without an extra DOM element | list/layout grouping |
| `StrictMode` | development-only checks that expose impure renders/missing effect cleanup | wraps both customer and dashboard apps in `main.jsx` |
| `memo` | may skip a pure component render when its props are unchanged | not used yet; profile expensive ProductCard/row before adding |
| `lazy` + `Suspense` | load component code only when first rendered and show fallback while waiting | not used yet; candidate for Payment/Orders/AI routes |
| Error Boundary | catches descendant render errors and shows fallback UI | not implemented; recommended around major route areas |
| Portal (`createPortal`) | renders DOM in a different DOM location while remaining in same React tree | `ProfilePanel` renders its drawer above normal page stacking |

React’s official reference lists additional APIs and version-specific details. For interview preparation, learn the **problem each API solves** rather than trying to use every rare Hook. [React built-in APIs](https://react.dev/reference/react/apis), [React built-in components](https://react.dev/reference/react/components)

---

## 10. Context: small shared app settings

Context lets a parent make a value available to all descendants without manually passing props through every layer.

```jsx
const ThemeContext = createContext();

function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("light");
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

function ThemeButton() {
  const { theme, setTheme } = useContext(ThemeContext);
  return <button onClick={() => setTheme("dark")}>{theme}</button>;
}
```

Use Context for theme, locale, simple configuration, or stable shared services. Avoid using one huge Context for rapidly changing app data because every consumer can rerender when its value object changes.

Lumera `ThemeProvider` wraps App in `main.jsx`; Navbar reads `useTheme()` and toggles the `<html>` `.dark` class.

---

## 11. Routing: URL chooses the page

React Router maps an URL to a page component.

```jsx
<BrowserRouter>
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/products" element={<Products />} />
    <Route path="/product/:id" element={<ProductDetail />} />
    <Route path="*" element={<NotFound />} />
  </Routes>
</BrowserRouter>
```

| Need | Router tool |
|---|---|
| link without full reload | `<Link to="/products">` |
| go after success | `useNavigate()` |
| read `/product/:id` | `useParams()` |
| read/write `?search=...&page=2` | `useSearchParams()` |
| render nested child route | `<Outlet />` |
| redirect | `<Navigate to="/login" replace />` |

Lumera customer routing: `client/src/App.jsx`.

Lumera dashboard routing: nested `AdminRoute -> DashboardLayout -> Outlet`. The UI redirect improves experience; Express server role middleware is the real protection.

---

## 12. Data fetching and REST APIs

### REST flow

```text
React page/component
-> Axios request
-> Express route
-> middleware checks cookie/role
-> controller validates/business rules
-> PostgreSQL/Stripe/other provider
-> JSON response
-> Redux/query/local state updates UI
```

Axios setup in Lumera:

```js
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});
```

`withCredentials: true` allows approved browser requests to include HTTP-only authentication cookies.

### Async state pattern

```text
idle -> loading -> success
               -> error
```

Always design all paths.

```jsx
if (loading) return <ProductSkeleton />;
if (error) return <ErrorState onRetry={retry} />;
if (!products.length) return <EmptyState />;
return <ProductGrid products={products} />;
```

### Request safety

- Server validates all important inputs.
- Client never decides authoritative price/stock/role/payment status.
- Handle cancellation/race conditions for rapid search/filter changes.
- Debounce search where API calls happen per typed value.
- Do not show raw server stack traces/secrets to users.

---

## 13. Global state: Redux Toolkit, Zustand, React Query

### Redux Toolkit

Use when distant components need shared client state and explicit updates.

```text
Store
├── auth
├── cart
├── product
├── order
├── wishlist
├── popup
└── storefront
```

```jsx
const cart = useSelector((state) => state.cart.cart);
dispatch(addToCart({ product, quantity: 1 }));
```

Terms:

| Term | Meaning |
|---|---|
| store | complete Redux state |
| slice | one feature: state + reducers/actions |
| action | event description, e.g. `cart/addToCart` |
| reducer | state update rule |
| dispatch | send action/thunk |
| selector | reads a store value |
| thunk | async action that calls API |

### Zustand

Zustand is a smaller shared-state alternative. It is not used in Lumera.

```jsx
const useCartStore = create((set) => ({
  lines: [],
  add: (product) => set((state) => ({
    lines: [...state.lines, { product, quantity: 1 }],
  })),
}));
```

Use it when lightweight shared client state needs less Redux ceremony. Choose one state ownership approach; do not duplicate the same cart in Redux and Zustand.

### TanStack Query / React Query

TanStack Query is for **server state**: API data that needs caching, stale time, retries, invalidation, background refetch, and mutations. It is not installed in Lumera; Redux thunks currently fetch server data.

```jsx
const { data, isPending, isError } = useQuery({
  queryKey: ["products", filters],
  queryFn: () => getProducts(filters),
});
```

Use local state for typed input, Context for theme, Redux/Zustand for cross-page client workflow, and Query/RTK Query for remote cacheable API data.

---

## 14. Authentication and authorization

```text
Register/login form
-> POST /auth/login
-> server checks bcrypt password
-> server signs JWT
-> HTTP-only cookie stored by browser
-> GET /auth/me restores user after refresh
-> protected API route verifies cookie and role
```

| Word | Meaning |
|---|---|
| authentication | “Who are you?” |
| authorization | “Are you allowed to do this?” |
| JWT | signed identity token |
| HTTP-only cookie | browser sends cookie to server; JavaScript cannot read it |
| CORS | browser policy allowing configured site origins to call API |

In Lumera, `AdminRoute` hides dashboard UI from guests/users, but Express `isAuthenticated` + `authorizeRoles("Admin")` is the security boundary.

---

## 15. WebSockets and real-time UI

REST is request/response. A WebSocket/Socket.IO connection lets the server notify an open browser later.

```text
Admin changes product
-> server saves database
-> server emits catalogue:changed
-> customer LiveUpdates receives event
-> app refetches products
-> visible UI rerenders current data
```

Lumera uses Socket.IO rooms:

```text
anonymous visitor -> public catalogue/CMS events
user:<id>         -> only that customer's order events
admins            -> operations/dashboard events
```

Important: use sockets as a change notification/cache invalidation signal. Fetch fresh permission-checked data from REST rather than trusting a giant event payload.

---

## 16. Styling: CSS, Tailwind, responsive UI

### CSS layout choice

```text
Need one direction (row or column)? -> Flexbox
Need rows and columns?              -> CSS Grid
Need overlay on image/modal?        -> relative + absolute/fixed
Need page width/spacing?            -> max-width + margin auto + padding
```

Tailwind examples:

```jsx
// Mobile-first card grid: 2 columns default, 3 columns at md.
<div className="grid grid-cols-2 gap-4 md:grid-cols-3" />

// Row on desktop, column on mobile.
<div className="flex flex-col gap-4 md:flex-row md:items-center" />

// Centered readable page content.
<main className="mx-auto max-w-7xl px-4 md:px-8" />
```

Tailwind mental map:

| Group | Examples |
|---|---|
| layout | `flex`, `grid`, `block`, `hidden`, `relative`, `fixed` |
| sizing | `w-full`, `max-w-7xl`, `h-10`, `min-h-screen` |
| spacing | `p-4`, `px-6`, `mt-4`, `gap-3` |
| type | `text-sm`, `font-semibold`, `leading-relaxed` |
| color | `bg-primary`, `text-ink`, `border-border` |
| responsive | `sm:`, `md:`, `lg:`, `xl:` |
| interaction | `hover:`, `focus-visible:`, `disabled:` |
| motion | `transition`, `duration-300`, `animate-fade-up` |

Lumera design uses semantic tokens: `bg-fog`, `text-ink`, `bg-card`, `bg-primary`. The actual colors live in CSS variables/Tailwind config, supporting dark mode and consistent design.

---

## 17. Performance: make the right thing fast

Performance mental map:

```text
Slow page?
-> measure first
-> find whether network, image, bundle, API, DOM size, or rerender is slow
-> apply focused change
-> measure again
```

| Problem | Tool/solution |
|---|---|
| expensive calculation | `useMemo` after profiling |
| expensive pure child rerenders | `React.memo` + stable props where justified |
| function prop/effect dependency | `useCallback` when needed |
| 10,000 rendered rows | API pagination + virtualization |
| large initial JS bundle | route lazy loading/code splitting |
| heavy image delays LCP | correct Cloudinary size/format, fixed aspect ratio, lazy load below fold |
| every search character calls API | debounce/cancel/cache |
| stale server data | Query/RTK Query invalidation or socket-triggered refetch |

Core Web Vitals:

| Metric | Simple meaning |
|---|---|
| LCP | when main visible content finishes loading |
| INP | how quickly interaction visibly responds |
| CLS | how much page jumps unexpectedly |
| p95 | the slow end of real user experiences, not average only |

Do not say “I used `useMemo` everywhere.” Say “I profile, then memoize a measured expensive calculation or row.”

---

## 18. Code splitting, Suspense, error boundaries

### Lazy route

```jsx
import { lazy, Suspense } from "react";

const Payment = lazy(() => import("./pages/Payment"));

<Suspense fallback={<PageLoader />}>
  <Route path="/payment" element={<Payment />} />
</Suspense>
```

This delays downloading a non-critical page until user needs it. Lumera currently statically imports pages; lazy routes are a future optimization.

### Error boundary

An Error Boundary catches rendering errors in descendants and shows fallback UI. It does not replace normal API `try/catch` errors. Add one around major route/layout areas in production applications.

---

## 19. Testing mental map

```text
Pure helper/reducer?      unit test
Component behavior?       React Testing Library
API data flow?            integration test + MSW
Critical browser journey? end-to-end test
```

Test what user sees/does:

```jsx
await user.click(screen.getByRole("button", { name: /add to bag/i }));
expect(screen.getByText(/1 item/i)).toBeInTheDocument();
```

Lumera does not yet have Vitest/React Testing Library configured. Good first tests: cart reducer, product filters URL, admin route, Payment validation, Stripe webhook, socket listener cleanup.

---

## 20. TypeScript mental map

TypeScript catches incorrect assumptions while coding.

```ts
type Product = {
  id: string;
  name: string;
  price: number;
  stock: number;
};

function addPrice(product: Product, quantity: number): number {
  return product.price * quantity;
}
```

Use types for component props, API responses, Redux state, form data, statuses, and utility functions.

```ts
type OrderStatus = "Processing" | "Shipped" | "Delivered" | "Cancelled";
```

Lumera source is currently JavaScript/JSX. An incremental migration should start with core `Product`, `User`, `CartLine`, `Order`, API response, and component prop types.

---

## 21. PWA, i18n, accessibility

### PWA

```text
manifest -> name/icon/display/start URL
service worker -> cache/offline rules
HTTPS -> required for powerful web app features
```

For an ecommerce app, cache app shell/public content carefully. Keep checkout/payment/admin writes network-only. Server still verifies stock, auth, Stripe webhooks, and prices.

### i18n

Never hardcode all text if app must support many languages. Use translation keys and `Intl` for date/number/currency. Plan for long translation strings and RTL layout.

### Accessibility

```text
Semantic HTML
-> labels/buttons/links/headings
-> keyboard focus and visible focus styles
-> sufficient contrast
-> useful error/loading text
-> responsive/touch support
-> reduced motion
```

Tailwind styles accessibility; it does not create it automatically.

---

## 22. Vite and project startup

Vite has two jobs:

```text
npm run dev   -> fast local server + Hot Module Replacement
npm run build -> optimized static files in dist/
```

```text
index.html
-> src/main.jsx
-> Provider + ThemeProvider + App
-> Router selects page
-> Vite serves source in development or dist assets in production
```

Only variables prefixed `VITE_` can reach React browser code. They are public build-time configuration, never secret keys.

---

## 23. How to read the Lumera client after this guide

Read files in this order:

```text
1. client/package.json          What commands/libraries exist?
2. client/src/main.jsx          How React starts; Providers/global CSS
3. client/src/App.jsx           Routes/shared shell/initial fetches
4. client/src/store/store.js    Global state map
5. one slice, e.g. cartSlice    Actions and state change
6. ProductCard.jsx              Reusable UI + Redux event
7. Products.jsx                 URL/filter/API/grid composition
8. lib/axios.js                 API configuration
9. LiveUpdates.jsx              Socket-to-refetch flow
10. Payment.jsx                 full form/API/Stripe workflow
```

Then trace one feature end to end:

```text
Add product
ProductCard handleAdd
-> cartSlice addToCart
-> Redux store changes
-> Navbar cart count / CartSidebar / Cart / Payment useSelector rerender
-> Payment placeNewOrder thunk
-> Express validates and creates Stripe intent
-> PaymentForm confirms payment
-> Stripe webhook marks database record paid
-> Socket event refetches order data
```

---

## 24. React interview quick answers

### Props vs state

Props are read-only values passed from parent to child. State is data a component owns and changes over time. Lumera passes products as props to `ProductCard`; cart is shared Redux state because many distant components need it.

### Why `useEffect`?

To synchronize React with external systems. Lumera uses it for initial fetches, timers, sockets, local storage, and Maps. Effects must have correct dependencies and cleanup.

### Why Redux?

For cross-page shared cart/auth/catalogue/order state with predictable actions/reducers. Context handles the smaller theme concern. TanStack Query/RTK Query could improve remote-data caching later.

### How do you make React fast?

Measure first; optimize images/API/bundle/DOM/rerenders based on evidence. Use pagination, virtualization, lazy routes, memoization only when justified, and Core Web Vitals p75/p95 monitoring.

### How do you secure a React app?

React UI guards are not security. Server verifies authentication, role, validation, price/stock, payment webhook signature, and permission on every protected API operation.

---

## 25. Final learning checklist

Before saying “I know React,” make sure you can explain and build:

- [ ] JSX and components
- [ ] Props and callback props
- [ ] `useState`, immutable updates, controlled forms
- [ ] lists, keys, conditional loading/error/empty UI
- [ ] `useEffect` dependencies and cleanup
- [ ] `useMemo`, `useCallback`, `useRef`, custom Hooks
- [ ] Context and when not to use it
- [ ] React Router pages/parameters/protected route UI
- [ ] Axios REST API request lifecycle
- [ ] Redux Toolkit: store, slice, action, reducer, selector, thunk
- [ ] Zustand and TanStack Query differences
- [ ] HTTP-only cookie auth, server authorization, CORS basics
- [ ] Socket.IO/WebSocket invalidation flow
- [ ] Tailwind flex/grid/responsive/dark/focus design
- [ ] TypeScript types and runtime validation distinction
- [ ] testing, accessibility, performance, PWA, i18n basics
- [ ] Vite dev/build/environment variables

The best way to learn is not to read this guide once. Pick one checklist item, find its Lumera example, change something small, test it in the browser, explain the data flow aloud, and repeat.
