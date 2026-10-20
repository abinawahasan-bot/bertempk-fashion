import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import useReducedMotion from "../lib/useReducedMotion";

/**
 * Scrolls to the element named by the URL hash after every navigation, and
 * returns to the top of the page when there is no hash.
 *
 * React Router does NOT perform hash scrolling on its own, so nav links such as
 * `/#story` would change the URL without moving the viewport (the section stays
 * off-screen). Mounted once from `Layout`, inside the router.
 *
 * Keyed on `location.key` so re-clicking the same anchor still re-scrolls.
 */
export default function ScrollToHash() {
  const { pathname, hash, key } = useLocation();
  const reduced = useReducedMotion();

  useEffect(() => {
    if (hash) {
      const id = decodeURIComponent(hash.slice(1));
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({
          behavior: reduced ? "auto" : "smooth",
          block: "start",
        });
        return;
      }
    }
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname, hash, key, reduced]);

  return null;
}
