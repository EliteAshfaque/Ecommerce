import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getUser } from "./store/slices/authSlice";
import { fetchProducts } from "./store/slices/productSlice";
import { fetchStorefront } from "./store/slices/storefrontSlice";

import Navbar from "./components/Layout/Navbar";
import Sidebar from "./components/Layout/Sidebar";
import SearchOverlay from "./components/Layout/SearchOverlay";
import CartSidebar from "./components/Layout/CartSidebar";
import ProfilePanel from "./components/Layout/ProfilePanel";
import LoginModal from "./components/Layout/LoginModal";
import AISearchModal from "./components/Products/AISearchModal";
import Footer from "./components/Layout/Footer";
import LiveUpdates from "./components/LiveUpdates";
import DeliveryAddressPrompt from "./components/Account/DeliveryAddressPrompt";

import Index from "./pages/Home";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Orders from "./pages/Orders";
import Payment from "./pages/Payment";
import About from "./pages/About";
import FAQ from "./pages/FAQ";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";
import Favourites from "./pages/Favourites";

function AuthLoader() {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-fog dark:bg-[#0c0e12]">
      <div className="ambient-orb left-1/4 top-1/3 h-56 w-56 animate-drift opacity-70" />
      <div
        className="ambient-orb bottom-1/4 right-1/4 h-64 w-64 opacity-50"
        style={{ animationDelay: "1.5s" }}
      />

      <div className="relative z-10 flex flex-col items-center gap-6">
        <p className="font-display text-3xl font-semibold tracking-[0.35em] text-primary">
          LUMERA
        </p>

        <div className="relative h-12 w-12">
          <div className="absolute inset-0 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
          <div className="absolute inset-2 animate-spin rounded-full border border-primary/10 border-b-primary/60 [animation-direction:reverse] [animation-duration:1.2s]" />
        </div>

        <p className="animate-fade-in text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
          Verifying session
        </p>
      </div>
    </div>
  );
}

function App() {
  const dispatch = useDispatch();
  const { isCheckingAuth } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(getUser());
    dispatch(fetchProducts());
    dispatch(fetchStorefront());
  }, [dispatch]);

  if (isCheckingAuth) {
    return <AuthLoader />;
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-fog text-ink transition-colors">
        <Navbar />
        <Sidebar />
        <SearchOverlay />
        <CartSidebar />
        <ProfilePanel />
        <LoginModal />
        <AISearchModal />
        <LiveUpdates />
        <DeliveryAddressPrompt />

        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/password/reset/:token" element={<Index />} />
          <Route path="/products" element={<Products />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/favourites" element={<Favourites />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/payment" element={<Payment />} />
          <Route path="/about" element={<About />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="*" element={<NotFound />} />
        </Routes>

        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
