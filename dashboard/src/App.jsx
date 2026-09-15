import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getUser } from "./store/slices/authSlice";
import AdminRoute from "./components/AdminRoute";
import DashboardLayout from "./components/DashboardLayout";
import Overview from "./pages/Overview";
import Products from "./pages/Products";
import Orders from "./pages/Orders";
import Users from "./pages/Users";
import Login from "./pages/Login";
import Sales from "./pages/Sales";
import Storefront from "./pages/Storefront";
import Support from "./pages/Support";
import Returns from "./pages/Returns";
import LiveUpdates from "./components/LiveUpdates";

function AuthLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-fog">
      <div className="flex flex-col items-center gap-4">
        <p className="font-display text-2xl font-semibold tracking-[0.28em]">
          LUMERA
        </p>
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
      </div>
    </div>
  );
}

function App() {
  const dispatch = useDispatch();
  const { isCheckingAuth } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(getUser());
  }, [dispatch]);

  if (isCheckingAuth) {
    return <AuthLoader />;
  }

  return (
    <BrowserRouter>
      <LiveUpdates />
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<AdminRoute />}>
          <Route element={<DashboardLayout />}>
            <Route index element={<Overview />} />
            <Route path="products" element={<Products />} />
            <Route path="orders" element={<Orders />} />
            <Route path="users" element={<Users />} />
            <Route path="sales" element={<Sales />} />
            <Route path="storefront" element={<Storefront />} />
            <Route path="support" element={<Support />} />
            <Route path="returns" element={<Returns />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
