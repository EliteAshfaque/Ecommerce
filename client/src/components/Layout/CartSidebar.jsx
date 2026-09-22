import { X, Plus, Minus, Trash2, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  removeFromCart,
  updateCartQuantity,
} from "../../store/slices/cartSlice";
import { toggleCart } from "../../store/slices/popupSlice";

// Global mini-cart drawer. It selects the same cart state as Cart/Payment and
// dispatches cart actions; the page route is not required to use this component.
const CartSidebar = () => {
  const dispatch = useDispatch();
  const { isCartOpen } = useSelector((state) => state.popup);
  const { cart = [] } = useSelector((state) => state.cart);

  if (!isCartOpen) return null;

  const total = cart.reduce(
    (sum, item) => sum + Number(item.product?.price || 0) * item.quantity,
    0
  );

  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // change = +1 or -1 (matches cartSlice updateCartQuantity which does +=)
  const updateQuantity = (id, change) => {
    const item = cart.find((entry) => entry.product.id === id);
    if (!item) return;

    const nextQuantity = item.quantity + change;
    if (nextQuantity <= 0) {
      dispatch(removeFromCart({ id }));
    } else {
      dispatch(updateCartQuantity({ id, quantity: change }));
    }
  };

  const closeCart = () => dispatch(toggleCart());

  const getImage = (product) => {
    if (Array.isArray(product?.images) && product.images[0]?.url) {
      return product.images[0].url;
    }
    if (typeof product?.images === "string") return product.images;
    return "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=200&q=80";
  };

  return (
    <>
      {/* Backdrop sits below the drawer (`z-40` vs `z-50`) and closes it on click.
          The opaque blur visually separates a temporary task from the page beneath. */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={closeCart}
      />

      {/* Drawer is full width on small phones but capped by max-w-md on larger screens.
          `flex-col` creates a fixed header/footer with a flexible scrolling item region. */}
      <aside className="animate-slide-in-right fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-border/10 bg-fog/95 shadow-2xl backdrop-blur-xl dark:bg-[#12151c]/96">
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-border/10 px-6 py-5">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-primary">
              Bag
            </p>
            <h2 className="mt-1 font-display text-xl font-semibold text-foreground">
              Shopping Cart
              {itemCount > 0 && (
                <span className="ml-2 text-base font-normal text-muted-foreground">
                  ({itemCount})
                </span>
              )}
            </h2>
          </div>
          <button
            type="button"
            onClick={closeCart}
            aria-label="Close cart"
            className="glass-card glow-on-hover rounded-lg p-2"
          >
            <X className="h-5 w-5 text-primary" />
          </button>
        </div>

        {/* `flex-1 overflow-y-auto` is the key layout rule: only cart lines scroll,
            while checkout total/button remain visible in the footer. */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {cart.length > 0 ? (
            <div className="space-y-4">
              {cart.map((item) => (
                <div
                  key={item.product.id}
                  className="glass-card flex gap-4 p-4"
                >
                  <img
                    src={getImage(item.product)}
                    alt={item.product.name}
                    className="h-20 w-20 object-cover"
                  />

                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-medium text-foreground">
                      {item.product.name}
                    </h3>
                    <p className="mt-1 font-semibold text-primary">
                      {Number(item.product.price || 0).toLocaleString("en-AE", { style: "currency", currency: "AED" })}
                    </p>

                    <div className="mt-3 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.product.id, -1)}
                        className="rounded-md bg-mist p-1.5 text-foreground transition hover:bg-mist/80"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-6 text-center text-sm font-medium text-foreground">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.product.id, 1)}
                        disabled={
                          Number.isFinite(Number(item.product.stock)) &&
                          item.quantity >= Number(item.product.stock)
                        }
                        className="rounded-md bg-mist p-1.5 text-foreground transition hover:bg-mist/80 disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          dispatch(removeFromCart({ id: item.product.id }))
                        }
                        className="ml-auto rounded-md p-1.5 text-red-500 transition hover:bg-red-500/10"
                        aria-label="Remove item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center px-4 py-16 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-mist">
                <ShoppingBag className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="font-display text-lg font-medium text-foreground">
                Your cart is empty
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Add something you love and it will show up here.
              </p>
              <Link
                to="/products"
                onClick={closeCart}
                className="btn-primary mt-6"
              >
                Continue Shopping
              </Link>
            </div>
          )}
        </div>

        {/* FOOTER */}
        {cart.length > 0 && (
          <div className="border-t border-border/10 px-6 py-5">
            <div className="mb-4 flex items-end justify-between">
              <span className="text-sm uppercase tracking-[0.16em] text-muted-foreground">
                Total
              </span>
              <span className="font-display text-2xl font-semibold text-primary">
                {total.toLocaleString("en-AE", { style: "currency", currency: "AED" })}
              </span>
            </div>

            <Link
              to="/payment"
              onClick={closeCart}
              className="block w-full bg-primary py-3.5 text-center text-sm font-semibold text-primary-foreground transition hover:opacity-90"
            >
              Proceed to Checkout
            </Link>
            <Link
              to="/cart"
              onClick={closeCart}
              className="mt-3 block w-full text-center text-sm text-muted-foreground transition hover:text-foreground"
            >
              View full cart
            </Link>
          </div>
        )}
      </aside>
    </>
  );
};

export default CartSidebar;
