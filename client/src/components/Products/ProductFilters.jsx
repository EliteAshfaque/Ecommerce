import { categories } from "../../data/products";

const priceRanges = [
  { label: "All", value: "0-10000" },
  { label: "Under $100", value: "0-100" },
  { label: "$100 – $300", value: "100-300" },
  { label: "$300 – $600", value: "300-600" },
  { label: "$600+", value: "600-10000" },
];

const ratingOptions = [
  { label: "Any", value: "" },
  { label: "4.0+", value: "4" },
  { label: "3.0+", value: "3" },
];

const availabilityOptions = [
  { label: "Any", value: "" },
  { label: "In stock", value: "in-stock" },
  { label: "Limited", value: "limited" },
];

const Chip = ({ active, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    className={`rounded-none border px-3 py-1.5 text-[11px] uppercase tracking-[0.14em] transition ${
      active
        ? "border-ink bg-ink text-fog dark:border-fog dark:bg-fog dark:text-ink"
        : "border-border/15 text-stone hover:border-ink/40 hover:text-ink"
    }`}
  >
    {children}
  </button>
);

const ProductFilters = ({ filters, onChange, onClear, mobile = false }) => {
  const set = (key, value) => onChange({ ...filters, [key]: value, page: 1 });

  return (
    <aside
      className={`${
        mobile ? "w-full" : "sticky top-24 hidden w-[220px] shrink-0 lg:block"
      }`}
    >
      <div className="mb-8 flex items-baseline justify-between">
        <p className="text-[11px] uppercase tracking-[0.24em] text-ink">
          Refine
        </p>
        <button
          type="button"
          onClick={onClear}
          className="text-[11px] uppercase tracking-[0.14em] text-stone underline-offset-4 hover:text-ink hover:underline"
        >
          Reset
        </button>
      </div>

      <div className="space-y-8">
        <div>
          <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-stone">
            Category
          </p>
          <div className="flex flex-col">
            <button
              type="button"
              onClick={() => set("category", "")}
              className={`border-b border-border/10 py-2.5 text-left text-sm transition ${
                !filters.category
                  ? "font-medium text-ink"
                  : "text-stone hover:text-ink"
              }`}
            >
              Everything
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => set("category", cat.name)}
                className={`border-b border-border/10 py-2.5 text-left text-sm transition ${
                  filters.category === cat.name
                    ? "font-medium text-ink"
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
          <div className="flex flex-wrap gap-2">
            {priceRanges.map((range) => (
              <Chip
                key={range.value}
                active={filters.price === range.value}
                onClick={() => set("price", range.value)}
              >
                {range.label}
              </Chip>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-stone">
            Rating
          </p>
          <div className="flex flex-wrap gap-2">
            {ratingOptions.map((opt) => (
              <Chip
                key={opt.label}
                active={filters.ratings === opt.value}
                onClick={() => set("ratings", opt.value)}
              >
                {opt.label}
              </Chip>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-stone">
            Availability
          </p>
          <div className="flex flex-wrap gap-2">
            {availabilityOptions.map((opt) => (
              <Chip
                key={opt.label}
                active={filters.availability === opt.value}
                onClick={() => set("availability", opt.value)}
              >
                {opt.label}
              </Chip>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default ProductFilters;
