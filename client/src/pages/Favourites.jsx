import { Heart, Search, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toggleAuthPopup } from "../store/slices/popupSlice";
import ProductCard from "../components/Products/ProductCard";

const Favourites = () => {
  const dispatch = useDispatch();
  const authUser = useSelector((state) => state.auth.authUser);
  const { products, loading } = useSelector((state) => state.wishlist);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const categories = useMemo(() => ["All", ...new Set(products.map((product) => product.category).filter(Boolean))], [products]);
  const visibleProducts = useMemo(() => products.filter((product) => {
    const matchesCategory = category === "All" || product.category === category;
    const haystack = `${product.name} ${product.category} ${product.description}`.toLowerCase();
    return matchesCategory && haystack.includes(query.toLowerCase().trim());
  }), [products, category, query]);

  if (!authUser) {
    return <main className="page-shell min-h-screen px-6 pt-36 text-center"><Heart className="mx-auto h-9 w-9 text-primary" /><h1 className="mt-5 font-display text-4xl font-semibold">Your saved edit</h1><p className="mx-auto mt-3 max-w-md text-stone">Sign in to keep every find you love in one private place.</p><button onClick={() => dispatch(toggleAuthPopup())} className="btn-primary mt-7">Sign in to save favourites</button></main>;
  }

  return (
    <main className="page-shell min-h-screen px-6 pb-24 pt-28 md:px-8">
      <div className="mx-auto max-w-7xl">
        <section className="relative overflow-hidden rounded-[2rem] bg-[#1a1741] px-6 py-9 text-white shadow-[0_24px_60px_rgba(47,35,116,.23)] md:px-10 md:py-11">
          <div className="hero-aurora absolute -right-20 -top-28 h-80 w-80 opacity-80" />
          <div className="relative flex flex-col justify-between gap-8 md:flex-row md:items-end"><div><p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.24em] text-violet-200"><Sparkles className="h-3.5 w-3.5" /> Your private collection</p><h1 className="mt-3 font-display text-4xl font-semibold tracking-tight md:text-5xl">Saved for later, loved already.</h1><p className="mt-3 max-w-xl text-sm leading-relaxed text-white/70 md:text-base">Keep an eye on the pieces that caught your attention. Your favourites are always tied to your LUMERA account.</p></div><div className="rounded-2xl border border-white/15 bg-white/10 px-5 py-4 backdrop-blur-lg"><p className="text-[10px] uppercase tracking-[.18em] text-violet-200">Your collection</p><p className="mt-1 font-display text-3xl font-semibold">{products.length} <span className="text-base text-white/60">saved</span></p></div></div>
        </section>

        {loading ? <div className="mt-10 h-56 animate-pulse rounded-3xl bg-mist" /> : products.length ? <>
          <div className="mt-8 flex flex-col gap-4 rounded-3xl border border-border/10 bg-white/55 p-4 backdrop-blur-lg lg:flex-row lg:items-center lg:justify-between"><div className="relative min-w-0 flex-1 lg:max-w-md"><Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search your saved edit" className="w-full rounded-2xl border border-border/10 bg-white/70 py-3 pl-10 pr-4 text-sm outline-none focus:border-primary/40" /></div><div className="flex gap-2 overflow-x-auto pb-1 lg:pb-0">{categories.map((item) => <button key={item} onClick={() => setCategory(item)} className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition ${category === item ? "bg-ink text-white" : "border border-border/15 bg-white/70 text-stone hover:text-ink"}`}>{item}</button>)}</div></div>
          {visibleProducts.length ? <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-7 lg:grid-cols-4">{visibleProducts.map((product) => <ProductCard key={product.id} product={product} layout="grid" />)}</div> : <div className="glass-card mt-10 rounded-3xl p-14 text-center"><Heart className="mx-auto h-8 w-8 text-primary" /><h2 className="mt-4 font-display text-2xl font-semibold">No saved match</h2><p className="mt-2 text-sm text-stone">Try another department or search term.</p></div>}
        </> : <div className="glass-card mt-10 rounded-3xl p-14 text-center"><Heart className="mx-auto h-8 w-8 text-primary" /><h2 className="mt-4 font-display text-2xl font-semibold">Start your private edit</h2><p className="mx-auto mt-2 max-w-sm text-sm text-stone">Tap the heart on any product to build a considered collection you can revisit anytime.</p><Link className="btn-primary mt-7" to="/products">Explore the market</Link></div>}
      </div>
    </main>
  );
};

export default Favourites;
