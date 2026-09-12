import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { realtimeSocket } from "../lib/realtime";
import {
  fetchAdminOrders,
  fetchAdminProducts,
  fetchAdminPromotions,
  fetchAdminUsers,
  fetchDashboardStats,
} from "../store/slices/adminSlice";

// Admin rooms receive operational changes as they happen in the storefront.
const LiveUpdates = () => {
  const dispatch = useDispatch();
  const userId = useSelector((state) => state.auth.authUser?.id);
  const productPage = useSelector((state) => state.admin.productsPage);
  const userPage = useSelector((state) => state.admin.usersPage);
  const pagesRef = useRef({ productPage, userPage });
  const socketUserRef = useRef();

  useEffect(() => {
    pagesRef.current = { productPage, userPage };
  }, [productPage, userPage]);

  useEffect(() => {
    const refreshOrderData = () => {
      dispatch(fetchAdminOrders());
      dispatch(fetchDashboardStats());
    };
    const refreshAdminData = ({ resource }) => {
      if (resource === "catalogue") dispatch(fetchAdminProducts(pagesRef.current.productPage));
      if (resource === "users") dispatch(fetchAdminUsers(pagesRef.current.userPage));
      if (resource === "promotions") dispatch(fetchAdminPromotions());
      if (resource === "dashboard") refreshOrderData();
    };

    // Keep the first development handshake alive through Strict Mode's effect check.
    if (socketUserRef.current !== undefined && socketUserRef.current !== userId) {
      realtimeSocket.disconnect();
    }
    socketUserRef.current = userId;
    realtimeSocket.on("order:changed", refreshOrderData);
    realtimeSocket.on("admin:changed", refreshAdminData);
    realtimeSocket.connect();

    return () => {
      realtimeSocket.off("order:changed", refreshOrderData);
      realtimeSocket.off("admin:changed", refreshAdminData);
    };
  }, [dispatch, userId]);

  return null;
};

export default LiveUpdates;
