# TASK-007 · Story & Contact nav — hash-scroll fix + a real Contact section

> Task record. Confidence markers apply (CONFIRMED / INFERRED / UNKNOWN).
> Session: 2026-10-14 (session 8). User: *"analisa menu story dan contact — kok
> tidak ada isinya / tidak bisa diakses?"* → diagnosis, then choice of **Opsi A**.

## Goal

Make the **Story** and **Contact** menu items actually work. Two distinct
problems were reported as one:

1. **Story** — the section *exists* on Home but clicking the menu never scrolled
   to it.
2. **Contact** — there was *no* contact content at all; the menu pointed at the
   footer newsletter block (`#signal`).

Chosen fix (**Opsi A**, user-decided): repair the anchor behaviour **and** add a
real Contact section to Home (not a dedicated route).

## Findings (evidence)

- **React Router does not scroll to a `#hash` on navigation.** Clicking the
  Story link set the URL to `/#story` but `scrollY` stayed **0**, while the
  `#story` element sits at **top ≈ 2554 px** (far below the fold). Same class of
  failure for Contact. — CONFIRMED (Playwright on dev :5200).
- **`#signal` is the `<footer>`**, specifically the newsletter block — **not** a
  contact block (`realContactBlock = false`, footer top ≈ 3509 px). So the Contact
  menu item pointed at the wrong thing entirely. — CONFIRMED
- **No `/story` or `/contact` routes exist** — `App.tsx` only has `/`, `/shop`,
  `/product/:id`, `/wishlist`, `*`→`/`. — CONFIRMED
- **Footer "Help"/"Social" links were dead** — every item rendered as
  `<a href="#">` (no destinations). — CONFIRMED

The Story section itself was fine (it has content, `scroll-mt-20`); the only
defect was the missing scroll. Contact genuinely did not exist.

## Decision

**Opsi A** (user-approved): fix the anchor scroll centrally **and** add a Contact
section (`id="contact"`) to Home, with placeholder contact details clearly marked
for later replacement. Rejected Opsi B (dedicated `/story` + `/contact` routes) —
heavier, and the brand is a single scrolled Home.

## Changes

- **Added `src/components/ScrollToHash.tsx`** — watches `useLocation()`
  (`pathname`, `hash`, `key`); on change, `decodeURIComponent(hash.slice(1))` →
  `getElementById` → `scrollIntoView({behavior, block:"start"})`, else
  `window.scrollTo({top:0})`. Keyed on `location.key` so a **repeat click of the
  same hash re-scrolls**. Honours reduced motion (`useReducedMotion` → `"auto"`).
- **Added `src/components/Contact.tsx`** — section `id="contact"`,
  `scroll-mt-20 border-b border-steel/40 bg-coal`, 12-col grid: intro + `EMAIL`
  (`mailto:`) / `STUDIO` details on the left, a working form
  (`name`/`email`/`message`, ids `contact-{name,email,message}`) on the right.
  Submit → `toast.success("Message received.", {description})` + `form.reset()`.
  Placeholders are **explicitly marked** as replace-me: `CONTACT_EMAIL =
  "studio@bertempk.com"`, `CONTACT_PLACE = "Berlin, Germany"`.
- **`src/components/Layout.tsx`** — renders `<ScrollToHash />` as the first child
  (inside the Router).
- **`src/pages/Home.tsx`** — renders `<Contact />` after the final `Marquee`.
- **`src/components/Navbar.tsx`** — `Contact` link `/#signal` → `/#contact`
  (Story stays `/#story`).
- **`src/components/Footer.tsx`** — added `Link` + a `footerTargets` map. Real
  destinations now: `All products → /shop`, `New drop → /shop?sort=new`,
  `Contact → /#contact`. Genuinely-missing pages stay inert `href="#"` (reported,
  not invented).

## Validation

- `npx tsc -b --force` 0 · `npx oxlint src` 0 · `npx vite build` 0
  (`index` 531.32 kB — grew ~5 kB for the two new components; chunk-size warning
  pre-existing).
- Browser (Playwright 1440×1000):
  - Story from `/shop` → URL `/#story`, `scrollY 2474`, section top **80 px** (in
    viewport, under the sticky navbar via `scroll-mt-20`). — CONFIRMED
  - Contact from `/shop` (navbar) → `scrollY 3428`, top 80 px, form + `mailto`
    present. — CONFIRMED
  - **Form submit** → toast *"Message received. Thanks Rina — the studio will
    reply to rina@example.com soon."* appears in **62 ms**, form cleared. —
    CONFIRMED
  - **Fresh direct load** of `/#contact` → scrolls to the section. — CONFIRMED
  - **Footer Contact** from `/shop` → scrolls to `/#contact`. — CONFIRMED
  - **Regression:** from a scrolled `/#contact`, clicking **Shop** lands at
    `scrollY 0` (normal nav unaffected). — CONFIRMED
  - **0 console errors** throughout.

## Notes / method corrections

- **Sonner toast auto-dismisses (~4 s).** A probe issued as a *separate* tool call
  after the click can miss it → **poll in-page** (loop on
  `[data-sonner-toast]`) to catch the toast; don't conclude "no toast".
- Setting an input's `.value` directly then `form.requestSubmit()` is fine here
  because the handler reads `FormData` from the DOM (no controlled-state needed
  for the test).

## Result

**RESOLVED / VERIFIED (2026-10-14, session 8).** Story scrolls, Contact exists and
scrolls from both navbar and footer, the form toasts, direct hash loads work, and
normal navigation still lands at the top. Placeholder contact details remain —
**replace with real values when available** (tracked below).

## Open questions (need user input)

1. Real **contact email** and **studio address** to replace the placeholders
   (`studio@bertempk.com` / `Berlin, Germany`).
2. Should the remaining Footer **Help/Social** links (Shipping, Returns, Instagram,
   …) get real destinations or stay inert for now?

## Lessons

- **React Router ≠ browser hash scrolling.** Any hash-anchor UI ("jump to
  section", "Contact us") needs an explicit scroll effect keyed on
  `location.hash`/`location.key`. A hash in the URL is not proof of a scroll.
- When a menu item "does nothing", separate the two hypotheses early: **(a) the
  target has no content** vs **(b) the navigation doesn't reach it**. Here Story
  was (b) and Contact was (a).
