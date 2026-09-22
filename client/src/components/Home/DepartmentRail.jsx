import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

// Categories and their product totals come from /storefront, so merchandising stays in sync with the database.
// Homepage category-navigation rail. Categories are props so CMS/fallback data can
// be reused without this component knowing about Redux or API requests.
const DepartmentRail = ({ categories = [] }) => {
  if (!categories.length) return null;

  return (
    <section className="mb-14 animate-fade-up">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.24em] text-primary">Browse the marketplace</p>
          <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight">Shop by department</h2>
        </div>
        <Link to="/products" className="hidden items-center gap-1 text-sm font-semibold text-primary sm:inline-flex">
          View all <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>

      {/* This is intentionally a horizontally scrollable flex rail, not a tiny wrapped
          grid: touch users can browse many departments while cards retain readable width. */}
      <div className="flex gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {categories.map((category) => (
          <Link
            key={category.id}
            to={`/products?category=${encodeURIComponent(category.name)}`}
            className="group flex w-[122px] shrink-0 flex-col overflow-hidden rounded-2xl border border-white/70 bg-white/70 p-2.5 shadow-[0_10px_24px_rgb(31_25_84_/_0.06)] transition duration-300 hover:-translate-y-1 hover:border-primary/25 hover:shadow-[0_16px_34px_rgb(31_25_84_/_0.14)] sm:w-[142px]"
          >
            <div className="aspect-square overflow-hidden rounded-xl bg-mist">
              <img src={category.image_url} alt={category.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
            </div>
            <p className="mt-3 truncate text-sm font-semibold text-ink">{category.name}</p>
            <p className="mt-1 text-[10px] font-medium uppercase tracking-[.12em] text-stone">
              {category.product_count || 0} curated finds
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default DepartmentRail;
