import { createSlice } from "@reduxjs/toolkit";

const CART_STORAGE_KEY = "lumera-cart-v1";

// STEP 1: Restore only a previously chosen bag; credentials and payments are never stored here.
const loadSavedCart = () => {
  if (typeof window === "undefined") return [];
  try {
    const saved = JSON.parse(window.localStorage.getItem(CART_STORAGE_KEY) || "[]");
    return Array.isArray(saved) ? saved.filter((item) => item?.product?.id && Number(item.quantity) > 0) : [];
  } catch {
    return [];
  }
};

// STEP 2: Keep the bag available after a refresh without changing the server-side order source of truth.
const saveCart = (cart) => {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart)); } catch { /* Storage can be unavailable in private browsing. */ }
};

/**
 * CART SLICE
 * ----------
 * This file stores shopping-cart data in Redux.
 *
 * Example of one cart item in state.cart:
 * {
 *   product: {
 *     id: "uuid-123",
 *     name: "iPhone 15",
 *     price: 999,
 *     images: [{ url: "https://..." }]
 *   },
 *   quantity: 2
 * }
 */
// Shared bag state used by Navbar, CartSidebar, Cart page and Payment page.
// The local copy helps a customer keep a bag after refresh; checkout revalidates server data.
const cartSlice = createSlice({
  // Unique name for this slice in the Redux store
  // You will read it later as: state.cart
  name: "cart",

  // Starting value when the app first loads
  // cart: [] means the basket is empty at the beginning
  initialState: {
    cart: loadSavedCart(),
  },

  // Reducers = functions that update the cart state
  reducers: {
    /**
     * addToCart
     * ---------
     * Adds a product to the cart.
     * If the product already exists, it increases quantity.
     *
     * How to dispatch (example):
     * dispatch(addToCart({
     *   product: { id: "1", name: "Shoes", price: 80 },
     *   quantity: 1
     * }));
     *
     * action.payload shape:
     * {
     *   product: { id, name, price, ... },
     *   quantity: number
     * }
     */
    addToCart(state, action) {
      // Destructure the values sent from the UI
      const { product, quantity } = action.payload;

      // Check if this product is already in the cart
      const existingItem = state.cart.find(
        (item) => item.product.id === product.id
      );

      const requestedQuantity = Math.max(1, Number(quantity) || 1);
      const maxQuantity = Number(product.stock);

      // Do not create an impossible cart line for a product the API marks sold out.
      if (Number.isFinite(maxQuantity) && maxQuantity <= 0) return;

      if (existingItem) {
        // Example: cart already has iPhone qty 1
        // User adds qty 2 more → becomes qty 3
        existingItem.quantity = Number.isFinite(maxQuantity)
          ? Math.min(existingItem.quantity + requestedQuantity, maxQuantity)
          : existingItem.quantity + requestedQuantity;
      } else {
        // Product is new → push a new cart item object
        // Example result:
        // state.cart = [{ product: {...}, quantity: 1 }]
        state.cart.push({
          product,
          quantity: Number.isFinite(maxQuantity)
            ? Math.min(requestedQuantity, Math.max(1, maxQuantity))
            : requestedQuantity,
        });
      }
      saveCart(state.cart);
    },

    /**
     * removeFromCart
     * --------------
     * Removes one product completely from the cart.
     *
     * How to dispatch (example):
     * dispatch(removeFromCart({ id: "uuid-123" }));
     *
     * action.payload shape:
     * { id: "product-id-to-remove" }
     */
    removeFromCart(state, action) {
      // Keep only items whose product id is NOT the one we want to remove
      // Example: remove id "1" from [{id:1}, {id:2}] → [{id:2}]
      state.cart = state.cart.filter(
        (item) => item.product.id !== action.payload.id
      );
      saveCart(state.cart);
    },

    /**
     * updateCartQuantity
     * ------------------
     * Changes quantity of an existing cart item.
     * Usually used with +1 or -1 buttons.
     *
     * How to dispatch (example):
     * dispatch(updateCartQuantity({ id: "uuid-123", quantity: 1 }));  // increase
     * dispatch(updateCartQuantity({ id: "uuid-123", quantity: -1 })); // decrease
     *
     * action.payload shape:
     * {
     *   id: "product-id",
     *   quantity: number   // can be positive or negative
     * }
     */
    updateCartQuantity(state, action) {
      // Find the product in cart by id
      const item = state.cart.find(
        (item) => item.product.id === action.payload.id
      );

      // Only update if the item exists
      if (item) {
        // Example: current qty 2, payload.quantity = 1 → becomes 3
        const nextQuantity = item.quantity + Number(action.payload.quantity || 0);
        const maxQuantity = Number(item.product.stock);
        item.quantity = Number.isFinite(maxQuantity)
          ? Math.min(nextQuantity, maxQuantity)
          : nextQuantity;
        saveCart(state.cart);
      }
    },

    /**
     * clearCart
     * ---------
     * Empties the whole cart (useful after successful checkout/payment).
     *
     * How to dispatch (example):
     * dispatch(clearCart());
     *
     * No payload needed.
     */
    clearCart(state) {
      // Reset cart back to an empty array
      state.cart = [];
      saveCart(state.cart);
    },
  },
});

// Export actions so components can dispatch them
// Example import:
// import { addToCart, removeFromCart } from "../store/slices/cartSlice";
export const { addToCart, removeFromCart, updateCartQuantity, clearCart } =
  cartSlice.actions;

// Export reducer so store.js can register it
// Example in store:
// cart: cartReducer
export default cartSlice.reducer;
