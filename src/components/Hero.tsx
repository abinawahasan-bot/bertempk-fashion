import { Suspense, lazy } from "react";
import { ArrowUpRight, ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import { Link } from "react-router-dom";

import { imageSrcSet, imageUrl, ladderUpTo } from "../lib/images";
import VideoGarment from "./VideoGarment";

/**
 * Backdrop plate: full-bleed (`absolute inset-0`, `h-full w-full`), so
 * `sizes` is the viewport width. It renders at 25% opacity in grayscale behind
 * a gradient, which is why the ladder still tops out at the 1600 px master
 * (a 4K display gets the real thing) while a 390 px phone settles on 960 px
 * ≈ 238 kB instead of the 856 kB it used to fetch.
 *
 * Width only: `object-cover` owns the crop, so the source keeps its aspect.
 */
const BACKDROP =
  "https://images.pexels.com/photos/38909731/pexels-photo-38909731.jpeg?auto=compress&cs=tinysrgb&w=1600";
const BACKDROP_SIZES = "100vw";
const BACKDROP_WIDTHS = ladderUpTo(1600);

// three.js is heavy — load the 3D turntable as its own chunk, after first paint.
const GarmentTurntable = lazy(() => import("./GarmentTurntable"));

/**
 * Hero garment source:
 *  - "video": the real hoodie recording (public/hoodie.mp4) — default.
 *  - "3d":    the interactive three.js turntable (procedural hoodie / GLB).
 */
const GARMENT_MODE: "video" | "3d" = "video";

/**
 * Hero — reference: Bajuku.mp4 (video hero shows a garment that animates).
 * NOTE: the moving-jacket (3D turntable) hero element is specified by the
 * animation study and must be built from a DERIVED asset — not by dropping the
 * raw reference photos into the page.
 */
export default function Hero() {
  return (
    <section className="relative isolate overflow-hidden border-b border-steel/40 bg-ink">
      {/* Backdrop */}
      <div className="absolute inset-0">
        <img
          src={imageUrl(BACKDROP, 960)}
          srcSet={imageSrcSet(BACKDROP, BACKDROP_WIDTHS)}
          sizes={BACKDROP_SIZES}
          alt=""
          className="h-full w-full object-cover opacity-25 grayscale contrast-125"
          fetchPriority="high"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/70 via-ink/85 to-ink" />
        <div className="absolute left-1/2 top-[46%] h-[70vh] w-[70vh] -translate-x-1/2 -translate-y-1/2 rounded-full bg-acid/10 blur-[120px]" />
      </div>

      {/* Rotating garment — the "moving jacket" from the reference video (t≈0–1.5s) */}
      {GARMENT_MODE === "video" ? (
        <VideoGarment />
      ) : (
        <div className="pointer-events-none absolute inset-0 z-0 opacity-95">
          <Suspense fallback={null}>
            <GarmentTurntable />
          </Suspense>
        </div>
      )}

      <div className="relative z-10 mx-auto flex min-h-[100vh] max-w-[1200px] flex-col items-center justify-between gap-8 px-4 pt-20 pb-20 text-center sm:px-6 lg:pt-24 lg:pb-28">
        {/* Top — eyebrow + wordmark */}
        <div className="flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-fog"
          >
            <span className="text-acid">● Live</span>
            <span>Cyber streetwear</span>
            <span className="text-steel">/</span>
            <span>No default</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.7, ease: "easeOut" }}
            className="mt-4 font-display text-[13vw] leading-[0.82] text-bone sm:text-[9vw] lg:text-[4.5rem] xl:text-[5.5rem]"
          >
            BERTEMPK<span className="text-acid">.</span>
          </motion.h1>
        </div>

        {/* Middle — tagline */}
        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.7, ease: "easeOut" }}
          className="max-w-2xl font-display text-2xl leading-[1.05] text-bone sm:text-3xl lg:text-4xl"
        >
          Wear your <span className="text-acid">version</span>.
          <br className="hidden sm:block" /> No default.
        </motion.p>

        {/* Bottom — CTA + stat rail */}
        <div className="flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="flex flex-wrap items-center justify-center gap-3"
          >
            <Link
              to="/shop"
              className="group inline-flex items-center gap-2 bg-acid px-7 py-3.5 text-[11px] font-bold uppercase tracking-[0.18em] text-ink transition-colors hover:bg-bone"
            >
              Shop alt skin
              <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
            <Link
              to="/#story"
              className="group inline-flex items-center gap-2 border border-steel px-7 py-3.5 text-[11px] font-bold uppercase tracking-[0.18em] text-bone transition-colors hover:border-bone"
            >
              Read the story
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45, duration: 0.6 }}
            className="mt-10 flex items-center justify-center gap-8 sm:gap-12"
          >
            {[
              { k: "SS26", v: "Season" },
              { k: "001", v: "Drop" },
              { k: "OFF", v: "The grid" },
            ].map((s) => (
              <div key={s.v} className="text-center">
                <p className="font-display text-2xl leading-none text-bone sm:text-3xl">
                  {s.k}
                </p>
                <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.2em] text-fog">
                  {s.v}
                </p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
