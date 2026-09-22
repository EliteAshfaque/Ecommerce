/**
 * =============================================================================
 * i18n.js — Language setup for the whole client app
 * =============================================================================
 *
 * WHAT THIS FILE DOES
 * -------------------
 * 1. Loads English / Arabic / Hindi JSON dictionaries.
 * 2. Starts i18next so any component can call useTranslation() → t("nav.home").
 * 3. Remembers the user's last language in localStorage.
 * 4. Sets <html dir="rtl|ltr"> when Arabic is selected.
 *
 * NO REDUX SLICE
 * --------------
 * Language state lives inside i18next. You do NOT need a translationSlice.
 *
 * HOW TO USE IN A COMPONENT
 * -------------------------
 *   import { useTranslation } from "react-i18next";
 *   const { t, i18n } = useTranslation();
 *   t("nav.home")                 // → "Home" or Arabic/Hindi text
 *   i18n.changeLanguage("ar")     // switch language
 *
 * FOLDER MAP
 * ----------
 *   translation/                 ← language DATA + setup only
 *     i18n.js
 *     locales/en.json | ar.json | hi.json
 *
 *   components/Layout/
 *     LanguageSwitcher.jsx       ← dropdown UI (used by Navbar)
 *     Navbar.jsx
 *
 * IMPORTANT
 * ---------
 * Every language file must use the SAME keys.
 * Only the values (the words) change.
 */

import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// Dictionary files — one object of UI strings per language.
import en from "./locales/en.json";
import ar from "./locales/ar.json";
import hi from "./locales/hi.json";

// Languages that read right-to-left (Arabic). Hindi and English stay left-to-right.
const RTL_LANGS = ["ar"];

// Browser storage key so the choice survives a page refresh.
const STORAGE_KEY = "lumera-lang";

// Read last saved language (e.g. "ar"). Falls back to English if none saved.
const savedLang =
  typeof window !== "undefined"
    ? localStorage.getItem(STORAGE_KEY)
    : null;

/**
 * Updates the real HTML page for the current language:
 * - dir="rtl" for Arabic so layout/text flip correctly
 * - lang="ar" helps browsers and screen readers
 */
const applyDocumentDirection = (lang) => {
  if (typeof document === "undefined") return;
  // i18n may return "ar-EG"; we only need the first two letters ("ar").
  const short = String(lang || "en").slice(0, 2);
  document.documentElement.dir = RTL_LANGS.includes(short) ? "rtl" : "ltr";
  document.documentElement.lang = short;
};

// Connect i18next to React, then register all languages.
i18n.use(initReactI18next).init({
  // resources shape: { languageCode: { translation: { ...json } } }
  // The inner name "translation" is i18next's default namespace.
  resources: {
    en: { translation: en },
    ar: { translation: ar },
    hi: { translation: hi },
  },

  // Active language on first load: saved choice, or English.
  lng: savedLang || "en",

  // If a key is missing in Arabic/Hindi, show the English text instead of a blank.
  fallbackLng: "en",

  // Only these three codes are allowed.
  supportedLngs: ["en", "ar", "hi"],

  interpolation: {
    // React already escapes JSX text, so i18next should not double-escape.
    escapeValue: false,
  },
});

// Apply RTL/LTR once at startup for the current language.
applyDocumentDirection(i18n.language);

// Whenever the user switches language (LanguageSwitcher, etc.):
// 1) save it  2) update <html dir> and lang
i18n.on("languageChanged", (lang) => {
  localStorage.setItem(STORAGE_KEY, lang);
  applyDocumentDirection(lang);
});

export default i18n;
