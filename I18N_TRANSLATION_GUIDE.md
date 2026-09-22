# Multi-Language (i18n) Guide — LUMERA Client

How to add and use translations in the **client** app (`Vite + React`) with **i18next** and **react-i18next**.

You write the code yourself. This doc is the checklist and usage reference.

---

## 1. Packages to install

From the `client` folder:

```bash
npm install i18next react-i18next
```

Optional (auto-detect browser language + remember last choice):

```bash
npm install i18next react-i18next
```

| Package | Role |
|---------|------|
| `i18next` | Core translation engine |
| `react-i18next` | React hook: `useTranslation()` |
| `i18next-browser-languagedetector` | Optional: detect / remember language |

---

## Folder in this project

```
client/src/translation/
  i18n.js
  LanguageSwitcher.jsx
  locales/
    en.json   ← English
    ar.json   ← Arabic (RTL)
    hi.json   ← Hindi
```

**No Redux slice.** i18next stores the active language itself. Use `useTranslation()` / `i18n.changeLanguage()` only.

In `main.jsx`: `import "./translation/i18n.js";`

In components:
```js
const { t } = useTranslation();
t("nav.home")
```


---

## 3. Locale file format

Use flat or nested keys. Nested is clearer for a large app.

**`locales/en.json` example:**

```json
{
  "nav": {
    "home": "Home",
    "products": "Products",
    "cart": "Bag",
    "orders": "Orders"
  },
  "product": {
    "addToBag": "Add to bag",
    "outOfStock": "This item is currently unavailable",
    "signInToAdd": "Sign in to add items to your bag."
  },
  "common": {
    "loading": "Loading…",
    "save": "Save"
  }
}
```

**`locales/ar.json` example:**

```json
{
  "nav": {
    "home": "الرئيسية",
    "products": "المنتجات",
    "cart": "السلة",
    "orders": "طلباتي"
  },
  "product": {
    "addToBag": "أضف إلى الحقيبة",
    "outOfStock": "هذا المنتج غير متوفر حالياً",
    "signInToAdd": "سجّل الدخول لإضافة المنتجات إلى الحقيبة."
  },
  "common": {
    "loading": "جاري التحميل…",
    "save": "حفظ"
  }
}
```

**Rules:**

- Same keys in every language file.
- Values change; keys stay the same (`nav.home`).
- Do **not** put API product names/prices in these files unless the backend stores translations.

---

## 4. Init file (`src/i18n.js`) — what it must do

Conceptually your init should:

1. `import i18n from "i18next"`
2. `import { initReactI18next } from "react-i18next"`
3. Import `en.json` / `ar.json`
4. Call `i18n.use(initReactI18next).init({ ... })` with:
   - `resources: { en: { translation: en }, ar: { translation: ar } }`
   - `lng: "en"` (or read from `localStorage`)
   - `fallbackLng: "en"`
   - `interpolation: { escapeValue: false }` (React already escapes)

If you use the detector package, also `.use(LanguageDetector)` before `.init()`.

Export the default `i18n` instance.

---

## 5. Wire it in `main.jsx`

At the top (before rendering `<App />`):

```js
import "./i18n";
```

That loads translations for the whole app. No Redux needed for i18n.

---

## 6. How to use in a component

### Basic

```js
import { useTranslation } from "react-i18next";

const Navbar = () => {
  const { t } = useTranslation();

  return <Link to="/">{t("nav.home")}</Link>;
};
```

| Code | Meaning |
|------|---------|
| `t("nav.home")` | Read nested key `nav` → `home` |
| `t("product.addToBag")` | Button label |

### With variables

In JSON:

```json
"welcome": "Hello, {{name}}"
```

In JSX:

```js
t("welcome", { name: authUser.name })
```

### Change language

```js
const { i18n } = useTranslation();

i18n.changeLanguage("ar"); // or "en"
```

Save preference yourself if you want:

```js
localStorage.setItem("lang", "ar");
```

On init, read that key and pass it as `lng`.

---

## 7. Language switcher (UI idea)

Create a small component (e.g. in Navbar):

1. Buttons or select: **EN** | **AR**
2. On click → `i18n.changeLanguage("en")` or `"ar"`
3. Optional: highlight the active language with `i18n.language`
4. Optional: set document direction for Arabic:

```js
document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
document.documentElement.lang = lang;
```

Call that whenever language changes (in the switcher or an `i18n.on("languageChanged", ...)` listener).

For Tailwind RTL layouts, use `rtl:` variants where needed (margins, flex direction).

---

## 8. Where to replace text first (order)

Do UI strings piece by piece:

1. Navbar + Sidebar  
2. Footer  
3. ProductCard (buttons + toasts)  
4. Cart / CartSidebar  
5. LoginModal  
6. Orders / Payment  
7. Home sections  

Toast example:

```js
toast.info(t("product.signInToAdd"));
```

---

## 9. What to translate vs what not to

| Translate (locale JSON) | Do not put in locale JSON |
|-------------------------|---------------------------|
| Buttons, labels, menus | Product `name` / `description` from API |
| Empty states, errors | Prices / currency formatting* |
| Toast messages | User-generated content |
| Static About / FAQ copy | Dynamic order IDs |

\*Use `toLocaleString` / `Intl` for numbers and dates; use `t()` for surrounding words.

---

## 10. Dashboard app

`dashboard/` is a **separate** Vite app. Repeat:

1. `npm install i18next react-i18next` inside `dashboard`
2. Its own `src/i18n.js` + `src/locales/`
3. Import in `dashboard/src/main.jsx`

Client and dashboard do **not** share locale files unless you later extract a shared package.

---

## 11. Quick checklist

- [ ] Install packages in `client`
- [ ] Create `locales/en.json` and `locales/ar.json` with matching keys
- [ ] Create `src/i18n.js` and init
- [ ] `import "./i18n"` in `main.jsx`
- [ ] Replace hard-coded strings with `t("...")`
- [ ] Add language switcher (`changeLanguage`)
- [ ] For Arabic: set `dir="rtl"`
- [ ] Test: switch language → Navbar / buttons update without refresh

---

## 12. Common mistakes

1. **Different keys** in `en.json` vs `ar.json` → missing text or raw key shown.  
2. **Forgetting** `import "./i18n"` in `main.jsx` → `t()` does nothing useful.  
3. **Translating product DB fields** in JSON → wrong approach; need API/DB translations later.  
4. **Hard-coding** toast strings after enabling i18n → still English only.  
5. **RTL without** `dir="rtl"` → Arabic text direction looks wrong.

---

## 13. Minimal mental model

```
en.json / ar.json  →  i18n.js init  →  import in main.jsx
                              ↓
                    useTranslation() → t("nav.home")
                              ↓
              LanguageSwitcher → i18n.changeLanguage("ar")
```

Same key everywhere; only the language file value changes.

---

When you finish Navbar with `t()`, add the next page the same way. Expand JSON keys as you go — you do not need every string on day one.
