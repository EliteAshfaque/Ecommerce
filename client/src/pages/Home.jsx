import { useSelector } from "react-redux";
import HeroSlider from "../components/Home/HeroSlider";
import CategoryGrid from "../components/Home/CategoryGrid";
import ProductSlider from "../components/Home/ProductSlider";
import FeatureSection from "../components/Home/FeatureSection";
import NewsletterSection from "../components/Home/NewsletterSection";

const Home = () => {
  const { topRatedProducts = [], newProducts = [], loading } = useSelector(
    (state) => state.product
  );

  return (
    <div className="min-h-screen bg-fog text-ink">
      <HeroSlider />

      <div className="container mx-auto px-4 pt-20">
        <CategoryGrid />

        {loading && (
          <p className="mb-10 text-center text-sm uppercase tracking-[0.2em] text-muted-foreground">
            Loading collections…
          </p>
        )}

        {newProducts?.length > 0 && (
          <ProductSlider
            title="New Arrivals"
            subtitle="Fresh pieces added this season — considered forms, lasting materials."
            products={newProducts}
          />
        )}

        {topRatedProducts?.length > 0 && (
          <ProductSlider
            title="Most Loved"
            subtitle="Highest-rated finds from the LUMERA community."
            products={topRatedProducts}
            viewAllTo="/products?sort=rating"
          />
        )}

        <FeatureSection />
        <NewsletterSection />
      </div>
    </div>
  );
};

export default Home;
