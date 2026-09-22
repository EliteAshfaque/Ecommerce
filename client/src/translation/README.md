# Translation folder — language data only

JSON files **cannot** contain `// comments`.  
This README explains `en.json` / `ar.json` / `hi.json` instead.

## Correct folder split

```
translation/                      ← DATA + setup (not UI)
├── README.md
├── i18n.js                       ← starts i18next (imported from main.jsx)
└── locales/
    ├── en.json
    ├── ar.json
    └── hi.json

components/Layout/
├── LanguageSwitcher.jsx          ← dropdown UI
└── Navbar.jsx                    ← places <LanguageSwitcher />
```

| Folder | Put here |
|--------|----------|
| `translation/` | `i18n.js`, JSON strings |
| `components/Layout/` | Language dropdown UI |

**No Redux slice** for language — i18next owns it.

## How a JSON key becomes UI text

```js
const { t } = useTranslation();
t("nav.home")  // → "Home" / Arabic / Hindi
```

## Groups in locale files

| Group | Used for |
|-------|----------|
| `nav` | Navbar, Sidebar, search |
| `product` | ProductCard / toasts |
| `common` | Save, Cancel, Language |
| `auth` | Sign in / Sign out |

## Add a new string

1. Same key in **en**, **ar**, and **hi** JSON  
2. Use `t("group.key")` in the component
