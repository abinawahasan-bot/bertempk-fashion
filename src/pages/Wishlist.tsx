import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { useWishlistStore } from "../store/wishlist";
import { formatIDR } from "../lib/money";

export default function Wishlist() {
  const { items, remove } = useWishlistStore();

  return (
    <section className="mx-auto max-w-[1600px] px-4 py-12 sm:px-6 sm:py-16 lg:px-10">
      <div className="mb-10 border-b border-steel/40 pb-8">
        <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-acid">
          Saved
        </span>
        <h1 className="mt-3 font-display text-4xl leading-[0.9] text-bone sm:text-5xl lg:text-6xl">
          Wishlist
        </h1>
        <p className="mt-4 max-w-lg text-sm text-fog sm:text-base">
          Pieces you've marked. They won't stay in stock forever.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
          <div className="border border-steel/50 p-6">
            <Heart className="h-8 w-8 text-fog" />
          </div>
          <div>
            <p className="font-display text-2xl text-bone">Nothing saved yet</p>
            <p className="mt-1 text-sm text-fog">
              Tap the heart on any piece to keep it here.
            </p>
          </div>
          <Link
            to="/shop"
            className="bg-acid px-6 py-3 text-[11px] font-bold uppercase tracking-[0.18em] text-ink transition-colors hover:bg-bone"
          >
            Browse the drop
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {items.map((product) => (
            <div
              key={product.id}
              className="group flex flex-col border border-steel/40 bg-coal"
            >
              <Link
                to={`/product/${product.id}`}
                className="relative aspect-4/5 overflow-hidden bg-smoke"
              >
                <img
                  src={product.image}
                  alt={product.name}
                  className="h-full w-full object-cover grayscale contrast-125 transition-transform duration-700 group-hover:scale-105"
                />
              </Link>
              <div className="flex flex-1 flex-col p-4">
                <span className="text-[10px] uppercase tracking-[0.2em] text-fog">
                  {product.category}
                </span>
                <Link
                  to={`/product/${product.id}`}
                  className="mt-1 truncate font-display text-base text-bone transition-colors group-hover:text-acid"
                >
                  {product.name}
                </Link>
                <span className="mt-1 text-sm font-semibold text-acid">
                  {formatIDR(product.price)}
                </span>

                <div className="mt-4 flex items-center gap-2">
                  {/* A size is required before a piece can be bagged, so the
                      action goes to the product page instead of adding blind. */}
                  <Link
                    to={`/product/${product.id}`}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 bg-bone px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.15em] text-ink transition-colors hover:bg-acid"
                  >
                    Pilih ukuran
                  </Link>
                  <button
                    aria-label="Remove"
                    onClick={() => {
                      remove(product.id);
                      toast("Removed from wishlist");
                    }}
                    className="border border-steel p-2.5 text-fog transition-colors hover:border-acid hover:text-acid"
                  >
                    <Heart className="h-3.5 w-3.5 fill-current" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
