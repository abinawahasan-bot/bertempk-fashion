import { useEffect, useState } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

/** Read synchronously so the *first* commit already honours the preference. */
function initial(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia(QUERY).matches
  );
}

/** Tracks `prefers-reduced-motion` so non-essential motion can be frozen. */
export default function useReducedMotion() {
  const [reduced, setReduced] = useState(initial);
  useEffect(() => {
    const mq = window.matchMedia(QUERY);
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return reduced;
}
