/**
 * LanguageSwitcher — dropdown to pick EN / Arabic / Hindi
 *
 * FOLDER CHOICE
 * -------------
 * This file lives in components/Layout/ because it is UI (like Navbar).
 *
 * Language DATA / setup stays in translation/:
 *   translation/i18n.js
 *   translation/locales/en.json | ar.json | hi.json
 *
 * Navbar only places it:
 *   import LanguageSwitcher from "./LanguageSwitcher";
 *   <LanguageSwitcher overHero={isOverHero} />
 *
 * HOW IT WORKS
 * ------------
 * <select> value = current language
 * onChange → i18n.changeLanguage(code)
 * → all t("...") update + i18n.js saves localStorage + RTL for Arabic
 *
 * No Redux slice — i18next owns the language.
 */

import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";

// code  = must match resources in translation/i18n.js ("en" | "ar" | "hi")
// label = text shown inside the dropdown (language’s own name is normal UX)
const LANGS = [
  { code: "en", label: "English" },
  { code: "ar", label: "العربية" },
  { code: "hi", label: "हिन्दी" },
];

const LanguageSwitcher = ({ className = "", overHero = false }) => {
  const { i18n, t } = useTranslation();
  const active = String(i18n.language || "en").slice(0, 2);

  // Native <select> = real dropdown (browser UI). No extra library needed.
  return (
    <label
      className={`relative inline-flex items-center gap-1.5 ${className}`}
      title={t("common.language")}
    >
      <Globe
        className={`pointer-events-none h-4 w-4 shrink-0 ${
          overHero ? "text-white/90" : "text-stone"
        }`}
        aria-hidden
      />
      <span className="sr-only">{t("common.language")}</span>
      <select
        value={active}
        aria-label={t("common.language")}
        onChange={(e) => i18n.changeLanguage(e.target.value)}
        className={`h-9 cursor-pointer appearance-none rounded-xl border bg-transparent py-1.5 pl-2 pr-7 text-[11px] font-semibold uppercase tracking-[0.08em] outline-none transition ${
          overHero
            ? "border-white/25 text-white hover:bg-white/10"
            : "border-border/15 text-foreground hover:bg-mist"
        }`}
      >
        {LANGS.map(({ code, label }) => (
          <option key={code} value={code} className="bg-fog text-ink">
            {label}
          </option>
        ))}
      </select>
      {/* Decorative chevron — select still opens on click anywhere on the control */}
      <span
        className={`pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] ${
          overHero ? "text-white/70" : "text-stone"
        }`}
        aria-hidden
      >
        ▾
      </span>
    </label>
  );
};

export default LanguageSwitcher;
