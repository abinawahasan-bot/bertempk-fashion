import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, RotateCcw, Sparkles } from "lucide-react";
import { colorsFor, resolveFit, SIZES } from "../constants/fit";
import { DRESSING_MS, useFittingStore } from "../store/fitting";
import { cn } from "../lib/utils";
import HangerIcon from "./HangerIcon";
import Mannequin from "./Mannequin";
import type { Gender } from "../types";

const BODIES: Gender[] = ["male", "female"];

export default function FittingRoom() {
  const open = useFittingStore((s) => s.open);
  const gender = useFittingStore((s) => s.gender);
  const picks = useFittingStore((s) => s.picks);
  const colors = useFittingStore((s) => s.colors);
  const sizes = useFittingStore((s) => s.sizes);
  const setGender = useFittingStore((s) => s.setGender);
  const setColor = useFittingStore((s) => s.setColor);
  const setSize = useFittingStore((s) => s.setSize);
  const status = useFittingStore((s) => s.status);
  const closeRoom = useFittingStore((s) => s.closeRoom);
  const removePick = useFittingStore((s) => s.removePick);
  const startOver = useFittingStore((s) => s.startOver);
  const settle = useFittingStore((s) => s.settle);

  const closeRef = useRef<HTMLButtonElement>(null);
  const dressing = status === "dressing";
  const topPick = picks[picks.length - 1];
  const swatches = topPick ? colorsFor(topPick) : [];
  const activeSwatch = topPick ? colors[topPick.id] ?? 0 : 0;
  const activeSize = topPick ? sizes[topPick.id] ?? "" : "";

  // The "photo is being made for you" beat, then the piece settles.
  useEffect(() => {
    if (!dressing) return;
    const t = setTimeout(settle, DRESSING_MS);
    return () => clearTimeout(t);
  }, [dressing, settle]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRoom();
    };
    window.addEventListener("keydown", onKey);
    closeRef.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closeRoom]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeRoom}
            className="fixed inset-0 z-50 bg-ink/70 backdrop-blur-sm"
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="Fitting room"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 32 }}
            className="fixed left-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-r border-steel/50 bg-coal"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-steel/40 px-5 py-5">
              <div className="flex items-center gap-2.5">
                <HangerIcon className="h-5 w-5 text-acid" />
                <h2 className="font-display text-xl text-bone">Fitting room</h2>
              </div>
              <button
                ref={closeRef}
                onClick={closeRoom}
                aria-label="Close fitting room"
                className="p-2 text-fog transition-colors hover:bg-smoke hover:text-bone focus:outline-none focus-visible:ring-2 focus-visible:ring-acid/40"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="border-b border-steel/40 px-5 py-3 text-[11px] uppercase tracking-[0.12em] text-fog">
              Tap the hanger on any product to wear it.
            </p>

            {/* Body */}
            <div className="flex items-center justify-between border-b border-steel/40 px-5 py-3">
              <div className="flex items-center gap-3">
                <span className="text-[11px] uppercase tracking-[0.2em] text-fog">
                  Model
                </span>
                <div className="flex gap-2" role="group" aria-label="Mannequin body">
                  {BODIES.map((body) => {
                    const active = gender === body;
                    return (
                      <button
                        key={body}
                        onClick={() => setGender(body)}
                        aria-pressed={active}
                        aria-label={`${body} model`}
                        className={cn(
                          "border px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-acid/40",
                          active
                            ? "border-acid bg-acid/10 text-bone"
                            : "border-steel text-ash hover:border-bone hover:text-bone"
                        )}
                      >
                        {body}
                      </button>
                    );
                  })}
                </div>
              </div>
              <span className="text-[10px] uppercase tracking-[0.12em] text-ash">
                {gender === "female" ? "1.70 m" : "1.80 m"}
              </span>
            </div>

            {/* Stage */}
            <div className="relative flex-1 overflow-hidden">
              <div className="studio-grid absolute inset-0 opacity-70" />
              <div
                aria-hidden="true"
                className="absolute left-1/2 top-1/2 h-[70%] w-[70%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-acid/5 blur-3xl"
              />
              <div className="absolute inset-0 flex items-center justify-center px-8 py-6">
                <div className="h-full max-h-[540px] w-full max-w-[290px]">
                  <Mannequin
                    picks={picks}
                    colors={colors}
                    sizes={sizes}
                    gender={gender}
                  />
                </div>
              </div>

              {picks.length === 0 && !dressing && (
                <p className="pointer-events-none absolute inset-x-0 bottom-6 text-center font-display text-lg text-fog/70">
                  Nothing on the model yet
                </p>
              )}

              <AnimatePresence>
                {dressing && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-ink/85 px-8 text-center backdrop-blur-sm"
                  >
                    <Sparkles className="h-5 w-5 text-acid" />
                    <p className="font-display text-xl text-bone">
                      Dressing your model
                    </p>
                    <p className="max-w-[230px] text-xs leading-relaxed text-fog">
                      The photo is being made for you. It takes a moment.
                    </p>
                    <div className="mt-2 h-px w-40 overflow-hidden bg-steel">
                      <motion.div
                        className="h-full w-1/3 bg-acid"
                        animate={{ x: ["-120%", "320%"] }}
                        transition={{
                          duration: 1.1,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Picks */}
            <div className="border-t border-steel/40 px-5 py-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[11px] uppercase tracking-[0.2em] text-fog">
                  Your picks:{" "}
                  <span className="text-acid">{picks.length}</span>{" "}
                  {picks.length === 1 ? "piece" : "pieces"}
                </span>
                {picks.length > 0 && (
                  <button
                    onClick={startOver}
                    className="inline-flex shrink-0 items-center gap-1.5 text-[11px] uppercase tracking-[0.15em] text-fog transition-colors hover:text-acid focus:outline-none focus-visible:ring-2 focus-visible:ring-acid/40"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Start over
                  </button>
                )}
              </div>
              <p className="mt-1 text-[11px] text-ash">
                Add another piece and it goes on top.
              </p>

              {picks.length > 0 && (
                <ul className="mt-3 flex flex-wrap gap-2">
                  {picks.map((product) => {
                    const fit = resolveFit(product, colors[product.id] ?? 0);
                    return (
                      <li key={product.id}>
                        <button
                          onClick={() => removePick(product.id)}
                          aria-label={`Take off ${product.name}`}
                          className="group inline-flex items-center gap-2 border border-steel px-2.5 py-1.5 text-[10px] uppercase tracking-[0.12em] text-fog transition-colors hover:border-bone hover:text-bone"
                        >
                          <span
                            className="h-3 w-3 border border-steel"
                            style={{ background: fit.tone }}
                          />
                          {product.name}
                          <X className="h-3 w-3 opacity-40 transition-opacity group-hover:opacity-100" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}

              {topPick && (
                <div className="mt-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-fog">
                      Choose a Size
                    </p>
                    <span className="text-[10px] uppercase tracking-[0.12em] text-ash">
                      {activeSize || "—"}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {SIZES.map((size) => {
                      const active = activeSize === size;
                      return (
                        <button
                          key={size}
                          onClick={() => setSize(topPick.id, size)}
                          aria-label={`Size ${size} — ${topPick.name}`}
                          aria-pressed={active}
                          className={cn(
                            "min-w-9 border px-2.5 py-1 text-[11px] uppercase tracking-[0.12em] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-acid/40",
                            active
                              ? "border-acid bg-acid/10 text-bone"
                              : "border-steel text-ash hover:border-bone hover:text-bone"
                          )}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {topPick && swatches.length > 0 && (
                <div className="mt-4">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-fog">
                    Choose a Color
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {swatches.map((color, index) => {
                      const active = activeSwatch === index;
                      return (
                        <button
                          key={color.name}
                          onClick={() => setColor(topPick.id, index)}
                          aria-label={`${color.name} — ${topPick.name}`}
                          aria-pressed={active}
                          title={color.name}
                          className={cn(
                            "h-6 w-6 border transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-acid/40",
                            active
                              ? "scale-110 border-acid"
                              : "border-steel hover:border-bone"
                          )}
                          style={{ background: color.tone }}
                        />
                      );
                    })}
                    <span className="ml-1 text-[10px] uppercase tracking-[0.12em] text-ash">
                      {swatches[activeSwatch]?.name ?? ""}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
