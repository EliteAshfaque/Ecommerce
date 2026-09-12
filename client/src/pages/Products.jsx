import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal } from "lucide-react";
import { fetchProducts } from "../store/slices/productSlice";
import { categories } from "../data/products";
import ProductCard from "../components/Products/ProductCard";
import Pagination from "../components/Products/Pagination";

const Products = () => {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const [searchInput, setSearchInput] = useState(
    searchParams.get("search") || ""
  );

  const { products, loading, totalProducts, currentPage, totalPages } =
    useSelector((state) => state.product);

  const category = searchParams.get("category") || "";
  const search = searchParams.get("search") || "";
  const price = searchParams.get("price") || "0-10000";
  const page = Number(searchParams.get("page") || 1);
  const isAi = searchParams.get("ai") === "1";

  const filters = useMemo(
    () => ({ category, search, price, page, ratings: "", availability: "" }),
    [category, search, price, page]
  );

  useEffect(() => {
    if (isAi) return;
    dispatch(fetchProducts(filters));
  }, [dispatch, filters, isAi]);

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  const setParams = (patch) => {
    const next = {
      category,
      search,
      price,
      page: 1,
      ...patch,
    };
    const params = new URLSearchParams();
    if (next.category) params.set("category", next.category);
    if (next.search) params.set("search", next.search);
    if (next.price && next.price !== "0-10000") params.set("price", next.price);
    if (next.page && next.page !== 1) params.set("page", String(next.page));
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submitSearch = (e) => {
    e.preventDefault();
    setParams({ search: searchInput.trim() });
  };

  return (
    <div className="min-h-screen bg-fog text-ink">
      <div className="h-16" />

      <main className="mx-auto max-w-6xl px-6 pb-24 pt-12 md:px-8 md:pt-16">
        {/* Quiet header */}
        <header className="mb-14 max-w-2xl">
          <p className="text-[11px] uppercase tracking-[0.28em] text-stone">
            Shop
          </p>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight md:text-5xl">
            {isAi ? "For you" : category || "All products"}
          </h1>
          <p className="mt-3 text-stone">
            {totalProducts} {totalProducts === 1 ? "piece" : "pieces"}
          </p>
        </header>

        {/* Minimal controls */}
        <div className="mb-10 flex flex-col gap-6 border-b border-border/10 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <form onSubmit={submitSearch} className="relative max-w-xs flex-1">
            <Search className="absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-stone" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search"
              className="w-full border-0 border-b border-border/15 bg-transparent py-2 pl-7 text-sm outline-none focus:border-ink"
            />
          </form>

          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => setShowFilters((v) => !v)}
              className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-stone transition hover:text-ink"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filter
            </button>
            {(category || search || price !== "0-10000") && (
              <button
                type="button"
                onClick={() => {
                  setSearchParams({});
                  setSearchInput("");
                }}
                className="text-[11px] uppercase tracking-[0.18em] text-stone transition hover:text-ink"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Simple filter row */}
        {showFilters && (
          <div className="mb-10 animate-fade-in space-y-6 border-b border-border/10 pb-8">
            <div>
              <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-stone">
                Category
              </p>
              <div className="flex flex-wrap gap-x-5 gap-y-2">
                <button
                  type="button"
                  onClick={() => setParams({ category: "" })}
                  className={`text-sm transition ${
                    !category ? "text-ink" : "text-stone hover:text-ink"
                  }`}
                >
                  All
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setParams({ category: cat.name })}
                    className={`text-sm transition ${
                      category === cat.name
                        ? "text-ink"
                        : "text-stone hover:text-ink"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-stone">
                Price
              </p>
              <div className="flex flex-wrap gap-x-5 gap-y-2">
                {[
                  ["0-10000", "Any"],
                  ["0-100", "Under $100"],
                  ["100-300", "$100–300"],
                  ["300-600", "$300–600"],
                  ["600-10000", "$600+"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setParams({ price: value })}
                    className={`text-sm transition ${
                      price === value ? "text-ink" : "text-stone hover:text-ink"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 md:gap-x-6 md:gap-y-16">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[4/5] bg-mist" />
                <div className="mt-4 h-3 w-20 bg-mist" />
                <div className="mt-2 h-4 w-2/3 bg-mist" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="py-32 text-center">
            <p className="font-display text-2xl font-semibold">No results</p>
            <button
              type="button"
              onClick={() => {
                setSearchParams({});
                setSearchInput("");
              }}
              className="mt-6 text-[11px] uppercase tracking-[0.18em] text-stone underline-offset-4 hover:text-ink hover:underline"
            >
              View all products
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 md:gap-x-8 md:gap-y-16">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} layout="grid" />
              ))}
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(nextPage) => setParams({ page: nextPage })}
            />
          </>
        )}
      </main>
    </div>
  );
};

export default Products;
