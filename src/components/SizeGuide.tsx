import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import useReducedMotion from "../lib/useReducedMotion";
import { EASE_OUT } from "../lib/motion";
import SizeGuideContent from "./SizeGuideContent";

interface SizeGuideProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Size guide dialog — the real chart behind the "Size guide" button.
 *
 * A11y: `role="dialog"` + `aria-modal`, Escape closes, focus moves into the
 * dialog on open and returns to the trigger on close, Tab is trapped inside.
 */
export default function SizeGuide({ open, onClose }: SizeGuideProps) {
  const reduced = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    restoreFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    closeRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;

      // Keep Tab inside the dialog while it is modal.
      const focusables = panelRef.current?.querySelectorAll<HTMLElement>(
        'button, a[href], input, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusables || focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (!first || !last) return;

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      restoreFocusRef.current?.focus();
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-ink/70 backdrop-blur-sm"
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="size-guide-title"
            initial={{ opacity: 0, y: reduced ? 0 : 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduced ? 0 : 24 }}
            transition={{ duration: reduced ? 0 : 0.35, ease: EASE_OUT }}
            className="fixed left-1/2 top-1/2 z-50 flex max-h-[88vh] w-[calc(100%-2rem)] max-w-3xl -translate-x-1/2 -translate-y-1/2 flex-col border border-steel/50 bg-coal"
          >
            <div className="flex items-center justify-between border-b border-steel/40 px-5 py-4 sm:px-7 sm:py-5">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-acid">
                  Fit guide
                </span>
                <h2
                  id="size-guide-title"
                  className="mt-1 font-display text-2xl text-bone sm:text-3xl"
                >
                  Size guide
                </h2>
              </div>
              <button
                ref={closeRef}
                onClick={onClose}
                aria-label="Close size guide"
                className="p-2 text-fog transition-colors hover:bg-smoke hover:text-bone focus:outline-none focus-visible:ring-2 focus-visible:ring-acid/40"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
              <SizeGuideContent />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}