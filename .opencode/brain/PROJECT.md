# PROJECT

> Project Brain file · Confidence: CONFIRMED = verified from repo, INFERRED = reasonably inferred, UNKNOWN = not established.
> NEVER store passwords, API keys, tokens, or private credentials. Use placeholders such as ENV_VAR_NAME.

## Identity

- **Project name:** `fashion-ecom` (npm package name) — storefront brand **BERTEMPK**
  — CONFIRMED (`package.json` name, `index.html` `<title>`, Navbar/Footer wordmark).
- **Purpose (CONFIRMED — updated 2026-10-18):** A dark editorial **cyber-streetwear storefront** for the brand BERTEMPK. It presents a brand story, a 6-piece product catalogue (`p1`–`p6`), cart/wishlist, an interactive **fitting room** (dress a **3D mannequin**), an outfit builder, a size guide, and — since Wave 0 — a **full checkout, order history and lead capture**. Client-only SPA on a hosted backend: **Supabase Auth + Postgres**. There is no first-party server; **all business logic, including price computation, runs in the browser** (see SECURITY SEC-001).
- **Tagline (CONFIRMED):** "BERTEMPK — Wear your version. No default." (`index.html` title + `<meta>`; Hero/Footer).
- **Target users (INFERRED):** Online shoppers / brand-audience for streetwear. Accounts exist (Supabase Auth) and orders are placed, but **no payment can actually be taken until a server-side price authority exists** (SEC-001) — the market context is **Indonesian** (IDR, Indonesian checkout copy).
- **Repository path:** `/home/corvusjet/fashion-ecom` — CONFIRMED.
- **Last updated:** 2026-10-18 (Wave 0 brain re-sync).

## Primary objectives

1. Present the BERTEMPK brand (story, tone) with an editorial, dark, monochrome+acid visual system — CONFIRMED (Hero, Statement, Story, Marquee).
2. Let a visitor browse products, add to cart / wishlist, and "try on" pieces in the fitting room — CONFIRMED (Shop, ProductDetail, CartDrawer, Wishlist, FittingRoom).
3. Let a visitor choose an explicit size, check out honestly, and see their orders — CONFIRMED (Checkout, Orders, OrderConfirmation, lib/orders, lib/payments).
4. Never show a payment method, price or success message the system cannot back up — CONFIRMED (lib/payments gating, CreateOrderResult, LeadResult; see DECISIONS D-020/D-021).

## Current status

- **Wave 0 shipped 2026-10-18.** Supabase Auth + a real checkout, order list, order confirmation and order persistence (`public.orders`) + lead capture. `tsc -b`, `oxlint` (1 pre-existing warning) and `vite build` are **green**; **141 automated tests across 9 files pass**. Checkout is **implemented but not payable by default** (no payment provider is configured) and **not safe to take money on** until a server-side price authority exists (SECURITY SEC-001).

## Major features

- Hero with a local video garment (derived asset) — CONFIRMED (`Hero.tsx`, `VideoGarment.tsx`).
- Lazy-loaded 3D hoodie turntable (three.js + R3F + drei) behind a mode flag — CONFIRMED (`GarmentTurntable.tsx`, `HoodieModel.tsx`).
- Product catalogue + filtering/search — CONFIRMED (`Shop.tsx`, `constants/products.ts`).
- Product detail with size/quantity and add-to-cart — CONFIRMED (`ProductDetail.tsx`).
- Cart drawer (**variant-keyed**, persisted via localStorage), wishlist page — CONFIRMED (`CartDrawer.tsx`, `Wishlist.tsx`, `store/cart.ts`, `store/wishlist.ts`).
- **Checkout / orders / order confirmation**, IDR money + shipping rules — CONFIRMED (`Checkout.tsx`, `Orders.tsx`, `OrderConfirmation.tsx`, `lib/orders.ts`, `lib/money.ts`, `constants/commerce.ts`, `supabase/migrations/20261018_orders.sql`).
- **Contact + newsletter lead capture** (migration authored, **not applied**) — CONFIRMED (`lib/lead.ts`, `Contact.tsx`, `Footer.tsx`, `supabase/migrations/20261019_leads.sql`).
- **Size guide** route with an accessible dialog — CONFIRMED (`pages/SizeGuide.tsx`, `components/SizeGuideContent.tsx`).
- **Fitting room** — layered try-on, colourways, sizes, "Start over" — CONFIRMED (`FittingRoom.tsx`, `Mannequin.tsx`, `constants/fit.ts`, `store/fitting.ts`).
- Word-by-word scroll reveals, marquees, reduced-motion handling — CONFIRMED (`TextReveal.tsx`, `Statement.tsx`, `lib/motion.ts`, `lib/useReducedMotion.ts`).

## Project constraints

- **Platform / compatibility:** Modern desktop/mobile browsers; WebP/WebM (VP9) and WebGL for the hero 3D path — INFERRED (feature-dependent).
- **Package / dependency restrictions:** Uses Tailwind CSS **v4** via `@tailwindcss/vite` — CSS-first config in `src/index.css` `@theme`; **no `tailwind.config.js`** — CONFIRMED.
- **Infrastructure limitations:** static hosting only (host **UNKNOWN**, no CI); backend = hosted Supabase, migrations applied by hand in the SQL Editor — CONFIRMED.
- **Privacy (CONFIRMED gap):** addresses, contact messages and newsletter emails are collected with no privacy notice, consent capture or retention rule. UU PDP 27/2022 preconditions before a live checkout — see SECURITY SEC-006.
- **Business rules / hard constraint (CONFIRMED — from brief and code comments):**
  - The **hero garment must be a DERIVED asset**, not the raw reference photos — see `Hero.tsx` comment ("must be built from a DERIVED asset — not by dropping the raw reference photos into the page").
  - **Reference material outside the repo** (`/home/corvusjet/Bajuku.mp4`, `bajuku 1.webp`, `bajuku 2.webp`, `fiturku.mp4`) is **STUDY-ONLY and MUST NEVER be placed into the site** — CONFIRMED (explicit constraint; enforced by DECISIONS D-004).

## Supported platforms

- Web (SPA), responsive from mobile to desktop — CONFIRMED.
- No native mobile, no first-party server, no CLI.

## References

- Full stack: STACK.md · Architecture: ARCHITECTURE.md · Requirements: REQUIREMENTS.md · Decisions: DECISIONS.md
- Index: INDEX.md
