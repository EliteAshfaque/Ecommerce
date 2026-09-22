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

Keep this doc next to `I18N_TRANSLATION_GUIDE.md`. Read sections 1–3 and 11 before interviews; use sections 4–9 when working on the client.
