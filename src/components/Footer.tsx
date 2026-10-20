import { ArrowUpRight } from "lucide-react";
import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { staggerContainer } from "../lib/motion";
import { StaggerItem } from "./ScrollReveal";
import { toast } from "sonner";
import { useState, type FormEvent, type SVGProps } from "react";
import { hasValue } from "../lib/env";
import { subscribeNewsletter, type LeadResult } from "../lib/lead";
import TurnstileWidget from "./TurnstileWidget";
import { CONTACT } from "../constants/commerce";

/* Inline brand icons (lucide v1+ dropped brand icons) */
function InstagramIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function TwitterIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function TikTokIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
  );
}

const CURRENT_YEAR = new Date().getFullYear();

/**
 * Footer links — every entry here points at a page that exists.
 *
 * Columns that were aspirational (Best sellers, Archive sale, Gift cards,
 * Shipping, Returns) were removed rather than left as dead links: they
 * describe features the studio has not built, and inventing policy copy would
 * be worse than an honest absence.
 */
const FOOTER_LINKS: Record<string, string[]> = {
  Shop: ["All products", "New drop"],
  Help: ["Size guide", "Track order", "Contact"],
};

const FOOTER_TARGETS: Record<string, string> = {
  "All products": "/shop",
  "New drop": "/shop?sort=new",
  "Size guide": "/size-guide",
  "Track order": "/orders",
  Contact: "/#contact",
};

/**
 * Social channels, env-driven. A channel with no URL is dropped entirely —
 * an icon that goes nowhere is a dead end dressed up as a link.
 */
const SOCIAL_LINKS = [
  {
    label: "Instagram",
    href: String(import.meta.env.VITE_SOCIAL_INSTAGRAM ?? "").trim(),
    icon: InstagramIcon,
  },
  {
    label: "TikTok",
    href: String(import.meta.env.VITE_SOCIAL_TIKTOK ?? "").trim(),
    icon: TikTokIcon,
  },
  {
    label: "X",
    href: String(import.meta.env.VITE_SOCIAL_X ?? "").trim(),
    icon: TwitterIcon,
  },
].filter((s) => hasValue(s.href));

/** Legal pages only exist when their URLs are published. */
const POLICIES = [
  { label: "Privacy", href: import.meta.env.VITE_POLICY_PRIVACY_URL },
  { label: "Terms", href: import.meta.env.VITE_POLICY_TERMS_URL },
  { label: "Cookies", href: import.meta.env.VITE_POLICY_COOKIES_URL },
] as const;

const ALL_POLICIES_SET = POLICIES.every((p) => hasValue(p.href));

const SUBSCRIBE_FAILED = hasValue(CONTACT.email)
  ? `Daftar belum tersimpan. Tulis langsung ke ${CONTACT.email}.`
  : "Daftar belum tersimpan. Hubungi studio langsung.";

export default function Footer() {
  const [subscribing, setSubscribing] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");

  /** Success is only ever reported for a write that actually landed. */
  const announceSubscribe = (result: LeadResult) => {
    if (result.ok) {
      toast.success("You're on the list.", {
        description: "Early access to the next drop, straight to your inbox.",
      });
      return true;
    }
    toast.error(
      result.reason === "not-configured"
        ? "The newsletter is not live yet."
        : result.reason === "duplicate"
          ? "You're already on the list."
          : "Could not save your email.",
      { description: SUBSCRIBE_FAILED }
    );
    return false;
  };

  const handleSubscribe = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const email = String(new FormData(form).get("email") ?? "");
    // Honeypot
    const honeypot = String(new FormData(form).get("company") ?? "").trim();
    if (honeypot) return;
    if (!email) return;

    setSubscribing(true);
    try {
      const result = await subscribeNewsletter(email, turnstileToken);
      // Only clear the field on a real insert — a failure keeps the address.
      if (announceSubscribe(result)) form.reset();
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <footer id="signal" className="scroll-mt-20 border-t border-steel/40 bg-ink">
      {/* Newsletter */}
      <div className="border-b border-steel/40">
        <div className="mx-auto grid max-w-[1600px] gap-8 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:items-end lg:px-10 lg:py-20">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-acid">
              Join our signals
            </span>
            <h3 className="mt-4 font-display text-4xl leading-[0.9] text-bone sm:text-5xl lg:text-6xl">
              10% off your
              <br />
              first <span className="text-outline">drop</span>
            </h3>
          </div>

          <div>
            <p className="max-w-md text-sm leading-relaxed text-fog">
              No spam, no presets — early access to drops, archive restocks and
              studio notes. Unsubscribe whenever.
            </p>

            <form
              onSubmit={handleSubscribe}
              className="mt-6 flex flex-col gap-2 sm:flex-row"
            >
              <input
                name="email"
                type="email"
                required
                placeholder="your@email.com"
                aria-label="Email address"
                className="w-full border border-steel bg-coal px-4 py-3.5 text-sm text-bone placeholder:text-ash focus:border-acid focus:outline-none"
              />
              {/* Honeypot */}
              <input
                type="text"
                name="company"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                className="hidden"
              />
              <TurnstileWidget onToken={setTurnstileToken} />
              <button
                type="submit"
                disabled={subscribing}
                className="group inline-flex shrink-0 items-center justify-center gap-2 bg-acid px-6 py-3.5 text-[11px] font-bold uppercase tracking-[0.18em] text-ink transition-colors hover:bg-bone disabled:cursor-not-allowed disabled:opacity-60"
              >
                {subscribing ? "Saving…" : "Subscribe"}
                <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Giant wordmark */}
      <div className="overflow-hidden border-b border-steel/40">
        <motion.p
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="mx-auto max-w-[1600px] px-4 py-8 text-center font-display text-[18vw] leading-[0.8] text-bone sm:px-6 lg:px-10"
        >
          BERTEMPK
          <span className="text-acid">.</span>
        </motion.p>
      </div>

      {/* Columns */}
      <div className="mx-auto grid max-w-[1600px] gap-10 px-4 py-12 sm:px-6 lg:grid-cols-12 lg:px-10">
        <div className="lg:col-span-5">
          <p className="font-display text-2xl text-bone">Wear your version.</p>
          <p className="font-display text-2xl text-acid">No default.</p>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-fog">
            Character-driven clothing built in Indonesia. Designed to outlive
            trends, made for people who refuse the preset.
          </p>

          {SOCIAL_LINKS.length > 0 && (
            <div className="mt-6 flex items-center gap-2">
              {SOCIAL_LINKS.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="group flex h-10 w-10 items-center justify-center border border-steel text-fog transition-colors hover:border-acid hover:text-acid focus:outline-none focus-visible:ring-2 focus-visible:ring-acid/40"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          )}
        </div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="grid grid-cols-2 gap-8 lg:col-span-7"
        >
          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <StaggerItem key={title}>
              <h3 className="text-[10px] font-semibold uppercase tracking-[0.25em] text-silver">
                {title}
              </h3>
              <ul className="mt-5 space-y-3">
                {links.map((link) => (
                  <li key={link}>
                    <Link
                      to={FOOTER_TARGETS[link]!}
                      className="text-sm text-fog transition-colors hover:text-acid"
                    >
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </StaggerItem>
          ))}
        </motion.div>
      </div>

      <div className="mx-auto flex max-w-[1600px] flex-col items-center justify-between gap-4 border-t border-steel/40 px-4 py-6 sm:flex-row sm:px-6 lg:px-10">
        <p className="text-[11px] uppercase tracking-[0.2em] text-ash">
          © {CURRENT_YEAR} BERTEMPK — All rights reserved
        </p>
        {ALL_POLICIES_SET && (
          <div className="flex items-center gap-6">
            {POLICIES.map(({ label, href }) => (
              <a
                key={label}
                href={String(href).trim()}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] uppercase tracking-[0.2em] text-ash transition-colors hover:text-bone"
              >
                {label}
              </a>
            ))}
          </div>
        )}
      </div>
    </footer>
  );
}
