import { Link } from "react-router-dom";
import { categories } from "../../data/products";

const CategoryGrid = () => {
  return (
    <section className="py-20">
      <div className="mb-12 text-center">
        <p className="mb-3 text-[11px] uppercase tracking-[0.28em] text-primary">
          Collections
        </p>
        <h2 className="mb-4 font-display text-4xl font-semibold text-foreground md:text-5xl">
          Shop by Category
        </h2>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
          Curated essentials, designed to make the everyday feel a little brighter.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-5 md:grid-cols-4 md:gap-6">
        {categories.map((category) => (
          <Link
            key={category.id}
            to={`/products?category=${encodeURIComponent(category.name)}`}
            className="group glass-card overflow-hidden rounded-3xl transition duration-300 hover:-translate-y-2"
          >
            <div className="relative aspect-[4/3] overflow-hidden">
              <img
                src={category.image}
                alt={category.name}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
              <h3 className="absolute bottom-4 left-4 flex items-center gap-2 font-display text-lg font-semibold text-white md:text-xl">
                {category.name}
                <span className="text-sm opacity-0 transition duration-300 group-hover:translate-x-1 group-hover:opacity-100">↗</span>
              </h3>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default CategoryGrid;
