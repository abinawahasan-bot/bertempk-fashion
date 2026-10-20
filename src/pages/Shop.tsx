import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import ProductCard from "../components/ProductCard";
import { products } from "../constants/products";
import { cn } from "../lib/utils";

const categories = ["All", "New Crop", "Hoodie", "Trousers", "Outerwear"];

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get("category") ?? "All";
  const sortByNew = searchParams.get("sort") === "new";
  // The URL is the source of truth for the query, so a search coming from the
  // navbar (`/shop?q=hoodie`) is shareable and survives a reload.
  const query = searchParams.get("q") ?? "";

  const setQuery = (q: string) => {
    const next = new URLSearchParams(searchParams);
    if (q.trim()) next.set("q", q);
    else next.delete("q");
    setSearchParams(next, { replace: true });
  };

  const filtered = useMemo(() => {
    let list = [...products];
    if (activeCategory !== "All") {
      list = list.filter((p) => p.category === activeCategory);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      );
    }
    if (sortByNew) {
      list = list.sort((a, b) => Number(b.isNew ?? false) - Number(a.isNew ?? false));
    }
    return list;
  }, [activeCategory, query, sortByNew]);

  const selectCategory = (cat: string) => {
    const next = new URLSearchParams(searchParams);
    if (cat === "All") next.delete("category");
    else next.set("category", cat);
    setSearchParams(next);
  };

  return (
    <section className="mx-auto max-w-[1600px] px-4 py-12 sm:px-6 sm:py-16 lg:px-10">
      <div className="mb-10 border-b border-steel/40 pb-8">
        <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-acid">
          The archive
        </span>
        <h1 className="mt-3 font-display text-4xl leading-[0.9] text-bone sm:text-5xl lg:text-6xl">
          Shop all
        </h1>
        <p className="mt-4 max-w-lg text-sm text-fog sm:text-base">
          Technical streetwear built for the in-between. Filter by category or
          search directly.
        </p>
      </div>

      {/* Toolbar */}
      <div className="mb-8 flex flex-col gap-4 border-b border-steel/40 pb-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => selectCategory(cat)}
              className={cn(
                "border px-4 py-2 text-[11px] font-bold uppercase tracking-[0.15em] transition-colors",
                activeCategory === cat
                  ? "border-acid bg-acid text-ink"
                  : "border-steel text-fog hover:border-bone hover:text-bone"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full lg:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ash" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products..."
            className="w-full border border-steel bg-coal py-3 pl-10 pr-4 text-sm text-bone placeholder:text-ash focus:border-acid focus:outline-none"
          />
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-24 text-center">
          <p className="font-display text-2xl text-bone">Nothing found</p>
          <p className="text-sm text-fog">
            Try a different filter or keyword.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {filtered.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </div>
      )}

      <p className="mt-10 text-[11px] uppercase tracking-[0.2em] text-ash">
        Showing {filtered.length} {filtered.length === 1 ? "piece" : "pieces"}
      </p>
    </section>
  );
}
