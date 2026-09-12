import { Heart, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toggleAuthPopup } from "../store/slices/popupSlice";
import ProductCard from "../components/Products/ProductCard";

const Favourites = () => {
  const dispatch = useDispatch();
  const authUser = useSelector((state) => state.auth.authUser);
  const { products, loading } = useSelector((state) => state.wishlist);

  if (!authUser) {
    return (
      <main className="page-shell min-h-screen px-6 pt-36 text-center">
        <Heart className="mx-auto h-9 w-9 text-primary" />
        <h1 className="mt-5 font-display text-4xl font-semibold">Your luminous list</h1>
        <p className="mx-auto mt-3 max-w-md text-stone">Sign in to keep your most-loved finds close.</p>
        <button onClick={() => dispatch(toggleAuthPopup())} className="btn-primary mt-7">Sign in to save favourites</button>
      </main>
    );
  }

  return (
    <main className="page-shell min-h-screen px-6 pb-24 pt-28 md:px-8">
      <div className="mx-auto max-w-6xl">
        <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[.22em] text-primary"><Sparkles className="h-3.5 w-3.5" /> Your collection</p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight md:text-5xl">Saved favourites</h1>
        <p className="mt-3 text-stone">A private edit of pieces you do not want to lose.</p>
        {loading ? <div className="mt-12 h-48 animate-pulse rounded-3xl bg-mist" /> : products.length ? (
          <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 md:gap-7">
            {products.map((product) => <ProductCard key={product.id} product={product} layout="grid" />)}
          </div>
        ) : (
          <div className="glass-card mt-12 rounded-3xl p-12 text-center">
            <Heart className="mx-auto h-8 w-8 text-primary" />
            <h2 className="mt-4 font-display text-2xl font-semibold">Nothing saved yet</h2>
            <Link className="btn-primary mt-6" to="/products">Explore LUMERA</Link>
          </div>
        )}
      </div>
    </main>
  );
};

export default Favourites;
