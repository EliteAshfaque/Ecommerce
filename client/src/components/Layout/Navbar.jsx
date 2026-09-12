import { Menu, User, ShoppingCart, Sun, Moon, Search, Sparkles } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useTheme } from "../../contexts/ThemeContext";
import { useDispatch, useSelector } from "react-redux";
import {
  toggleSidebar,
  toggleSearchBar,
  toggleCart,
  toggleAuthPopup,
} from "../../store/slices/popupSlice";

const Navbar = () => {
  const { theme, toggleTheme } = useTheme();
  const dispatch = useDispatch();
  const location = useLocation();
  const { cart = [] } = useSelector((state) => state.cart);

  const cartItemsCount = cart.reduce(
    (total, item) => total + (item.quantity || 1),
    0
  );

  const isOverHero = location.pathname === "/";

  return (
    <nav
      className={`fixed left-0 top-0 z-50 w-full border-b backdrop-blur-xl transition-colors ${
        isOverHero
          ? "border-white/10 bg-[#11112d]/25"
          : "border-white/50 bg-fog/70 shadow-[0_10px_30px_rgb(55_45_120_/_0.05)]"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-16 items-center justify-between">
          <button
            type="button"
            onClick={() => dispatch(toggleSidebar())}
            aria-label="Open menu"
            className={`rounded-md p-2 transition ${
              isOverHero
                ? "text-white hover:bg-white/10"
                : "text-foreground hover:bg-mist"
            }`}
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex flex-1 justify-center">
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

          <div className="flex items-center gap-1 sm:gap-2">
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
              className={`rounded-xl p-2 transition ${
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
    </nav>
  );
};

export default Navbar;
