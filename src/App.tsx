import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, lazy, Suspense } from "react";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Shop from "./pages/Shop";
import Wishlist from "./pages/Wishlist";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import OrderConfirmation from "./pages/OrderConfirmation";
import SizeGuidePage from "./pages/SizeGuide";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Admin from "./pages/Admin";
import { useAuthStore } from "./store/auth";

// Lazy-load heavy 3D pages to keep the initial bundle small.
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const OutfitBuilder = lazy(() => import("./pages/OutfitBuilder"));

function App() {
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/product/:id" element={<Suspense fallback={<div className="p-10 text-fog">Loading…</div>}><ProductDetail /></Suspense>} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/outfit" element={<Suspense fallback={<div className="p-10 text-fog">Loading…</div>}><OutfitBuilder /></Suspense>} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/orders/:id" element={<OrderConfirmation />} />
          <Route path="/size-guide" element={<SizeGuidePage />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
