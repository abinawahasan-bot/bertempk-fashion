import { motion } from "motion/react";
import { Link } from "react-router-dom";
import SizeGuideContent from "../components/SizeGuideContent";

/**
 * `/size-guide` — the same chart as the `SizeGuide` dialog, on its own page.
 *
 * The chart itself lives in `components/SizeGuideContent.tsx` so the dialog and
 * this page can never drift apart. This page adds navigation back to the shop
 * and nothing else.
 */
export default function SizeGuidePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:px-10">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <p className="text-[10px] uppercase tracking-[0.3em] text-acid">
          Fit guide
        </p>
        <h1 className="mt-2 font-display text-5xl text-bone sm:text-6xl">
          Size guide
        </h1>
        <p className="mt-3 max-w-prose text-sm leading-relaxed text-fog">
          Semua ukuran dalam sentimeter, diukur datar. Kalau ukuranmu di antara
          dua baris, ambil yang lebih besar.
        </p>

        <div className="mt-10">
          <SizeGuideContent />
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            to="/shop"
            className="bg-acid px-6 py-3 text-[11px] font-bold uppercase tracking-[0.18em] text-ink transition-colors hover:bg-bone"
          >
            Shop the drop
          </Link>
          <Link
            to="/orders"
            className="border border-steel px-6 py-3 text-[11px] font-bold uppercase tracking-[0.18em] text-fog transition-colors hover:border-acid hover:text-acid"
          >
            Track order
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
