import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Minus, Plus, ShieldCheck, Star, Truck } from "lucide-react";
import { toast } from "react-toastify";
import {
  clearProduct,
  fetchProductDetails,
} from "../store/slices/productSlice";
import { addToCart } from "../store/slices/cartSlice";
import { getProductImages } from "../components/Products/ProductCard";
import ProductCard from "../components/Products/ProductCard";
import ReviewsContainer from "../components/Products/ReviewsContainer";

const ProductDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { product, productLoading, products, newProducts, topRatedProducts } =
    useSelector((state) => state.product);

  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    if (id) dispatch(fetchProductDetails(id));
    return () => dispatch(clearProduct());
  }, [id, dispatch]);

  useEffect(() => {
    setActiveImage(0);
    setQuantity(1);
  }, [id]);

  // Save the actual product view locally so the home page can offer a useful, private return path.
  useEffect(() => {
    if (!product?.id) return;
    try {
      const saved = JSON.parse(window.localStorage.getItem("lumera-recently-viewed-v1") || "[]");
      const next = [product, ...(Array.isArray(saved) ? saved : []).filter((item) => item?.id !== product.id)].slice(0, 8);
      window.localStorage.setItem("lumera-recently-viewed-v1", JSON.stringify(next));
    } catch { /* Browser storage can be unavailable in private modes. */ }
  }, [product]);

  const images = useMemo(() => getProductImages(product), [product]);

  const related = useMemo(() => {
    if (!product) return [];
    const pool = [
      ...(products || []),
      ...(newProducts || []),
      ...(topRatedProducts || []),
    ];
    const seen = new Set();
    return pool
      .filter((p) => {
        if (!p?.id || p.id === product.id) return false;
        if (product.category && p.category !== product.category) return false;
        if (seen.has(p.id)) return false;
        seen.add(p.id);
        return true;
      })
      .slice(0, 3);
  }, [products, newProducts, topRatedProducts, product]);

  if (productLoading || !product) {
    return (
      <div className="min-h-screen bg-fog">
        <div className="h-16" />
        <div className="mx-auto grid max-w-6xl gap-12 px-6 py-16 md:grid-cols-2">
          <div className="aspect-[4/5] animate-pulse bg-mist" />
          <div className="space-y-4 self-center">
            <div className="h-3 w-24 animate-pulse bg-mist" />
            <div className="h-10 w-3/4 animate-pulse bg-mist" />
            <div className="h-5 w-20 animate-pulse bg-mist" />
          </div>
        </div>
      </div>
    );
  }

  const price = Number(product.price || 0).toLocaleString("en-AE", {
    style: "currency",
    currency: "AED",
  });
  const stock = Number(product.stock || 0);
  const inStock = stock > 0;
  const compareAt = Number(product.compare_at_price || 0);
  const hasSaving = compareAt > Number(product.price || 0);
  const savingPercent = hasSaving ? Math.round((1 - Number(product.price) / compareAt) * 100) : 0;

  const handleAddToCart = () => {
    if (!inStock) return toast.error("Unavailable");
    dispatch(addToCart({ product, quantity }));
    toast.success("Added to bag");
  };

  return (
    <div className="min-h-screen bg-fog text-ink">
      <div className="h-16" />

      <main className="mx-auto max-w-6xl px-6 pb-24 pt-8 md:px-8 md:pt-12">
        <Link
          to="/products"
          className="text-[11px] uppercase tracking-[0.18em] text-stone transition hover:text-ink"
        >
          ← Shop
        </Link>

        <div className="mt-10 grid items-start gap-12 md:mt-14 md:grid-cols-2 md:gap-16 lg:gap-24">
          {/* Image — calm, single focus */}
          <div>
            <div className="aspect-[4/5] overflow-hidden bg-mist">
              <img
                src={images[activeImage] || images[0]}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            </div>
            {images.length > 1 && (
              <div className="mt-3 flex gap-2">
                {images.map((src, i) => (
                  <button
                    key={src + i}
                    type="button"
                    onClick={() => setActiveImage(i)}
                    className={`h-14 w-12 overflow-hidden ${
                      activeImage === i ? "opacity-100" : "opacity-40"
                    }`}
                  >
                    <img src={src} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product facts remain clear so this feels like a practical marketplace detail page. */}
          <div className="md:pt-8">
            <div className="flex flex-wrap items-center gap-2"><p className="text-[11px] uppercase tracking-[0.22em] text-stone">{product.category}</p>{product.badge && <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[.12em] text-amber-900">{product.badge}</span>}</div>
            <h1 className="mt-4 font-display text-3xl font-semibold leading-tight tracking-tight md:text-4xl lg:text-[2.75rem]">
              {product.name}
            </h1>
            <div className="mt-5 flex flex-wrap items-end gap-x-3 gap-y-2"><p className="font-display text-3xl font-semibold tabular-nums text-ink">{price}</p>{hasSaving && <><p className="text-base tabular-nums text-stone line-through">{compareAt.toLocaleString("en-AE", { style: "currency", currency: "AED" })}</p><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.1em] text-emerald-700">Save {savingPercent}%</span></>}</div>
            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm"><span className="inline-flex items-center gap-1.5 font-semibold"><Star className="h-4 w-4 fill-amber-400 text-amber-400" />{Number(product.ratings || 0).toFixed(1)}</span><span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${inStock ? "text-emerald-700" : "text-rose-600"}`}><Truck className="h-4 w-4" />{inStock ? "UAE delivery available" : "Currently unavailable"}</span></div>

            <p className="mt-8 max-w-md text-[15px] leading-relaxed text-stone">
              {product.description}
            </p>

            <div className="mt-10 flex items-center gap-4">
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="flex h-11 w-11 items-center justify-center text-stone hover:text-ink"
                  aria-label="Decrease"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="w-8 text-center text-sm tabular-nums">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setQuantity((q) => Math.min(stock || 10, q + 1))
                  }
                  disabled={!inStock}
                  className="flex h-11 w-11 items-center justify-center text-stone hover:text-ink disabled:opacity-30"
                  aria-label="Increase"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddToCart}
              disabled={!inStock}
              className="mt-6 w-full max-w-sm bg-ink py-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-fog transition hover:bg-primary disabled:opacity-40"
            >
              {inStock ? "Add to bag" : "Sold out"}
            </button>

            <p className="mt-4 flex items-center gap-2 text-xs text-stone"><ShieldCheck className="h-4 w-4 text-primary" />{inStock ? "Stock is confirmed again at secure checkout." : "Check back soon for availability."}</p>
          </div>
        </div>

        <ReviewsContainer productId={product.id} />

        {related.length > 0 && (
          <section className="mt-28">
            <h2 className="mb-10 font-display text-2xl font-semibold tracking-tight">
              You may also like
            </h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-8">
              {related.map((item) => (
                <ProductCard key={item.id} product={item} layout="grid" />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default ProductDetail;
