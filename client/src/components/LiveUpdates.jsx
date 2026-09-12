import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { realtimeSocket } from "../lib/realtime";
import { fetchProductDetails, fetchProducts } from "../store/slices/productSlice";
import { fetchMyOrders } from "../store/slices/orderSlice";
import { fetchWishlist, clearWishlist } from "../store/slices/wishlistSlice";
import { fetchStorefront } from "../store/slices/storefrontSlice";

// Keeps visible storefront data current without polling the API.
const LiveUpdates = () => {
  const dispatch = useDispatch();
  const userId = useSelector((state) => state.auth.authUser?.id);
  const currentProductId = useSelector((state) => state.product.product?.id);
  const activeFilters = useSelector((state) => state.product.activeFilters);
  const productIdRef = useRef(currentProductId);
  const filtersRef = useRef(activeFilters);
  const socketUserRef = useRef();

  useEffect(() => {
    productIdRef.current = currentProductId;
  }, [currentProductId]);

  useEffect(() => {
    filtersRef.current = activeFilters;
  }, [activeFilters]);

  useEffect(() => {
    const refreshCatalogue = ({ productId }) => {
      dispatch(fetchProducts(filtersRef.current));
      const visibleProductId = productIdRef.current;
      if (visibleProductId && (!productId || productId === visibleProductId)) {
        dispatch(fetchProductDetails(visibleProductId));
      }
    };
    const refreshOrders = () => {
      if (userId) dispatch(fetchMyOrders());
    };

    // React Strict Mode reruns effects in development. Do not close an in-flight
    // handshake during that check; reconnect only when authentication changes.
    if (socketUserRef.current !== undefined && socketUserRef.current !== userId) {
      realtimeSocket.disconnect();
    }
    socketUserRef.current = userId;
    realtimeSocket.on("catalogue:changed", refreshCatalogue);
    realtimeSocket.on("order:changed", refreshOrders);
    realtimeSocket.on("storefront:changed", () => dispatch(fetchStorefront()));
    if (userId) dispatch(fetchWishlist());
    else dispatch(clearWishlist());
    realtimeSocket.connect();

    return () => {
      realtimeSocket.off("catalogue:changed", refreshCatalogue);
      realtimeSocket.off("order:changed", refreshOrders);
      realtimeSocket.off("storefront:changed");
    };
  }, [dispatch, userId]);

  return null;
};

export default LiveUpdates;
