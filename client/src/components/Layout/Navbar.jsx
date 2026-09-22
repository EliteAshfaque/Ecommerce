import { Menu, User, ShoppingCart, Sun, Moon, Search, Sparkles, MapPin, LocateFixed, LoaderCircle } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useTheme } from "../../contexts/ThemeContext";
import { useDispatch, useSelector } from "react-redux";
import {
  toggleSidebar,
  toggleSearchBar,
  toggleCart,
  toggleAuthPopup,
  toggleAIModal,
} from "../../store/slices/popupSlice";
import { getSavedDeliveryLocation, requestDeliveryLocation } from "../../lib/location";
import LanguageSwitcher from "./LanguageSwitcher";
import { useTranslation } from "react-i18next";

// Shared header mounted by App on every customer route. It reads cart/auth/popup
// Redux state, ThemeContext and Router location to open global UI or navigate.
const Navbar = () => {
  // t("nav.searchPlaceholder") reads from translation/locales/{en|ar|hi}.json
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [deliveryLocation, setDeliveryLocation] = useState(() => getSavedDeliveryLocation());
  const [locationOpen, setLocationOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationMessage, setLocationMessage] = useState("");
  const { cart = [] } = useSelector((state) => state.cart);
  const categories = useSelector((state) => state.storefront.categories);

  const cartItemsCount = cart.reduce(
    (total, item) => total + (item.quantity || 1),
    0
  );

  const isOverHero = location.pathname === "/";

  // A full desktop search keeps discovery one action away on a marketplace-sized catalogue.
  const submitSearch = (event) => {
    event.preventDefault();
    const term = query.trim();
    if (term) navigate(`/products?search=${encodeURIComponent(term)}`);
  };

  // The browser asks for permission only after this deliberate customer action.
  const useCurrentLocation = async () => {
    setLocating(true);
    setLocationMessage("");
    try {
      const nextLocation = await requestDeliveryLocation();
      setDeliveryLocation(nextLocation);
      setLocationMessage("Delivery area saved for this browser.");
    } catch (error) {
      setLocationMessage(error.message || "We could not find your location.");
    } finally {
      setLocating(false);
    }
  };

  return (
    // `fixed top-0 z-50` keeps navigation above page content. `backdrop-blur-xl`
    // gives the transparent marketplace header contrast without a solid block.
    <nav
      className={`fixed left-0 top-0 z-50 w-full border-b backdrop-blur-xl transition-colors ${
        isOverHero
          ? "border-white/10 bg-[#11112d]/25"
          : "border-white/50 bg-fog/70 shadow-[0_10px_30px_rgb(55_45_120_/_0.05)]"
      }`}
    >
      <div className="mx-auto max-w-[1600px] px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={() => dispatch(toggleSidebar())}
              aria-label="Open menu"
              className={`rounded-md p-2 transition ${
                isOverHero ? "text-white hover:bg-white/10" : "text-foreground hover:bg-mist"
              }`}
            >
              <Menu className="h-6 w-6" />
            </button>
            <Link to="/">
              <h1
                className={`flex items-center gap-2 font-display text-xl font-bold tracking-[0.12em] ${
                  isOverHero ? "text-white" : "text-primary"
                }`}
              >
                <span className={`flex h-7 w-7 items-center justify-center rounded-[10px] ${isOverHero ? "bg-white/15" : "gradient-primary shadow-lg"}`}>
                  <Sparkles className="h-3.5 w-3.5 text-white" />
                </span>
                LUMERA
              </h1>
            </Link>
          </div>

          {/* Desktop search appears from md (768px). On smaller screens the separate
              search-icon button below opens the mobile SearchOverlay instead. */}
          <form onSubmit={submitSearch} className="mx-4 hidden max-w-2xl flex-1 md:block">
            <label className="relative block">
              <span className="sr-only">Search LUMERA</span>
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("nav.searchPlaceholder")}
                className="h-10 w-full rounded-xl border border-white/60 bg-white/95 pl-11 pr-4 text-sm text-ink shadow-[0_8px_24px_rgb(14_12_42_/_0.12)] outline-none transition placeholder:text-stone focus:border-primary/50 focus:ring-4 focus:ring-primary/10"
              />
            </label>
          </form>

          {/* AI discovery is progressive enhancement: hidden on compact widths to protect
              the header's primary navigation and touch targets, shown from lg upward. */}
          <button
            type="button"
            onClick={() => dispatch(toggleAIModal())}
            className={`hidden items-center gap-2 rounded-xl border px-3 py-2 text-[10px] font-bold uppercase tracking-[.12em] transition lg:inline-flex ${isOverHero ? "border-white/20 bg-white/10 text-white hover:bg-white/20" : "border-primary/20 bg-primary/[.06] text-primary hover:bg-primary hover:text-white"}`}
            aria-label="Find products with Gemini AI"
          >
            <Sparkles className="h-3.5 w-3.5" /> AI Find
          </button>

          <div className="flex items-center gap-1 sm:gap-2">
            <LanguageSwitcher overHero={isOverHero} />
            <button type="button" onClick={() => setLocationOpen((value) => !value)} className={`hidden items-center gap-1.5 rounded-xl px-2 py-2 text-[10px] font-bold uppercase tracking-[.12em] transition xl:flex ${isOverHero ? "text-white/90 hover:bg-white/10" : "text-foreground hover:bg-mist"}`} aria-expanded={locationOpen}>
              <MapPin className="h-4 w-4" /> {deliveryLocation?.label || "Set delivery area"}
            </button>
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className={`rounded-xl p-2 transition ${
                isOverHero
                  ? "text-white hover:bg-white/10"
                  : "text-foreground hover:bg-mist"
              }`}
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>

            <button
              type="button"
              onClick={() => dispatch(toggleSearchBar())}
              aria-label="Search"
              className={`rounded-xl p-2 transition md:hidden ${
                isOverHero
                  ? "text-white hover:bg-white/10"
                  : "text-foreground hover:bg-mist"
              }`}
            >
              <Search className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={() => dispatch(toggleAuthPopup())}
              aria-label="Account"
              className={`rounded-xl p-2 transition ${
                isOverHero
                  ? "text-white hover:bg-white/10"
                  : "text-foreground hover:bg-mist"
              }`}
            >
              <User className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={() => dispatch(toggleCart())}
              aria-label="Cart"
              className={`relative rounded-xl p-2 transition ${
                isOverHero
                  ? "text-white hover:bg-white/10"
                  : "text-foreground hover:bg-mist"
              }`}
            >
              <ShoppingCart className="h-5 w-5" />
              {cartItemsCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full gradient-primary px-1 text-[10px] font-semibold text-primary-foreground shadow-lg">
                  {cartItemsCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
      {locationOpen && (
        <div className="absolute right-4 top-[4.5rem] z-50 w-[290px] rounded-2xl border border-white/60 bg-white p-4 text-ink shadow-2xl">
          <p className="text-[10px] font-bold uppercase tracking-[.18em] text-primary">Delivery location</p>
          <p className="mt-2 text-sm leading-relaxed text-stone">{deliveryLocation?.label ? `Delivering to ${deliveryLocation.label}.` : "Choose your area for a more relevant delivery experience."}</p>
          <button type="button" onClick={useCurrentLocation} disabled={locating} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-3 py-3 text-[10px] font-bold uppercase tracking-[.14em] text-white transition hover:bg-primary disabled:cursor-wait disabled:opacity-70">
            {locating ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
            {locating ? "Finding your location" : "Use my current location"}
          </button>
          {locationMessage && <p className="mt-3 text-xs leading-relaxed text-stone">{locationMessage}</p>}
        </div>
      )}
      {/* A desktop-only horizontal department rail visually joins the header to the hero.
          `overflow-x-auto` keeps long CMS category names usable rather than wrapping badly. */}
      {isOverHero && categories.length > 0 && (
        <div className="absolute top-full hidden w-full border-y border-white/10 bg-[#151331]/70 backdrop-blur-xl lg:block">
          <div className="mx-auto flex max-w-[1600px] items-center gap-1 overflow-x-auto px-4 py-2.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <Link to="/products" className="shrink-0 rounded-full bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.12em] text-[#171433] transition hover:bg-violet-100">All departments</Link>
            {categories.map((category) => (
              <Link key={category.id} to={`/products?category=${encodeURIComponent(category.name)}`} className="shrink-0 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.11em] text-white/75 transition hover:bg-white/10 hover:text-white">
                {category.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
