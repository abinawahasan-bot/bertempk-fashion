import { Search, Heart, ShoppingBag, Menu, X, LogOut, User } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";
import type { FormEvent } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { cn } from "../lib/utils";
import { useCartStore } from "../store/cart";
import { useWishlistStore } from "../store/wishlist";
import { useUIStore } from "../store/ui";
import { useFittingStore } from "../store/fitting";
import { useAuthStore } from "../store/auth";
import { toast } from "sonner";
import HangerIcon from "./HangerIcon";

const navLinks = [
  { label: "Home", to: "/" },
  { label: "Shop", to: "/shop" },
  { label: "Outfit Builder", to: "/outfit" },
  { label: "New Drop", to: "/shop?sort=new" },
  { label: "Story", to: "/#story" },
  { label: "Contact", to: "/#contact" },
];

/** Search routes to the shop page with the term in the URL, so it is shareable. */
function shopSearchPath(value: string): string {
  const q = value.trim();
  return q ? `/shop?q=${encodeURIComponent(q)}` : "/shop";
}

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopQuery, setDesktopQuery] = useState("");
  const [mobileQuery, setMobileQuery] = useState("");
  const navigate = useNavigate();
  const totalItems = useCartStore((s) => s.items.reduce((n, i) => n + i.quantity, 0));
  const wishCount = useWishlistStore((s) => s.items.length);
  const openCart = useUIStore((s) => s.openCart);
  const openAuthModal = useUIStore((s) => s.openAuthModal);
  const picksCount = useFittingStore((s) => s.picks.length);
  const openRoom = useFittingStore((s) => s.openRoom);
  const { user, signOut } = useAuthStore();

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out");
  };

  const submitSearch = (
    e: FormEvent<HTMLFormElement>,
    value: string,
    reset: () => void
  ) => {
    e.preventDefault();
    navigate(shopSearchPath(value));
    reset();
    setMobileOpen(false);
  };

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="sticky top-0 z-40 border-b border-steel/40 bg-ink/85 backdrop-blur-md supports-[backdrop-filter]:bg-ink/70"
    >
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-10">
        <div className="flex items-center gap-10">
          <Link to="/" className="group flex items-center gap-2">
            <span className="h-2.5 w-2.5 shrink-0 bg-acid transition-transform duration-300 group-hover:rotate-45" />
            <span className="font-display text-2xl leading-none tracking-tight text-bone sm:text-[28px]">
              BERTEMPK
            </span>
          </Link>

          <nav className="hidden items-center gap-7 lg:flex">
            {navLinks.map((link, i) => (
              <motion.div
                key={link.label}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05, duration: 0.3 }}
              >
                <NavLink
                  to={link.to}
                  className={({ isActive }) =>
                    cn(
                      "group relative text-[11px] font-semibold uppercase tracking-[0.18em] transition-colors",
                      isActive ? "text-bone" : "text-fog hover:text-bone"
                    )
                  }
                >
                  {link.label}
                  <span className="absolute -bottom-1.5 left-0 h-px w-0 bg-acid transition-all duration-300 group-hover:w-full" />
                </NavLink>
              </motion.div>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <form
            onSubmit={(e) =>
              submitSearch(e, desktopQuery, () => setDesktopQuery(""))
            }
            role="search"
            className="hidden items-center border border-steel bg-ink/60 focus-within:border-acid sm:flex"
          >
            <label htmlFor="site-search" className="sr-only">
              Search products
            </label>
            <input
              id="site-search"
              type="search"
              value={desktopQuery}
              onChange={(e) => setDesktopQuery(e.target.value)}
              placeholder="Search"
              className="w-32 bg-transparent py-2 pl-3 pr-2 text-sm text-bone placeholder:text-ash focus:outline-none lg:w-44"
            />
            <button
              type="submit"
              aria-label="Search"
              className="p-2.5 text-fog transition-colors hover:bg-smoke hover:text-bone focus:outline-none focus-visible:ring-2 focus-visible:ring-acid/40"
            >
              <Search className="h-[18px] w-[18px]" />
            </button>
          </form>

          <button
            onClick={openRoom}
            aria-label="Open fitting room"
            className="relative p-2.5 text-fog transition-colors hover:bg-smoke hover:text-bone focus:outline-none focus-visible:ring-2 focus-visible:ring-acid/40"
          >
            <HangerIcon className="h-[18px] w-[18px]" />
            {picksCount > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-acid px-1 text-[10px] font-bold text-ink">
                {picksCount}
              </span>
            )}
          </button>

          <Link
            to="/wishlist"
            aria-label="Wishlist"
            className="relative hidden p-2.5 text-fog transition-colors hover:bg-smoke hover:text-bone focus:outline-none focus-visible:ring-2 focus-visible:ring-acid/40 sm:inline-flex"
          >
            <Heart className="h-[18px] w-[18px]" />
            {wishCount > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-acid px-1 text-[10px] font-bold text-ink">
                {wishCount}
              </span>
            )}
          </Link>

          <button
            onClick={openCart}
            aria-label="Shopping cart"
            className="relative p-2.5 text-fog transition-colors hover:bg-smoke hover:text-bone focus:outline-none focus-visible:ring-2 focus-visible:ring-acid/40"
          >
            <ShoppingBag className="h-[18px] w-[18px]" />
            {totalItems > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-acid px-1 text-[10px] font-bold text-ink">
                {totalItems}
              </span>
            )}
          </button>

          {user ? (
            <div className="ml-1 hidden items-center gap-2 sm:inline-flex">
              <Link
                to="/orders"
                className="flex items-center gap-2 border border-steel px-3 py-2 text-fog transition-colors hover:border-acid hover:text-bone"
              >
                <User className="h-3.5 w-3.5 text-acid" />
                <span className="max-w-28 truncate text-[11px] font-semibold uppercase tracking-[0.12em]">
                  {user.user_metadata?.full_name ?? user.email?.split("@")[0]}
                </span>
              </Link>
              <button
                onClick={handleSignOut}
                aria-label="Sign out"
                className="p-2.5 text-fog transition-colors hover:bg-smoke hover:text-signal"
              >
                <LogOut className="h-[18px] w-[18px]" />
              </button>
            </div>
          ) : (
            <button
              onClick={openAuthModal}
              className="ml-1 hidden items-center gap-2 rounded-none border border-bone bg-bone px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.18em] text-ink transition-colors hover:bg-acid hover:border-acid focus:outline-none focus-visible:ring-2 focus-visible:ring-acid/40 sm:inline-flex"
            >
              Sign In
            </button>
          )}

          <button
            aria-label="Open menu"
            onClick={() => setMobileOpen((v) => !v)}
            className="inline-flex p-2.5 text-bone transition-colors hover:bg-smoke focus:outline-none focus-visible:ring-2 focus-visible:ring-acid/40 lg:hidden"
          >
            {mobileOpen ? <X className="h-[18px] w-[18px]" /> : <Menu className="h-[18px] w-[18px]" />}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="overflow-hidden border-t border-steel/40 bg-ink lg:hidden"
          >
            <div className="space-y-1 px-4 py-4 sm:px-6">
              {navLinks.map((link) => (
                <NavLink
                  key={link.label}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "block px-3 py-3 font-display text-2xl transition-colors",
                      isActive ? "text-acid" : "text-bone hover:text-acid"
                    )
                  }
                >
                  {link.label}
                </NavLink>
              ))}

              {/* Search + the destinations the desktop icons own — without
                  these, /wishlist and /orders are unreachable on mobile. */}
              <form
                onSubmit={(e) =>
                  submitSearch(e, mobileQuery, () => setMobileQuery(""))
                }
                role="search"
                className="mt-3 flex items-center border border-steel px-1"
              >
                <label htmlFor="mobile-search" className="sr-only">
                  Search products
                </label>
                <input
                  id="mobile-search"
                  type="search"
                  value={mobileQuery}
                  onChange={(e) => setMobileQuery(e.target.value)}
                  placeholder="Search the drop..."
                  className="w-full bg-transparent px-3 py-3 text-sm text-bone placeholder:text-ash focus:outline-none"
                />
                <button
                  type="submit"
                  aria-label="Search"
                  className="p-3 text-fog transition-colors hover:text-bone focus:outline-none focus-visible:ring-2 focus-visible:ring-acid/40"
                >
                  <Search className="h-[18px] w-[18px]" />
                </button>
              </form>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <Link
                  to="/wishlist"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center gap-2 border border-steel px-4 py-3 text-[11px] font-bold uppercase tracking-[0.15em] text-fog transition-colors hover:border-bone hover:text-bone"
                >
                  <Heart className="h-3.5 w-3.5" />
                  Wishlist
                  {wishCount > 0 && <span className="text-acid">{wishCount}</span>}
                </Link>
                <Link
                  to="/orders"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center gap-2 border border-steel px-4 py-3 text-[11px] font-bold uppercase tracking-[0.15em] text-fog transition-colors hover:border-bone hover:text-bone"
                >
                  <ShoppingBag className="h-3.5 w-3.5" />
                  Orders
                </Link>
                {user && (
                  <Link
                    to="/orders"
                    onClick={() => setMobileOpen(false)}
                    className="col-span-2 flex items-center justify-center gap-2 border border-steel px-4 py-3 text-[11px] font-bold uppercase tracking-[0.15em] text-fog transition-colors hover:border-bone hover:text-bone"
                  >
                    <User className="h-3.5 w-3.5 text-acid" />
                    <span className="max-w-40 truncate">
                      Account ·{" "}
                      {user.user_metadata?.full_name ?? user.email?.split("@")[0]}
                    </span>
                  </Link>
                )}
              </div>

              {user ? (
                <button
                  onClick={handleSignOut}
                  className="mt-3 flex w-full items-center justify-center gap-2 border border-steel px-5 py-3 text-[11px] font-bold uppercase tracking-[0.18em] text-fog hover:border-signal hover:text-signal"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign Out
                </button>
              ) : (
                <button
                  onClick={() => {
                    openAuthModal();
                    setMobileOpen(false);
                  }}
                  className="mt-3 w-full bg-acid px-5 py-3 text-[11px] font-bold uppercase tracking-[0.18em] text-ink"
                >
                  Sign In
                </button>
              )}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
