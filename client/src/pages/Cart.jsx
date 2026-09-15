import { ArrowLeft, ArrowRight, Minus, PackageCheck, Plus, ShieldCheck, ShoppingBag, Trash2, Truck } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { clearCart, removeFromCart, updateCartQuantity } from "../store/slices/cartSlice";
import { getProductImage } from "../components/Products/ProductCard";

const formatAED = (amount) => Number(amount || 0).toLocaleString("en-AE", { style: "currency", currency: "AED" });

const Cart = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { cart = [] } = useSelector((state) => state.cart);

  // STEP 1: Calculate the same AED totals customers will see before checkout.
  const subtotal = cart.reduce((sum, item) => sum + Number(item.product?.price || 0) * Number(item.quantity || 0), 0);
  const delivery = subtotal >= 250 ? 0 : 15;
  const vat = Number((subtotal * 0.05).toFixed(2));
  const total = Number((subtotal + delivery + vat).toFixed(2));
  const freeDeliveryRemaining = Math.max(0, 250 - subtotal);
  const itemCount = cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0);

  // STEP 2: Keep quantity changes within the live product stock level.
  const changeQuantity = (item, change) => {
    const nextQuantity = Number(item.quantity || 0) + change;
    if (nextQuantity <= 0) return dispatch(removeFromCart({ id: item.product.id }));
    if (change > 0 && Number.isFinite(Number(item.product.stock)) && nextQuantity > Number(item.product.stock)) return;
    dispatch(updateCartQuantity({ id: item.product.id, quantity: change }));
  };

  // STEP 3: Direct customers into the protected, address-aware checkout flow.
  const beginCheckout = () => navigate("/payment");

  if (!cart.length) {
    return (
      <main className="page-shell min-h-screen bg-fog px-6 pb-24 pt-28 text-ink md:px-8">
        <div className="mx-auto flex max-w-xl flex-col items-center rounded-[2rem] border border-white/70 bg-white/75 px-6 py-20 text-center shadow-[0_24px_70px_rgba(38,30,104,.1)] backdrop-blur-xl">
          <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/[.09] text-primary"><ShoppingBag className="h-7 w-7" /></span>
          <p className="mt-7 text-[10px] font-bold uppercase tracking-[.24em] text-primary">Your LUMERA bag</p>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">Nothing saved here yet.</h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-stone">Discover useful pieces across every department, then return here whenever you are ready.</p>
          <Link to="/products" className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-ink px-6 py-3.5 text-[11px] font-bold uppercase tracking-[.16em] text-white transition hover:-translate-y-0.5 hover:bg-primary">Explore the marketplace <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </main>
    );
  }

  return (
    <main className="page-shell min-h-screen bg-fog px-6 pb-24 pt-28 text-ink md:px-8">
      <div className="mx-auto max-w-7xl">
        <Link to="/products" className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.18em] text-stone transition hover:text-primary"><ArrowLeft className="h-3.5 w-3.5" /> Continue shopping</Link>
        <header className="mt-7 flex flex-col gap-4 border-b border-ink/10 pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-[10px] font-bold uppercase tracking-[.24em] text-primary">Your LUMERA bag</p><h1 className="mt-2 font-display text-4xl font-semibold tracking-tight md:text-5xl">Ready when you are.</h1><p className="mt-3 text-sm text-stone">{itemCount} {itemCount === 1 ? "piece" : "pieces"} selected · Prices in AED</p></div>
          <button type="button" onClick={() => dispatch(clearCart())} className="inline-flex items-center gap-2 self-start rounded-xl px-3 py-2 text-xs font-semibold text-stone transition hover:bg-rose-50 hover:text-rose-700 sm:self-auto"><Trash2 className="h-3.5 w-3.5" /> Clear bag</button>
        </header>

        <div className="mt-9 grid gap-10 lg:grid-cols-12 lg:gap-14">
          <section className="space-y-4 lg:col-span-7">
            {cart.map((item) => {
              const { product } = item;
              const stock = Number(product.stock || 0);
              return <article key={product.id} className="group flex gap-4 rounded-3xl border border-white/70 bg-white/75 p-3 shadow-[0_12px_32px_rgba(38,30,104,.06)] backdrop-blur-md sm:gap-6 sm:p-4">
                <Link to={`/product/${product.id}`} className="h-28 w-24 shrink-0 overflow-hidden rounded-2xl bg-mist sm:h-32 sm:w-28"><img src={getProductImage(product)} alt={product.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /></Link>
                <div className="min-w-0 flex-1 py-1"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-primary">{product.category}</p><Link to={`/product/${product.id}`} className="mt-1 block truncate font-display text-lg font-semibold transition hover:text-primary sm:text-xl">{product.name}</Link><p className="mt-2 text-sm font-bold tabular-nums">{formatAED(product.price)}</p><div className="mt-4 flex items-center justify-between gap-3"><div className="inline-flex items-center rounded-xl border border-ink/10 bg-white"><button type="button" onClick={() => changeQuantity(item, -1)} className="p-2 text-stone transition hover:text-ink" aria-label={`Decrease ${product.name}`}><Minus className="h-4 w-4" /></button><span className="w-8 text-center text-sm font-semibold tabular-nums">{item.quantity}</span><button type="button" onClick={() => changeQuantity(item, 1)} disabled={stock > 0 && item.quantity >= stock} className="p-2 text-stone transition hover:text-ink disabled:cursor-not-allowed disabled:opacity-35" aria-label={`Increase ${product.name}`}><Plus className="h-4 w-4" /></button></div><button type="button" onClick={() => dispatch(removeFromCart({ id: product.id }))} className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone transition hover:text-rose-700"><Trash2 className="h-3.5 w-3.5" /> Remove</button></div>{stock > 0 && stock <= 5 && <p className="mt-3 text-[10px] font-bold uppercase tracking-[.1em] text-amber-700">Only {stock} left</p>}</div>
                <p className="hidden pt-2 text-sm font-bold tabular-nums sm:block">{formatAED(Number(product.price) * Number(item.quantity))}</p>
              </article>;
            })}
          </section>

          <aside className="lg:col-span-5"><div className="rounded-3xl border border-white/70 bg-white/85 p-6 shadow-[0_18px_48px_rgba(38,30,104,.1)] backdrop-blur-xl lg:sticky lg:top-24 sm:p-7"><div className="flex items-center justify-between"><h2 className="font-display text-2xl font-semibold">Order summary</h2><ShieldCheck className="h-5 w-5 text-primary" /></div>{freeDeliveryRemaining > 0 ? <div className="mt-6 rounded-2xl bg-primary/[.06] p-4"><p className="text-sm font-semibold">Add {formatAED(freeDeliveryRemaining)} for complimentary delivery.</p><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-primary/10"><div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${Math.min(100, (subtotal / 250) * 100)}%` }} /></div></div> : <div className="mt-6 flex items-center gap-2 rounded-2xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-800"><PackageCheck className="h-4 w-4" /> Complimentary UAE delivery unlocked.</div>}<div className="mt-6 space-y-3 border-b border-ink/10 pb-5 text-sm"><p className="flex justify-between text-stone"><span>Subtotal</span><span className="font-medium text-ink">{formatAED(subtotal)}</span></p><p className="flex justify-between text-stone"><span>Standard delivery</span><span className="font-medium text-ink">{delivery ? formatAED(delivery) : "Complimentary"}</span></p><p className="flex justify-between text-stone"><span>UAE VAT (5%)</span><span className="font-medium text-ink">{formatAED(vat)}</span></p></div><p className="mt-5 flex items-end justify-between"><span className="font-display text-xl font-semibold">Estimated total</span><span className="font-display text-3xl font-semibold tabular-nums">{formatAED(total)}</span></p><button type="button" onClick={beginCheckout} className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-ink px-5 py-4 text-[11px] font-bold uppercase tracking-[.17em] text-white transition hover:-translate-y-0.5 hover:bg-primary">Secure checkout <ArrowRight className="h-4 w-4" /></button><p className="mt-4 flex items-center justify-center gap-2 text-center text-[11px] leading-relaxed text-stone"><Truck className="h-3.5 w-3.5 shrink-0 text-primary" /> Delivery choice and exact address are confirmed at checkout.</p></div></aside>
        </div>
      </div>
    </main>
  );
};

export default Cart;
