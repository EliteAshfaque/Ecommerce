import { ArrowUpRight, Search } from "lucide-react";
import { Link } from "react-router-dom";

// Categories arrive from the storefront table, so these quick searches stay aligned with live merchandising.
// Shortcut links to the URL-based catalogue filters; parent supplies active categories as props.
const PopularSearches = ({ categories = [] }) => {
  if (!categories.length) return null;
  return (
    <section className="home-reveal mb-16 flex flex-col gap-4 rounded-3xl border border-white/70 bg-white/65 px-5 py-5 shadow-[0_12px_30px_rgba(42,31,107,.05)] backdrop-blur-md sm:flex-row sm:items-center sm:justify-between">
      <div className="shrink-0"><p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.2em] text-primary"><Search className="h-3.5 w-3.5" /> Popular searches</p><p className="mt-1 text-xs text-stone">Start with a department customers browse most.</p></div>
      <div className="flex flex-wrap gap-2 sm:justify-end">{categories.slice(0, 8).map((category) => <Link key={category.id} to={`/products?category=${encodeURIComponent(category.name)}`} className="group inline-flex items-center gap-1 rounded-full border border-ink/10 bg-white px-3 py-2 text-[11px] font-semibold text-ink transition hover:border-primary/30 hover:bg-primary/[.05] hover:text-primary">{category.name}<ArrowUpRight className="h-3 w-3 opacity-0 transition group-hover:opacity-100" /></Link>)}</div>
    </section>
  );
};

export default PopularSearches;
