import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal, Sparkles, X } from "lucide-react";
import { fetchProducts } from "../store/slices/productSlice";
import { categories as fallbackCategories } from "../data/products";
import ProductCard from "../components/Products/ProductCard";
import ProductFilters from "../components/Products/ProductFilters";
import Pagination from "../components/Products/Pagination";

const sortOptions = [
  ["newest", "Newest first"],
  ["rating", "Most loved"],
  ["price-low", "Price: low to high"],
  ["price-high", "Price: high to low"],
];

const Products = () => {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const [searchInput, setSearchInput] = useState(searchParams.get("search") || "");
  const { products, loading, totalProducts, currentPage, totalPages } = useSelector((state) => state.product);
  const storefrontCategories = useSelector((state) => state.storefront.categories);
  const categories = storefrontCategories.length ? storefrontCategories : fallbackCategories;

  const category = searchParams.get("category") || "";
  const search = searchParams.get("search") || "";
  const price = searchParams.get("price") || "0-10000";
  const ratings = searchParams.get("ratings") || "";
  const availability = searchParams.get("availability") || "";
  const sort = searchParams.get("sort") || "newest";
  const page = Number(searchParams.get("page") || 1);
  const isAi = searchParams.get("ai") === "1";

  const filters = useMemo(
    () => ({ category, search, price, page, ratings, availability, sort }),
    [category, search, price, page, ratings, availability, sort]
  );
  const activeCount = [category, search, ratings, availability, price !== "0-10000" ? price : ""].filter(Boolean).length;

  useEffect(() => {
    if (!isAi) dispatch(fetchProducts(filters));
  }, [dispatch, filters, isAi]);

  const setParams = (patch) => {
    const next = { ...filters, ...patch, page: patch.page ?? 1 };
    const params = new URLSearchParams();
    ["category", "search", "ratings", "availability", "sort"].forEach((key) => {
      if (next[key] && !(key === "sort" && next[key] === "newest")) params.set(key, next[key]);
    });
    if (next.price && next.price !== "0-10000") params.set("price", next.price);
    if (next.page && next.page !== 1) params.set("page", String(next.page));
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const clearFilters = () => {
    setSearchInput("");
    setSearchParams({});
  };

  const submitSearch = (event) => {
    event.preventDefault();
    setParams({ search: searchInput.trim() });
  };

  return (
    <main className="page-shell min-h-screen bg-fog px-6 pb-24 pt-28 text-ink md:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-9 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.25em] text-primary"><Sparkles className="h-3.5 w-3.5" /> LUMERA market</p>
            <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight md:text-5xl">
              {isAi ? "Picked for you" : category || "The complete edit"}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-stone md:text-base">
              {isAi ? "An intelligent selection based on your request." : "Discover considered finds across fashion, home, beauty, technology and more."}
            </p>
          </div>
          <p className="rounded-full border border-primary/15 bg-primary/[.05] px-4 py-2 text-xs font-medium text-primary">
            {totalProducts} {totalProducts === 1 ? "find" : "finds"} available
          </p>
        </header>

        <div className="mb-7 flex gap-2 overflow-x-auto pb-2">
          <button onClick={() => setParams({ category: "" })} className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition ${!category ? "bg-ink text-white shadow-lg" : "border border-border/15 bg-white/60 text-stone hover:text-ink"}`}>All departments</button>
          {categories.map((item) => <button key={item.id} onClick={() => setParams({ category: item.name })} className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition ${category === item.name ? "bg-ink text-white shadow-lg" : "border border-border/15 bg-white/60 text-stone hover:text-ink"}`}>{item.name}</button>)}
        </div>

        <section className="glass-card mb-8 rounded-3xl p-3 md:p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <form onSubmit={submitSearch} className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
              <input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Search products, materials or categories" className="w-full rounded-2xl border border-border/10 bg-white/60 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-primary/40 focus:ring-4 focus:ring-primary/10" />
            </form>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setShowFilters((value) => !value)} className="inline-flex items-center gap-2 rounded-2xl border border-border/15 bg-white/60 px-4 py-3 text-xs font-semibold text-ink lg:hidden"><SlidersHorizontal className="h-4 w-4 text-primary" /> Filter{activeCount ? ` (${activeCount})` : ""}</button>
              <select value={sort} onChange={(event) => setParams({ sort: event.target.value })} className="rounded-2xl border border-border/15 bg-white/60 px-4 py-3 text-xs font-semibold text-ink outline-none">
                {sortOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
              {activeCount > 0 && <button type="button" onClick={clearFilters} className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-stone transition hover:bg-red-50 hover:text-red-600" aria-label="Clear filters"><X className="h-4 w-4" /></button>}
            </div>
          </div>
          {showFilters && <div className="mt-4 border-t border-border/10 pt-5 lg:hidden"><ProductFilters filters={filters} onChange={setParams} onClear={clearFilters} categories={categories} mobile /></div>}
        </section>

        <div className="flex items-start gap-9">
          <ProductFilters filters={filters} onChange={setParams} onClear={clearFilters} categories={categories} />
          <section className="min-w-0 flex-1">
            <div className="mb-6 flex items-center justify-between text-xs text-stone"><span>{activeCount ? `${activeCount} active filter${activeCount === 1 ? "" : "s"}` : "Browse all departments"}</span><span>Prices in AED</span></div>
            {loading ? <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-7"><>{Array.from({ length: 9 }).map((_, index) => <div key={index} className="animate-pulse"><div className="aspect-[4/5] rounded-3xl bg-mist" /><div className="mt-4 h-3 w-20 rounded bg-mist" /><div className="mt-2 h-4 w-2/3 rounded bg-mist" /></div>)}</></div> : products.length === 0 ? <div className="glass-card rounded-3xl px-6 py-24 text-center"><p className="font-display text-2xl font-semibold">Nothing in this edit yet</p><p className="mt-2 text-sm text-stone">Try another category, price range or search term.</p><button onClick={clearFilters} className="btn-primary mt-6">Clear discovery filters</button></div> : <><div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-7 md:gap-y-14">{products.map((product) => <ProductCard key={product.id} product={product} layout="grid" />)}</div><Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={(nextPage) => setParams({ page: nextPage })} /></>}
          </section>
        </div>
      </div>
    </main>
  );
};

export default Products;
