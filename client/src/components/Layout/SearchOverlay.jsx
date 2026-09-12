import { useEffect, useRef, useState } from "react";
import { X, Search, ArrowRight, Package, Sparkles } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toggleSearchBar } from "../../store/slices/popupSlice";

const quickSearches = [
  "Electronics",
  "Fashion",
  "Home & Garden",
  "Sports",
];

const SearchOverlay = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const inputRef = useRef(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isSearchBarOpen } = useSelector((state) => state.popup);

  useEffect(() => {
    if (!isSearchBarOpen) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        dispatch(toggleSearchBar());
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    setTimeout(() => inputRef.current?.focus(), 50);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isSearchBarOpen, dispatch]);

  if (!isSearchBarOpen) return null;

  const close = () => {
    setSearchQuery("");
    dispatch(toggleSearchBar());
  };

  const runSearch = (query = searchQuery) => {
    const value = query.trim();
    if (!value) return;
    close();
    navigate(`/products?search=${encodeURIComponent(value)}`);
  };

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close search"
        onClick={close}
        className="absolute inset-0 bg-ink/50 backdrop-blur-md transition-opacity"
      />

      {/* Panel */}
      <div className="relative z-10 flex min-h-full items-start justify-center px-4 pt-[12vh] sm:pt-[18vh]">
        <div className="animate-slide-in-top w-full max-w-2xl overflow-hidden border border-border/10 bg-fog/95 shadow-2xl backdrop-blur-xl dark:bg-[#12151c]/95">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/10 px-5 py-4 sm:px-6">
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-primary">
                Search
              </p>
              <h2 className="mt-1 font-display text-xl font-semibold text-foreground">
                Find products
              </h2>
            </div>
            <button
              type="button"
              onClick={close}
              className="glass-card glow-on-hover rounded-lg p-2"
              aria-label="Close"
            >
              <X className="h-5 w-5 text-primary" />
            </button>
          </div>

          {/* Input */}
          <div className="px-5 py-5 sm:px-6">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search for products, categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && runSearch()}
                className="w-full border border-border/15 bg-mist/60 py-4 pl-12 pr-28 text-base text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
              />
              <button
                type="button"
                onClick={() => runSearch()}
                className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-2 bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
              >
                Search
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            <p className="mt-3 text-xs text-muted-foreground">
              Press <kbd className="rounded border border-border/20 px-1.5 py-0.5">Enter</kbd> to search ·{" "}
              <kbd className="rounded border border-border/20 px-1.5 py-0.5">Esc</kbd> to close
            </p>
          </div>

          {/* Suggestions */}
          <div className="border-t border-border/10 px-5 py-5 sm:px-6">
            <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Popular right now
            </div>
            <div className="flex flex-wrap gap-2">
              {quickSearches.map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => runSearch(term)}
                  className="group flex items-center gap-2 border border-border/10 bg-card/60 px-3 py-2 text-sm text-foreground transition hover:border-primary/30 hover:text-primary"
                >
                  <Package className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary" />
                  {term}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchOverlay;
