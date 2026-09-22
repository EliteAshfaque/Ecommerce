import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import popupReducer from "./slices/popupSlice";
import cartReducer from "./slices/cartSlice";
import productReducer from "./slices/productSlice";
import orderReducer from "./slices/orderSlice";
import wishlistReducer from "./slices/wishlistSlice";
import storefrontReducer from "./slices/storefrontSlice";

// A cart is local to this browser and remains available after a refresh.
const loadSavedCart = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem("forma-cart") || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

// Customer-wide Redux state. Pages/components read a slice with useSelector and
// change it by dispatching an action or asynchronous thunk.
export const store = configureStore({
  reducer: {
    auth: authReducer,
    popup: popupReducer,
    cart: cartReducer,
    product: productReducer,
    order: orderReducer,
    wishlist: wishlistReducer,
    storefront: storefrontReducer,
  },
  preloadedState: { cart: { cart: loadSavedCart() } },
});

// Storage failures (private browsing/quota) must never interrupt checkout.
store.subscribe(() => {
  try {
    localStorage.setItem("forma-cart", JSON.stringify(store.getState().cart.cart));
  } catch {}
});
