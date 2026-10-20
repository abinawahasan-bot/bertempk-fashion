import { ArrowUpRight } from "lucide-react";
import { motion } from "motion/react";
import { imageSrcSet, imageUrl, ladderUpTo, STORY_RATIO } from "../lib/images";
import { staggerContainer } from "../lib/motion";
import { StaggerItem } from "./ScrollReveal";

const markers = [
  { n: "01", t: "Character first", d: "Every garment starts from a mood, not a trend chart." },
  { n: "02", t: "Built to last", d: "Heavy fabrics, reinforced seams, zero disposable design." },
  { n: "03", t: "No default", d: "You are not a preset. The clothes never tell you who to be." },
];

/** The atelier plate inside `aspect-[3/4]`, below the fold on Home. */
const ATELIER =
  "https://images.pexels.com/photos/1040945/pexels-photo-1040945.jpeg?auto=compress&cs=tinysrgb&w=1400&h=1800&fit=crop";

/**
 * Plate width, measured from the section grid:
 * `grid-cols-12 gap-10 px-4` (<640), `sm:px-6` (≥640) and `lg:gap-16 lg:px-10`
 * with `lg:col-span-5` (≥1024) inside `max-w-[1600px]` — 596 CSS px at most.
 */
const ATELIER_SIZES =
  "(min-width: 1024px) min(41.67vw - 71px, 596px), (min-width: 640px) calc(100vw - 48px), calc(100vw - 32px)";

/** 596 CSS px × dpr 2 = 1192, so the ladder stops at 1280. */
const ATELIER_WIDTHS = ladderUpTo(1280);

export default function Story() {
  return (
    <section
      id="story"
      className="relative scroll-mt-20 overflow-hidden border-b border-steel/40 bg-coal"
    >
      <div className="mx-auto grid max-w-[1600px] gap-10 px-4 py-16 sm:px-6 lg:grid-cols-12 lg:gap-16 lg:px-10 lg:py-24">
        {/* Left — statement */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="lg:col-span-7"
        >
          <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-acid">
            The story
          </span>
          <h2 className="mt-5 font-display text-4xl leading-[0.92] text-bone sm:text-5xl lg:text-6xl">
            We were never part
            <br />
            of the <span className="text-outline">default</span> story.
          </h2>
          <p className="mt-7 max-w-xl text-sm leading-relaxed text-fog sm:text-base">
            BERTEMPK started with a simple frustration: character-driven
            clothing felt like merchandise, while fashion often left no room for
            the person wearing it. We wanted the in-between — garments that are
            not just wearables, but a tool for self-expression.
          </p>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="mt-10 grid gap-px overflow-hidden border border-steel/40 bg-steel/40 sm:grid-cols-3"
          >
            {markers.map((m) => (
              <StaggerItem key={m.n} className="bg-coal p-5">
                <span className="font-display text-2xl text-acid">{m.n}</span>
                <p className="mt-3 text-sm font-semibold uppercase tracking-wide text-bone">
                  {m.t}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-fog">{m.d}</p>
              </StaggerItem>
            ))}
          </motion.div>
        </motion.div>

        {/* Right — image + CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          className="lg:col-span-5"
        >
          <div className="relative aspect-[3/4] w-full overflow-hidden bg-smoke">
            <img
              src={imageUrl(ATELIER, 640)}
              srcSet={imageSrcSet(ATELIER, ATELIER_WIDTHS, STORY_RATIO)}
              sizes={ATELIER_SIZES}
              alt="BERTEMPK atelier"
              className="h-full w-full object-cover grayscale contrast-125 transition-transform duration-[1.2s] ease-out hover:scale-105"
              loading="lazy"
              decoding="async"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-transparent" />
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-5">
              <p className="max-w-[14rem] font-display text-2xl leading-none text-bone">
                Wear your version.
                <br />
                <span className="text-acid">No default.</span>
              </p>
              <a
                href="#signal"
                className="group inline-flex items-center gap-2 bg-bone px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.18em] text-ink transition-colors hover:bg-acid"
              >
                Join us
                <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
