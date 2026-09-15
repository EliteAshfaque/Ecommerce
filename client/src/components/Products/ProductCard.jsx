import { useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { ArrowUpRight, Heart, ShoppingBag, Star, Truck } from "lucide-react";
import { addToCart } from "../../store/slices/cartSlice";
import { toggleWishlist } from "../../store/slices/wishlistSlice";
import { toggleAuthPopup } from "../../store/slices/popupSlice";

export const getProductImage = (product, index = 0) => {
  const images = product?.images;
  if (Array.isArray(images) && images[index]?.url) return images[index].url;
  if (Array.isArray(images) && images[0]?.url) return images[0].url;
  if (typeof images === "string") {
    try {
      const parsed = JSON.parse(images);
      return parsed?.[index]?.url || parsed?.[0]?.url || images;
    } catch {
      return images;
    }
  }
  return "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80";
};

export const getProductImages = (product) => {
  const images = product?.images;
  if (Array.isArray(images) && images.length) {
    return images.map((img) => img?.url).filter(Boolean);
  }
  if (typeof images === "string") {
    try {
      const parsed = JSON.parse(images);
      if (Array.isArray(parsed)) {
        return parsed.map((img) => img?.url).filter(Boolean);
      }
    } catch {
      return [images];
    }
  }
  return [getProductImage(product)];
};

const ProductCard = ({ product, layout = "slider" }) => {
  const dispatch = useDispatch();
  const authUser = useSelector((state) => state.auth.authUser);
  const saved = useSelector((state) => state.wishlist.products.some((item) => item.id === product?.id));
  const [hover, setHover] = useState(false);

  if (!product) return null;

  const images = getProductImages(product);
  const primary = images[0];
  const secondary = images[1] || primary;
  const price = Number(product.price || 0).toLocaleString("en-AE", {
    style: "currency",
    currency: "AED",
  });
  // Database compare-at prices make the savings badge truthful rather than decorative.
  const compareAt = Number(product.compare_at_price || 0);
  const hasSaving = compareAt > Number(product.price || 0);
  const savingPercent = hasSaving ? Math.round((1 - Number(product.price) / compareAt) * 100) : 0;
  const inStock = Number(product.stock) > 0;
  const rating = Number(product.ratings || 0);
  const reviewCount = Number(product.review_count || 0);

  const handleAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!inStock) return toast.info("This item is currently unavailable");
    dispatch(addToCart({ product, quantity: 1 }));
    toast.success("Added to bag");
  };

  const handleFavourite = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!authUser) {
      toast.info("Sign in to save favourites.");
      dispatch(toggleAuthPopup());
      return;
    }
    dispatch(toggleWishlist(product.id));
  };

  return (
    <article
      className={
        layout === "grid" ? "group w-full" : "group w-[224px] shrink-0 sm:w-[244px]"
      }
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className="market-product-card relative aspect-[4/5] overflow-hidden rounded-3xl bg-white">
        <Link to={`/product/${product.id}`} className="absolute inset-0" aria-label={`View ${product.name}`}>
          <img
            src={hover ? secondary : primary}
            alt={product.name}
            draggable={false}
            className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
          />
        </Link>
          <span className={`absolute left-3 top-3 rounded-full border px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] backdrop-blur-md ${hasSaving ? "border-amber-200 bg-amber-100/90 text-amber-900" : "border-white/30 bg-white/65 text-ink"}`}>
            {!inStock ? "Sold out" : product.badge || (hasSaving ? `${savingPercent}% off` : "In stock")}
          </span>
          <button
            type="button"
            onClick={handleFavourite}
            aria-label={saved ? "Remove from favourites" : "Save to favourites"}
            className={`absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border backdrop-blur-md transition hover:scale-110 ${
              saved ? "border-pink-300 bg-pink-500 text-white" : "border-white/30 bg-white/65 text-ink"
            }`}
          >
            <Heart className={`h-4 w-4 ${saved ? "fill-current" : ""}`} />
          </button>
          <button
            type="button"
            onClick={handleAdd}
            className="absolute bottom-3 left-3 right-3 flex items-center justify-center gap-2 rounded-xl bg-[#201b4d]/90 py-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white shadow-xl backdrop-blur-md transition duration-300 sm:translate-y-16 sm:group-hover:translate-y-0"
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            {inStock ? "Quick add" : "Sold out"}
          </button>
      </div>
      <Link to={`/product/${product.id}`} className="block px-2 pb-2 pt-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.18em] text-primary">
                {product.category}
              </p>
              <h3 className="mt-1.5 truncate font-display text-[15px] font-semibold leading-snug tracking-tight">
                {product.name}
              </h3>
            </div>
            <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-stone transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
          </div>
          <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1"><p className="text-base font-bold tabular-nums text-ink">{price}</p>{hasSaving && <><span className="text-xs tabular-nums text-stone line-through">{compareAt.toLocaleString("en-AE", { style: "currency", currency: "AED" })}</span><span className="text-[10px] font-bold uppercase tracking-[.08em] text-emerald-700">Save {savingPercent}%</span></>}</div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-stone">
            {rating > 0 ? <><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /><span className="font-semibold text-ink">{rating.toFixed(1)}</span><span>{reviewCount ? `(${reviewCount.toLocaleString()})` : "verified rating"}</span></> : <span>New to LUMERA</span>}
          </div>
          <p className={`mt-2 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[.1em] ${inStock ? "text-emerald-700" : "text-rose-600"}`}>
            <Truck className="h-3.5 w-3.5" />
            {inStock ? (Number(product.stock) <= 5 ? `Only ${product.stock} left` : "UAE delivery available") : "Currently unavailable"}
          </p>
      </Link>
    </article>
  );
};

export default ProductCard;
