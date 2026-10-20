# PATTERNS

> Project Brain file · ESTABLISHED project-specific patterns only. Confidence: CONFIRMED (found in code).
> A pattern must survive ≥2 real uses (or explicit approval) before promotion.

## Established patterns

### Domain store with zustand `persist`
- **Purpose:** Persist domain state (cart, wishlist, fitting) to `localStorage`.
- **Shape:** `create<State>()(persist((set, get) => ({...}), { name: "bato-<domain>" }))`; the fitting store adds `partialize` to persist only `picks/colors/sizes`.
- **Where used:** `src/store/cart.ts`, `wishlist.ts`, `fitting.ts`.
- **Related:** CONVENTIONS (state management), D-003.

### `cn()` class-merge helper
- **Purpose:** Compose conditional Tailwind classes safely.
- **Shape:** `import { cn } from "../lib/utils"` → `cn("base", cond && "x")`.
- **Where used:** Navbar, ProductCard, ProductDetail, HangerButton, FittingRoom, Shop, …
- **Related:** CONVENTIONS.

### Shared motion tokens in a non-component module
- **Purpose:** Consistent reveals/stagger without violating fast-refresh lint.
- **Shape:** `EASE_OUT`, `staggerContainer`, `staggerItem` exported from `src/lib/motion.ts`; consumed with `variants` + `whileInView="show"`.
- **Where used:** `Footer.tsx`, `Story.tsx`, `ScrollReveal.tsx`; `TextReveal.tsx` keeps its own `wordVariants`.
- **Related:** D-007, F-003, CONVENTIONS.

### Reduced-motion hook
- **Purpose:** Freeze non-essential motion and swap the hero video for a poster.
- **Shape:** `useReducedMotion()` default export, `useState` seeded by a **synchronous** `matchMedia` read (so the first commit is already correct) with a change listener in an effect; branch on `reduced`.
- **Where used:** `VideoGarment.tsx`, `GarmentTurntable.tsx`, `Mannequin3D.tsx`, `lib/useReducedMotion.ts`.
- **Related:** REQUIREMENTS (accessibility), F-007.

### Procedural layered 3D try-on stage
- **Purpose:** A believable try-on figure with **zero external assets**, layered garments, and safe degradation.
- **Shape:** wrapper (`Mannequin.tsx`) = `lazy` stage + `Suspense` (SVG fallback) + error boundary + cached `hasWebGL()` gate; stage = procedural body + **inflated shells** offset by `pad = layer * LAYER_STEP` (worn-array index), width-only sizing (`[k,1,k]`), local lights + `ContactShadows` (no HDR), `role="img"` + a label shared with the SVG.
- **Where used:** `Mannequin3D.tsx`, `MannequinSvg.tsx`, `Mannequin.tsx`; label from `constants/fit.ts`.
- **Related:** D-008, D-009, F-005, F-006.

### Reusable try-on affordance
- **Purpose:** One control to wear/remove a product, in card and detail contexts.
- **Shape:** `HangerButton` with `showLabel` variant; reads/writes `useFittingStore`; toasts via sonner.
- **Where used:** `ProductCard.tsx`, `ProductDetail.tsx`.
- **Related:** D-003, D-006.

### Data-driven fit mapping
- **Purpose:** Map a product category (and per-id override) to a garment slot/shape/tone.
- **Shape:** `BY_CATEGORY` + `BY_ID` override → `fitFor()`; `colorsFor()`/`resolveFit()` for colour; `layerOrder()` for paint order.
- **Where used:** `src/constants/fit.ts` → `Mannequin.tsx`, `FittingRoom.tsx`.
- **Related:** D-003.

### Inline SVG icon fallback
- **Purpose:** Provide glyphs missing from `lucide-react@1.55.0`.
- **Shape:** A small component rendering `<svg>` with `currentColor`, `aria-hidden`.
- **Where used:** `HangerIcon.tsx`; social icons in `Footer.tsx`.
- **Related:** D-006, F-004.

## Candidate patterns (INFERRED — not yet confirmed)

- Route-level code splitting (only the 3D turntable is currently lazy) — a likely next step, not yet established.

## Rules

- Only patterns actually established in the repo belong here.
- When a pattern changes, update its shape and check CONVENTIONS.md for conflicts.
