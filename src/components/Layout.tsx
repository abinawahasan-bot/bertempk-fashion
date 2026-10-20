import { Outlet } from "react-router-dom";
import { Toaster } from "sonner";
import Navbar from "./Navbar";
import Footer from "./Footer";
import CartDrawer from "./CartDrawer";
import FittingRoom from "./FittingRoom";
import AuthModal from "./AuthModal";
import ScrollToHash from "./ScrollToHash";

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-ink text-bone">
      <ScrollToHash />
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <CartDrawer />
      <FittingRoom />
      <AuthModal />
      <Toaster
        position="bottom-right"
        theme="dark"
        toastOptions={{
          style: {
            borderRadius: "0px",
            border: "1px solid #343434",
            background: "#0b0b0b",
            color: "#ededeb",
          },
        }}
      />
    </div>
  );
}
