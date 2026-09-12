import { useSelector } from "react-redux";
import HeroSlider from "../components/Home/HeroSlider";
import DepartmentRail from "../components/Home/DepartmentRail";
import ProductSlider from "../components/Home/ProductSlider";
import FeatureSection from "../components/Home/FeatureSection";
import NewsletterSection from "../components/Home/NewsletterSection";
import { Link } from "react-router-dom";
import { ArrowUpRight, Ticket } from "lucide-react";

const Home = () => {
  const { topRatedProducts = [], newProducts = [], loading } = useSelector(
    (state) => state.product
  );
  const { banners, offers, news, categories } = useSelector((state) => state.storefront);

  return (
    <div className="min-h-screen bg-fog text-ink">
      <HeroSlider banners={banners} />

      <div className="container mx-auto px-4 pt-20">
        <DepartmentRail categories={categories} />

        {offers.length > 0 && <section className="mb-20"><div className="mb-7 flex items-end justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.24em] text-primary">Offers</p><h2 className="mt-2 font-display text-3xl font-semibold">Reasons to discover more</h2></div><Link to="/products" className="hidden text-sm font-semibold text-primary sm:inline-flex sm:items-center sm:gap-1">Shop all <ArrowUpRight className="h-4 w-4" /></Link></div><div className="grid gap-4 md:grid-cols-3">{offers.map((offer) => <Link key={offer.id} to={offer.cta_url} className={`group rounded-3xl border p-6 transition hover:-translate-y-1 ${offer.accent === "sand" ? "border-amber-200 bg-amber-50" : offer.accent === "rose" ? "border-pink-200 bg-pink-50" : "border-violet-200 bg-violet-50"}`}><p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.18em] text-primary"><Ticket className="h-3.5 w-3.5" />{offer.kicker}</p><h3 className="mt-4 font-display text-2xl font-semibold leading-tight">{offer.title}</h3><p className="mt-3 text-sm leading-relaxed text-stone">{offer.description}</p>{offer.promotion_code && <p className="mt-5 w-fit rounded-lg bg-white px-3 py-2 text-xs font-bold tracking-[.13em] text-ink shadow-sm">{offer.promotion_code}</p>}<span className="mt-6 inline-flex items-center gap-1 text-xs font-bold text-primary">{offer.cta_label}<ArrowUpRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></span></Link>)}</div></section>}

        {loading && (
          <p className="mb-10 text-center text-sm uppercase tracking-[0.2em] text-muted-foreground">
            Loading collections…
          </p>
        )}

        {newProducts?.length > 0 && (
          <ProductSlider
            title="Fresh arrivals for you"
            subtitle="Newly added products across every LUMERA department."
            products={newProducts}
          />
        )}

        {topRatedProducts?.length > 0 && (
          <ProductSlider
            title="Bestsellers for you"
            subtitle="Top-rated customer favourites, ready to discover."
            products={topRatedProducts}
            viewAllTo="/products?sort=rating"
          />
        )}

        <FeatureSection />
        {news.length > 0 && <section className="mb-20"><div className="mb-8"><p className="text-[10px] font-bold uppercase tracking-[.24em] text-primary">LUMERA journal</p><h2 className="mt-2 font-display text-3xl font-semibold">Stories from the edit</h2></div><div className="grid gap-5 md:grid-cols-3">{news.map((item) => <Link to={item.cta_url} key={item.id} className="group glass-card overflow-hidden rounded-3xl"><div className="aspect-[16/10] overflow-hidden"><img src={item.image_url} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /></div><div className="p-5"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-primary">{item.kicker}</p><h3 className="mt-2 font-display text-xl font-semibold">{item.title}</h3><p className="mt-2 text-sm leading-relaxed text-stone">{item.description}</p><span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-primary">{item.cta_label}<ArrowUpRight className="h-3.5 w-3.5" /></span></div></Link>)}</div></section>}
        <NewsletterSection />
      </div>
    </div>
  );
};

export default Home;
