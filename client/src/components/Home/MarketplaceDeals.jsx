import { ArrowUpRight, BadgePercent, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import ProductCard from "../Products/ProductCard";

// Only items with a database compare-at price appear here, keeping every advertised saving real.
const MarketplaceDeals = ({ products = [] }) => {
  const uniqueProducts = Array.from(new Map(products.filter((product) => product?.id).map((product) => [product.id, product])).values());
  const deals = uniqueProducts.filter((product) => Number(product.compare_at_price) > Number(product.price)).slice(0, 4);
  if (!deals.length) return null;

  return (
    <section className="home-reveal mb-20 rounded-[2rem] border border-amber-200/70 bg-[linear-gradient(135deg,#fffdf5_0%,#fff8df_52%,#f4efff_100%)] p-5 shadow-[0_18px_46px_rgba(83,62,24,.08)] md:p-7">
      <div className="mb-6 flex flex-col gap-4 border-b border-amber-900/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.23em] text-amber-800"><BadgePercent className="h-3.5 w-3.5" /> Live marketplace offers</p><h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink">Today’s considered deals.</h2><p className="mt-2 text-sm text-stone">Real catalogue prices, clear savings, no artificial countdown.</p></div>
        <Link to="/products?sort=rating" className="inline-flex items-center gap-1.5 text-xs font-bold text-primary transition hover:gap-2">View all offers <ArrowUpRight className="h-3.5 w-3.5" /></Link>
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-4 md:gap-x-5"><>{deals.map((product) => <ProductCard key={product.id} product={product} layout="grid" />)}</></div>
      <p className="mt-6 flex items-center gap-2 border-t border-amber-900/10 pt-4 text-[10px] font-semibold uppercase tracking-[.13em] text-stone"><Sparkles className="h-3.5 w-3.5 text-primary" /> Prices and availability update with the live LUMERA catalogue.</p>
    </section>
  );
};

export default MarketplaceDeals;
