# PWA Guide — LUMERA Client (Android + iOS + Interview Prep)

Complete reference for **Progressive Web Apps** in this project: what they are, how they work, what we configured, and what interviewers often ask.

---

## 1. What is a PWA?

A **Progressive Web App** is still your **website** (React + Vite), but with extra browser features so it can feel like a native app:

| Feature | What the user sees |
|---------|-------------------|
| **Installable** | “Add to Home Screen” / “Install app” |
| **Standalone** | Opens without browser URL bar (app-like window) |
| **Offline / fast** | Cached shell loads even on weak network |
| **Secure** | Must run on **HTTPS** (localhost is OK for dev) |

You do **not** rewrite the app in Kotlin/Swift. Same React code — extra **manifest** + **service worker**.

---

## 2. The 3 building blocks (remember this)

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│ Web App Manifest │     │ Service Worker    │     │ HTTPS           │
│ (JSON metadata)  │     │ (background JS)   │     │ (secure origin) │
└────────┬────────┘     └────────┬─────────┘     └────────┬────────┘
         │                         │                        │
         ▼                         ▼                        ▼
   App name, icons,          Cache files,            Required in
   theme color,              intercept network,      production
   start URL                 offline fallback
```

### Web App Manifest

- File: `manifest.webmanifest` (generated at build by `vite-plugin-pwa`)
- Tells the OS: name, icons, colors, `display: standalone`, `start_url`
- **Android Chrome** uses this heavily for “Install app”
- **iOS Safari** uses it **partially** + extra Apple meta tags (see below)

### Service Worker (SW)

- A **separate JavaScript file** that runs in the background (not in your React tree)
- Can **cache** JS, CSS, HTML, images
- Can **intercept** fetch requests (network vs cache strategies)
- Registered once from `main.jsx` via `registerSW()` from `virtual:pwa-register`

### HTTPS

- Service workers **only work** on `https://` or `http://localhost`
- Deploy client on HTTPS (Vercel, Netlify, etc.)

---

## 3. How it works (flow)

```
User visits https://yoursite.com
        │
        ▼
Browser downloads index.html + JS bundle
        │
        ▼
main.jsx calls registerSW() → installs service worker
        │
        ▼
SW caches static assets (Workbox rules in vite.config.js)
        │
        ▼
Browser reads manifest → may show "Install" / "Add to Home Screen"
        │
        ▼
User installs → icon on home screen → opens in standalone window
        │
        ▼
Next visit / offline → SW serves cached shell; API may still need network
```

**For LUMERA:** products, login, Stripe, orders still hit `http://localhost:4000` API. PWA mainly caches the **frontend**. Checkout is **not** fully offline unless you add advanced caching (usually you should not cache payment APIs).

---

## 4. What we configured in this repo

### Dependency

| Package | Type | Why |
|---------|------|-----|
| **`vite-plugin-pwa`** | devDependency | Vite integration: manifest + service worker + Workbox |

Under the hood it uses **Workbox** (Google’s SW toolkit). You don’t install Workbox separately when using this plugin.

### Files touched

| File | Purpose |
|------|---------|
| `client/vite.config.js` | `VitePWA({ manifest, workbox, ... })` |
| `client/src/main.jsx` | `registerSW({ immediate: true })` |
| `client/index.html` | `theme-color`, Apple meta tags, `apple-touch-icon` |
| `client/public/pwa-192.png` | Android / manifest icon |
| `client/public/pwa-512.png` | Android splash / install icon |
| `client/public/apple-touch-icon.png` | iOS home screen icon (180×180) |

### Build output

After `npm run build`, you get:

- `dist/manifest.webmanifest`
- `dist/sw.js` (or similar) — service worker
- Precache list of hashed JS/CSS/HTML

Test install locally:

```bash
cd client
npm run build
npm run preview
```

Open the preview URL in Chrome. The store UI stays **clean** — no visible PWA button by default.

**Option A — Chrome DevTools (recommended, zero UI on the site)**  
DevTools → **Application** → Manifest / Service Workers.

**Option B — Hidden dev panel (localhost only)**  
Add to the URL: `?pwa-test=1`  
Example: `http://localhost:4173/?pwa-test=1`  
Or press **Cmd+Shift+P** (Mac) / **Ctrl+Shift+P** (Windows) on localhost.

---

## 5. Android vs iOS — important differences

| Topic | Android (Chrome) | iOS (Safari) |
|-------|------------------|--------------|
| Install prompt | “Install app” banner / menu | **Share → Add to Home Screen** (no automatic banner like Android) |
| Manifest support | Strong | Partial (improving over time) |
| Service worker | Full | Supported (with limits) |
| Standalone mode | `display: standalone` | `apple-mobile-web-app-capable` meta |
| Icon | `pwa-192`, `pwa-512` in manifest | **`apple-touch-icon.png`** (critical) |
| Push notifications | Possible (with setup) | Limited / different rules |
| Background sync | More flexible | More restricted |

**Interview line:** *“PWAs work on both platforms, but iOS install UX is manual (Add to Home Screen) and Apple relies more on meta tags + touch icon; Android Chrome uses the manifest install flow more directly.”*

---

## 6. Icons you need (checklist)

| Asset | Size | Used for |
|-------|------|----------|
| `favicon.svg` | any | Browser tab |
| `pwa-192.png` | 192×192 | Manifest, Android |
| `pwa-512.png` | 512×512 | Manifest, splash |
| `apple-touch-icon.png` | 180×180 | iOS home screen |

Replace generated placeholders with real brand artwork before production.

---

## 7. Caching strategies (Workbox) — remember for interviews

| Strategy | Behavior | Good for |
|----------|----------|----------|
| **CacheFirst** | Cache → if miss, network | Fonts, static images |
| **NetworkFirst** | Network → if fail, cache | API data that must be fresh |
| **StaleWhileRevalidate** | Return cache, update in background | Product images |
| **NetworkOnly** | Always network | Payments, auth |
| **CacheOnly** | Only cache | Rare |

**Our config:** static bundle = precache; Google Fonts = CacheFirst; Unsplash images = StaleWhileRevalidate. **API (`localhost:4000`) is not cached** by default — correct for ecommerce.

---

## 8. What PWA does NOT do (don’t over-promise)

- Does **not** put you in Google Play / App Store by itself  
- Does **not** make full checkout work offline (unless you design it)  
- Does **not** replace native features (Bluetooth, some sensors)  
- Does **not** bypass **cookie/auth** rules — login still needs server  

Optional later: **TWA** (Trusted Web Activity) wraps PWA for Play Store; **Capacitor** wraps for fuller native APIs.

---

## 9. Commands cheat sheet

```bash
cd client
npm install -D vite-plugin-pwa    # already done
npm run dev                        # normal dev (SW off by default)
npm run build                      # generates SW + manifest
npm run preview                    # test PWA on localhost
```

**Chrome DevTools:** Application → Manifest, Service Workers, Storage  
**Lighthouse:** Run PWA audit on production build  

---

## 10. Things to remember (exam / interview memory list)

1. **PWA = Manifest + Service Worker + HTTPS**  
2. **Service worker** = separate thread, event-driven (`install`, `activate`, `fetch`)  
3. **Precache** = assets at build time; **runtime cache** = rules per URL pattern  
4. **`registerType: 'autoUpdate'`** = new SW activates on revisit after deploy  
5. **`display: standalone`** = hide browser UI  
6. **iOS** needs `apple-touch-icon` + `apple-mobile-web-app-*` meta  
7. **Scope** + **start_url** define what URLs the PWA controls  
8. **Same origin** — SW only controls its scope on one origin  
9. **Don’t cache** auth/payment responses blindly (security)  
10. **LUMERA** cart in `localStorage` can survive refresh; orders still need API  

---

## 11. Interview questions & sample answers

### Basic

**Q: What is a PWA?**  
A: A web app that uses a manifest and service worker to be installable, work offline for cached assets, and feel app-like while staying a website.

**Q: What are the three core requirements?**  
A: Web app manifest, service worker, served over HTTPS.

**Q: What is a service worker?**  
A: A background script the browser runs separately from the page. It can cache resources and intercept network requests.

**Q: Manifest vs service worker?**  
A: Manifest is static metadata (name, icons, display mode). Service worker is runtime logic (caching, offline).

### Intermediate

**Q: How does offline work?**  
A: On install/activate, the SW precaches assets. On `fetch`, it can respond from cache. For SPAs, `navigateFallback` serves `index.html` for client routes.

**Q: CacheFirst vs NetworkFirst?**  
A: CacheFirst prefers speed (fonts). NetworkFirst prefers freshness (API). Ecommerce APIs usually NetworkFirst or NetworkOnly.

**Q: How do you update a PWA after deploy?**  
A: New build → new SW file → browser detects change → `skipWaiting` / `autoUpdate` → user gets new version on next visit (or prompt with `promptForUpdate`).

**Q: Can PWAs receive push notifications?**  
A: Yes on Android/desktop with Push API + permissions. iOS added limited web push in recent versions; behavior differs from native.

### Advanced / scenario

**Q: Why not cache `/api/v1/product` with CacheFirst?**  
A: Stale prices/stock mislead customers. Use network-first or no cache; optionally short TTL for read-only data.

**Q: How is PWA different from React Native / Flutter?**  
A: PWA is web tech in a browser shell; RN/Flutter compile to native UI. PWA = faster to ship, one codebase with web; native = deeper OS integration.

**Q: Cookie-based auth with PWA?**  
A: Works like normal web if `withCredentials` and CORS are correct. SW doesn’t replace session; offline user may see UI but API calls fail until online.

**Q: iOS PWA limitations?**  
A: Install via Share menu, storage limits, some APIs restricted, historically weaker push — always mention testing on real devices.

**Q: What is Workbox?**  
A: Library from Google that generates service worker strategies (precaching, routing). `vite-plugin-pwa` uses it under the hood.

**Q: What is `scope` in manifest?**  
A: URL path range the PWA controls. Usually `/` for entire site.

**Q: Lighthouse PWA checklist — what do they check?**  
A: Manifest valid, SW registered, HTTPS, responsive, fast enough, icons, `theme-color`, etc.

---

## 12. Project-specific notes (LUMERA)

| Area | PWA impact |
|------|------------|
| Redux auth (`/auth/me`) | Needs network; show offline message if needed |
| Cart (`localStorage`) | Can work offline for viewing bag |
| Stripe payment | **Must** be online |
| Socket.io live updates | Offline = disconnected (expected) |
| i18n | Works offline once JS is cached |
| Dashboard (`dashboard/` app) | Separate app — needs its own PWA setup if desired |

---

## 13. Optional next steps (you can add later)

- [ ] “Update available” toast when new SW is ready (`onNeedRefresh` in `registerSW`)
- [ ] Offline page component when `navigator.onLine === false`
- [ ] Replace placeholder PNG icons with designed assets
- [ ] Enable `devOptions.enabled: true` only when debugging SW
- [ ] Add PWA to `dashboard/` project separately
- [ ] Production deploy on HTTPS and run Lighthouse PWA audit

---

## 14. Quick diagram — install paths

```
ANDROID (Chrome)                    iOS (Safari)
─────────────────                   ───────────────
Visit site                          Visit site
    │                                   │
    ▼                                   ▼
Manifest valid                      apple-touch-icon + meta tags
    │                                   │
    ▼                                   ▼
"Install app" / menu                Share → Add to Home Screen
    │                                   │
    ▼                                   ▼
Icon on launcher                    Icon on home screen
    │                                   │
    └─────────── Both open standalone window ───────────┘
```

---

## 15. File reference in this repo

```
client/
  vite.config.js          ← VitePWA plugin config
  index.html              ← theme-color, Apple meta
  src/main.jsx            ← registerSW()
  public/
    pwa-192.png
    pwa-512.png
    apple-touch-icon.png
  dist/                   ← after build: manifest + sw.js
```

**No Redux slice for PWA** — the browser manages the service worker lifecycle.

---

## 16. Service Worker — deep dive (every term explained)

> **Definition:** A Service Worker is a JavaScript file that runs in the background of a web browser, separately from your web page. It is mainly used to make web applications work more like mobile/desktop apps.

### 16.1 Breaking the definition down

| Phrase | What it really means |
|--------|---------------------|
| **"JavaScript file"** | A normal `.js` file (in our project Workbox generates `dist/sw.js`). It is **not** a React component and is not imported into your app — the browser downloads it separately. |
| **"runs in the background"** | The browser can start it even when **no tab of your site is open** (for example, when a push message arrives). It is stopped again when idle to save battery. |
| **"separately from your web page"** | It runs on its **own thread** (a worker thread), not the main thread that renders React. So it cannot freeze your UI — but it also **cannot touch the DOM** (`document`, `window` are not available). |
| **"more like mobile/desktop apps"** | Native apps work offline, load instantly, and show notifications. The service worker gives websites those same powers: **offline caching, instant loading, push notifications, background sync**. |

### 16.2 Mental model: the service worker is a proxy

```
WITHOUT service worker                WITH service worker

 Page ──── request ────► Network       Page ── request ──► Service Worker ──► Network
                                                               │
                                                               └──► Cache Storage
                                                                   (decides which one)
```

A **proxy** is a middle-man. Every request your page makes (HTML, JS, images, API calls) passes through the service worker first. The service worker decides: *answer from cache, go to the network, or both?*

### 16.3 Key terms

| Term | Explanation |
|------|-------------|
| **Worker thread** | A background thread separate from the main (UI) thread. Web Workers and Service Workers both use one. Heavy work here doesn't make the page lag. |
| **Main thread** | The thread where React renders, the DOM updates, and click handlers run. |
| **Registration** | Telling the browser "this site has a service worker, here is the file": `navigator.serviceWorker.register('/sw.js')`. In our app, `registerSW()` in `client/src/main.jsx` does this for us. |
| **Scope** | The set of URLs the service worker controls. A worker at `/sw.js` controls `/` and everything under it. A worker at `/shop/sw.js` would only control `/shop/*`. |
| **Controlled page / client** | A tab (page) whose requests go through the service worker. **Clients** = all open tabs/windows the worker controls. |
| **Origin** | Protocol + domain + port, e.g. `https://shopmydoor.netlify.app`. A service worker only works for **its own origin**. |
| **Secure context** | Service workers only run on `https://` or `http://localhost`, because a proxy with this much power must not be injectable by attackers on plain HTTP. |
| **Event-driven** | The worker has no `main()` that runs forever. It sleeps and wakes up only when an **event** happens (`install`, `activate`, `fetch`, `push`, `sync`, `notificationclick`, `message`). |
| **Terminated when idle** | The browser kills the worker after ~30 seconds of doing nothing. **Global variables are lost**, so never store state in a variable — use Cache Storage or IndexedDB. |
| **Cache Storage (Cache API)** | A browser storage area made for request → response pairs. `caches.open('v1')`, `cache.put()`, `cache.match()`. See DevTools → Application → Cache Storage. |
| **IndexedDB** | An async browser database. The service worker can use it; it **cannot** use `localStorage` (that API is synchronous and not available in workers). |
| **`event.waitUntil(promise)`** | "Don't kill me until this promise finishes." Used in `install`/`activate`/`push` so the browser waits for caching or showing a notification. |
| **`event.respondWith(response)`** | Used in the `fetch` event: "I'll answer this request myself" (from cache or a custom response). |
| **`postMessage`** | How the page and the service worker talk to each other (they don't share variables). |
| **Precache** | Files cached during `install`, known at **build time** (our JS/CSS/HTML bundle). |
| **Runtime cache** | Files cached **while the user browses**, according to URL rules (our Google Fonts and Unsplash images). |
| **Workbox** | Google's library that writes the service worker code for you. `vite-plugin-pwa` uses Workbox's `generateSW` mode to create `sw.js` at build time. |

### 16.4 Lifecycle (the most asked interview topic)

```
register() ──► INSTALLING ──► INSTALLED/WAITING ──► ACTIVATING ──► ACTIVATED ──► (idle ⇄ running events)
                  │                  │                   │
             'install' event   waits for old tabs   'activate' event
             precache files    to close             delete old caches
```

| Stage | What happens | Why it exists |
|-------|--------------|---------------|
| **Register** | Page calls `register('/sw.js')`. Browser downloads the file. | Opt-in: the site chooses to use a worker. |
| **Install** (`install` event) | Worker precaches the app shell. If any file fails, installation fails. | Prepare everything **before** taking control, so offline works immediately. |
| **Waiting** | New worker is installed but the **old** one still controls open tabs. | Prevents two versions of your app mixing in the same tab (old JS + new cache = bugs). |
| **Activate** (`activate` event) | Old worker is gone; new worker cleans up old caches. | Safe moment to delete outdated data. |
| **Activated / controlling** | Worker now receives `fetch`, `push`, etc. | Normal running state. |
| **Redundant** | Worker was replaced or failed to install. | Discarded. |

**Related terms:**

- **`skipWaiting()`** — skip the waiting stage; the new worker activates right away.
- **`clients.claim()`** — the newly activated worker takes control of already-open tabs without a reload.
- **Update check** — on each navigation (and at least every 24 hours) the browser re-downloads `sw.js`. If **even one byte** is different, it installs the new version. That's why each deploy produces a new `sw.js`.
- **`registerType: 'autoUpdate'`** (our config) — `vite-plugin-pwa` calls `skipWaiting` + `clients.claim` for you, so users get the new version automatically.

### 16.5 What a service worker looks like (hand-written, for understanding)

```js
// sw.js — Workbox generates something similar for us
const CACHE = "lumera-v1";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(["/", "/index.html"]))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
```

`self` = the worker's global object (like `window` on a page).

### 16.6 What a service worker can and cannot do

| ✅ Can | ❌ Cannot |
|-------|----------|
| Intercept and answer network requests | Access the DOM (`document`, `window`) |
| Cache files (Cache Storage) and use IndexedDB | Use `localStorage` / `sessionStorage` |
| Receive push messages and show notifications | Run forever (it is stopped when idle) |
| Retry failed requests later (Background Sync) | Work on plain `http://` (except localhost) |
| Talk to pages with `postMessage` | Control another origin's pages |

### 16.7 Service Worker vs Web Worker

| | Web Worker | Service Worker |
|---|------------|----------------|
| Purpose | Heavy computation off the main thread | Network proxy, caching, push |
| Lifetime | Lives as long as the page that created it | Independent of pages; woken by events |
| Intercepts network | No | Yes |
| Shared across tabs | No (one per page) | Yes (one per scope) |

---

## 17. Push Notifications — deep dive (every term explained)

### 17.1 What is a push notification?

A **push notification** is a message that the **server** sends to the user's device, which appears as a system notification (lock screen / notification center) — **even when the website is closed**.

- **Push** = the server initiates the message (the opposite of the page *pulling* data by calling the API).
- **Notification** = the pop-up the operating system shows.

Example for LUMERA: *"Your order #1042 has been shipped 🚚"* appears on the phone while the site is not open.

### 17.2 Two separate browser APIs (common confusion)

| API | Job | Where it runs |
|-----|-----|---------------|
| **Push API** | **Receive** a message from the server in the background | Service worker (`push` event) |
| **Notifications API** | **Display** the pop-up on screen | Service worker (`self.registration.showNotification()`) or page (`new Notification()`) |

Push without Notifications = a message arrives but the user sees nothing. Notifications without Push = the page can only show a pop-up while it's open. **Web push = both together**, and the service worker is what makes it work when the site is closed.

### 17.3 The players involved

```
┌──────────────┐  1. subscribe   ┌─────────────────┐
│   Browser    │ ──────────────► │  Push Service   │  (run by browser vendor:
│ (your page + │ ◄────────────── │  FCM / Mozilla  │   Google, Mozilla, Apple)
│  service     │  2. endpoint    │  / Apple        │
│  worker)     │                 └────────▲────────┘
└──────┬───────┘                          │ 4. send encrypted message
       │ 3. save subscription              │    to endpoint
       ▼                                   │
┌──────────────┐                           │
│ Your Express │ ──────────────────────────┘
│   server     │   (uses `web-push` npm package + VAPID keys)
└──────────────┘
       5. Push service delivers ──► browser wakes service worker ──► 'push' event ──► showNotification()
```

| Player | Role |
|--------|------|
| **Your server (application server)** | Decides *when* to notify (order shipped, price drop) and sends the message. In our stack: Express in `server/`. |
| **Push service** | A delivery server owned by the browser vendor. Chrome uses **FCM** (Firebase Cloud Messaging), Firefox uses **Mozilla Autopush**, Safari uses **Apple Push Notification service (APNs)**. You don't choose it — the browser does. |
| **Browser** | Keeps a connection to its push service and wakes your service worker when a message arrives. |
| **Service worker** | Handles the `push` event and shows the notification. |

### 17.4 Key terms

| Term | Explanation |
|------|-------------|
| **Permission** | The user must allow notifications. `Notification.requestPermission()` returns one of: **`default`** (not asked yet), **`granted`** (allowed), **`denied`** (blocked — you can't ask again; only the user can change it in browser settings). |
| **User gesture** | Browsers only let you ask for permission after a real user action (a button click). Asking on page load is blocked or auto-denied. |
| **VAPID** | *Voluntary Application Server Identification*. A **public/private key pair** that proves to the push service that messages really come from your server. Generate once with `npx web-push generate-vapid-keys`. |
| **VAPID public key** | Safe to put in the frontend (`VITE_VAPID_PUBLIC_KEY`). Passed to the browser when subscribing. |
| **VAPID private key** | **Secret**, server only (`server/config/config.env`). Used to sign each push message. |
| **`applicationServerKey`** | The option name for the VAPID public key in `pushManager.subscribe()`. |
| **`userVisibleOnly: true`** | A promise to the browser that every push will show a visible notification (no silent tracking). Chrome requires it. |
| **PushManager** | The object on the service worker registration that creates subscriptions: `registration.pushManager.subscribe(...)`. |
| **PushSubscription** | The "address" of one browser on one device. Your server stores it in the database (one user can have several — phone + laptop). |
| **`endpoint`** | A unique URL on the push service, e.g. `https://fcm.googleapis.com/fcm/send/abc123…`. Your server sends the message to this URL. |
| **`keys.p256dh`** | The browser's public encryption key. The server uses it to **encrypt** the message so the push service can't read it. |
| **`keys.auth`** | A secret shared between server and browser, also used in encryption. |
| **Payload** | The data inside the push (usually JSON: `{ title, body, url, icon }`). Limited to about **4 KB**. |
| **Encryption** | Web push payloads are always encrypted end-to-end (RFC 8291). The `web-push` library does it for you. |
| **TTL (time to live)** | How long the push service keeps the message if the device is offline, in seconds. After that, it's dropped. |
| **Urgency** | Hint for battery-saving: `very-low`, `low`, `normal`, `high`. |
| **Topic** | A label that lets a newer message **replace** an undelivered older one (e.g. only the latest order status). |
| **`push` event** | Fired in the service worker when a message arrives. Read the data with `event.data.json()`. |
| **`showNotification(title, options)`** | Displays the notification. Options: `body`, `icon`, `badge`, `image`, `tag`, `data`, `actions`, `requireInteraction`. |
| **`tag`** | Notifications with the same tag replace each other instead of stacking. |
| **`badge`** | Small monochrome icon shown in the Android status bar. |
| **`actions`** | Buttons on the notification (e.g. "Track order", "Dismiss"). Support varies by platform. |
| **`notificationclick` event** | Fired in the service worker when the user taps the notification. Usually opens or focuses a tab with `clients.openWindow(url)`. |
| **`notificationclose` event** | User dismissed it — useful for analytics. |
| **Unsubscribe / expiry** | Subscriptions can expire or be revoked. If sending returns **HTTP 404 or 410 Gone**, delete that subscription from your database. |

### 17.5 The complete flow, step by step

1. **User clicks "Enable order updates"** (user gesture).
2. Page calls `Notification.requestPermission()` → user taps **Allow** → `granted`.
3. Page gets the service worker registration and calls `pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: VAPID_PUBLIC_KEY })`.
4. The browser contacts its push service and returns a **PushSubscription** (`endpoint` + `keys`).
5. Page sends that subscription to your server: `POST /api/v1/push/subscribe`. Server stores it against the logged-in user.
6. Later, an admin marks an order as **Shipped** in the dashboard.
7. Server loads that user's subscriptions and calls `webpush.sendNotification(subscription, JSON.stringify(payload))`.
8. `web-push` signs the request with the **VAPID private key**, encrypts the payload with `p256dh` + `auth`, and POSTs to the `endpoint`.
9. The push service delivers it to the device (immediately, or when the device comes online within the TTL).
10. The browser wakes the service worker → **`push` event** → `showNotification(...)`.
11. User taps it → **`notificationclick`** → service worker opens `/orders`.

### 17.6 Example code (for understanding — not wired into LUMERA yet)

**Frontend — subscribe (e.g. a button in the profile panel):**

```js
const urlBase64ToUint8Array = (base64) => {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
};

export async function enablePush() {
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return;

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(import.meta.env.VITE_VAPID_PUBLIC_KEY),
  });

  await axiosInstance.post("/push/subscribe", subscription);
}
```

**Service worker — receive and click:**

```js
self.addEventListener("push", (event) => {
  const data = event.data?.json() ?? {};
  event.waitUntil(
    self.registration.showNotification(data.title ?? "LUMERA", {
      body: data.body,
      icon: "/pwa-192.png",
      badge: "/pwa-192.png",
      tag: data.tag,
      data: { url: data.url ?? "/" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url));
});
```

**Backend — send (Express, `npm i web-push`):**

```js
import webpush from "web-push";

webpush.setVapidDetails(
  "mailto:support@lumera.com",
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

export async function notifyUser(subscriptions, payload) {
  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(sub, JSON.stringify(payload), { TTL: 3600 });
    } catch (err) {
      if (err.statusCode === 404 || err.statusCode === 410) {
        // subscription expired — delete it from the database
      }
    }
  }
}
```

### 17.7 What LUMERA would need to add push

| Step | Where |
|------|-------|
| Generate VAPID keys (`npx web-push generate-vapid-keys`) | Once, locally |
| `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` | `server/config/config.env` + deployed server env |
| `VITE_VAPID_PUBLIC_KEY` | `client/.env` |
| `push_subscriptions` table (user_id, endpoint, p256dh, auth) | Postgres |
| `POST /api/v1/push/subscribe` and `/unsubscribe` routes | `server/` |
| Call `notifyUser()` when order status changes | Order controller / admin update |
| **Switch vite-plugin-pwa from `generateSW` to `injectManifest`** | `client/vite.config.js` — `generateSW` writes the whole `sw.js` itself, so you can't add `push` listeners. `injectManifest` lets you write your own `src/sw.js` and Workbox only injects the precache list. |

### 17.8 Android vs iOS for push

| | Android (Chrome, Edge, Firefox) | iOS / iPadOS (Safari) |
|---|---|---|
| Support | Full, works in the browser tab too | Since **iOS 16.4** (2023) |
| Requirement | Just permission | App **must be added to the Home Screen** first; doesn't work in a regular Safari tab |
| Push service | FCM (Chrome) | Apple Push Notification service |
| Permission prompt | After user gesture | After user gesture, inside the installed app |
| Silent push | Not allowed (`userVisibleOnly`) | Not allowed |

### 17.9 Push vs other "real-time" options

| | Web Push | Socket.IO (we already use it) | Email (we use SMTP) |
|---|---|---|---|
| Works when site is closed | ✅ | ❌ (needs open tab) | ✅ |
| Instant | ✅ | ✅ | Slower |
| Needs permission | ✅ | ❌ | ❌ |
| Best for | Order shipped, back in stock | Live dashboard/stock updates while browsing | Receipts, password reset |

### 17.10 Best practices

- Ask for permission **in context** ("Get notified when your order ships?") after the user places an order — not on first page load.
- Keep notifications relevant; spammy notifications lead users to block the site permanently (`denied`).
- Always put a URL in `data` so tapping opens the right page.
- Clean up expired subscriptions (404/410).
- Never put secrets or personal data in the payload beyond what's needed.

### 17.11 Interview questions — Service Worker & Push

**Q: Why can't a service worker access the DOM?**  
A: It runs on a separate worker thread and may run with no page open at all, so there is no `document` to access. It talks to pages via `postMessage`.

**Q: Why does a new service worker go into "waiting"?**  
A: So an open tab doesn't mix old page code with the new worker's caches. It activates once all old tabs close, or immediately if `skipWaiting()` is called.

**Q: Difference between `waitUntil` and `respondWith`?**  
A: `waitUntil` extends the event's lifetime until a promise finishes (install, activate, push). `respondWith` supplies the response for a `fetch` event.

**Q: Where does a service worker store data if it can't use localStorage?**  
A: Cache Storage for request/response pairs, IndexedDB for structured data.

**Q: What is the difference between the Push API and the Notifications API?**  
A: Push API receives messages from the server in the background; Notifications API displays them. Web push uses both, inside the service worker.

**Q: What are VAPID keys?**  
A: A public/private key pair identifying your server to the push service. Public key goes to the browser at subscribe time; private key signs messages on the server.

**Q: What does a PushSubscription contain?**  
A: An `endpoint` URL on the browser's push service, plus `p256dh` and `auth` keys used to encrypt the payload.

**Q: Can the push service read my notification content?**  
A: No. Payloads are end-to-end encrypted with the subscription's keys; the push service only forwards them.

**Q: What happens if the user's phone is offline when you send a push?**  
A: The push service holds it for the TTL you set, then delivers when the device reconnects — or drops it if TTL expires.

**Q: How do you handle a subscription that no longer works?**  
A: The push service returns 404 or 410; remove that subscription from the database.

**Q: Does web push work on iPhone?**  
A: Yes since iOS 16.4, but only after the user adds the PWA to the Home Screen and grants permission from within it.

**Q: Why do we need `injectManifest` instead of `generateSW` for push?**  
A: `generateSW` produces the entire service worker automatically, with no place for custom event listeners. `injectManifest` lets us write our own worker (with `push` and `notificationclick`) while Workbox still injects the precache list.

---

Keep this doc next to `I18N_TRANSLATION_GUIDE.md`. Read sections 1–3, 11, 16 and 17 before interviews; use sections 4–9 when working on the client.
