import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import ProductCard from "../Products/ProductCard";

const ProductSlider = ({
  title,
  subtitle,
  products = [],
  viewAllTo = "/products",
}) => {
  const scrollRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    const maxScroll = el.scrollWidth - el.clientWidth;
    const nextProgress = maxScroll > 0 ? el.scrollLeft / maxScroll : 0;

    setProgress(nextProgress);
    setCanScrollLeft(el.scrollLeft > 8);
    setCanScrollRight(el.scrollLeft < maxScroll - 8);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    updateScrollState();
    el.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);

    return () => {
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [products, updateScrollState]);

  if (!products?.length) return null;

  const scroll = (direction) => {
    const el = scrollRef.current;
    if (!el) return;
    const card = el.querySelector("[data-slide-card]");
    const amount = card ? card.offsetWidth + 24 : 360;
    el.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  return (
    <section className="relative mb-24 animate-fade-up">
      <div className="mb-10 flex flex-col gap-6 border-b border-border/10 pb-6 md:flex-row md:items-end md:justify-between">
        <div className="max-w-xl">
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-primary" />
            <p className="text-[11px] uppercase tracking-[0.3em] text-primary">
              Collection
            </p>
          </div>
          <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
            {title}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">
            {subtitle ||
              "Handpicked pieces with lasting materials and quiet detail."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to={viewAllTo}
            className="group/link mr-2 hidden items-center gap-1.5 text-sm font-medium text-foreground transition hover:text-primary sm:inline-flex"
          >
            View all
            <ArrowUpRight className="h-4 w-4 transition group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" />
          </Link>

          <button
            type="button"
            onClick={() => scroll("left")}
            disabled={!canScrollLeft}
            aria-label="Previous products"
            className="glass-card flex h-12 w-12 items-center justify-center rounded-2xl text-foreground transition enabled:hover:border-primary enabled:hover:bg-primary enabled:hover:text-primary-foreground disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => scroll("right")}
            disabled={!canScrollRight}
            aria-label="Next products"
            className="glass-card flex h-12 w-12 items-center justify-center rounded-2xl text-foreground transition enabled:hover:border-primary enabled:hover:bg-primary enabled:hover:text-primary-foreground disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="relative">
        <div
          ref={scrollRef}
          className="flex gap-5 overflow-x-auto scroll-smooth pb-6 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] md:gap-6 [&::-webkit-scrollbar]:hidden"
        >
          {products.map((product, index) => (
            <div
              key={product.id}
              data-slide-card
              className="snap-start animate-fade-up"
              style={{ animationDelay: `${Math.min(index, 7) * 60}ms` }}
            >
              <ProductCard product={product} />
            </div>
          ))}

          <Link
            to={viewAllTo}
            data-slide-card
            className="glass-card group flex w-[240px] shrink-0 snap-start flex-col items-start justify-end rounded-3xl border-dashed p-6 transition duration-300 hover:border-primary/40 hover:bg-primary/5 sm:w-[280px]"
          >
            <p className="text-[11px] uppercase tracking-[0.22em] text-primary">
              Explore
            </p>
            <p className="mt-3 font-display text-2xl font-semibold leading-tight text-foreground">
              See the full catalogue
            </p>
            <span className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-ink transition group-hover:gap-3 group-hover:text-primary">
              Shop all
              <ArrowUpRight className="h-4 w-4" />
            </span>
          </Link>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-4">
        <div className="h-[2px] flex-1 overflow-hidden bg-border/10">
          <div
            className="h-full bg-primary transition-[width] duration-200 ease-out"
            style={{ width: `${Math.max(progress * 100, 6)}%` }}
          />
        </div>
        <p className="shrink-0 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          {String(products.length).padStart(2, "0")} pieces
        </p>
      </div>
    </section>
  );
};

export default ProductSlider;
