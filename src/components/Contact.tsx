import { motion } from "motion/react";
import { ArrowUpRight, Mail, MapPin } from "lucide-react";
import { toast } from "sonner";
import { useState, type FormEvent } from "react";
import { CONTACT } from "../constants/commerce";
import { hasValue, isSupabaseConfiguredForWrites } from "../lib/env";
import { submitContactMessage, type LeadResult } from "../lib/lead";
import TurnstileWidget from "./TurnstileWidget";

/*
 * Contact section (id="contact").
 *
 * Details come from `constants/commerce.ts` (build env), so nothing here
 * invents an address. The form persists through `lib/lead.ts`; when Supabase
 * is not configured (or the insert fails) it says so and points at the studio
 * email instead of pretending the message was received.
 */
const CONTACT_EMAIL = CONTACT.email;
const CONTACT_PLACE = CONTACT.origin;
const HAS_EMAIL = hasValue(CONTACT_EMAIL);

/** The honest fallback: the message did not land, so offer a real channel. */
const FAILED_DESCRIPTION = HAS_EMAIL
  ? `Pesan belum tersimpan. Kirim ulang lewat email ${CONTACT.email}.`
  : "Pesan belum tersimpan. Hubungi studio langsung.";

/**
 * Whether this build can store a message at all. When it cannot, the form
 * still accepts input but says up front that nothing will be saved, instead
 * of collecting a message into a void.
 */
const CAN_STORE = isSupabaseConfiguredForWrites();

const field =
  "w-full border border-steel bg-ink px-4 py-3.5 text-sm text-bone placeholder:text-ash focus:border-acid focus:outline-none";
const label =
  "mb-2 block text-[10px] font-semibold uppercase tracking-[0.25em] text-silver";

export default function Contact() {
  const [sending, setSending] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");

  /** One contract for every failure mode: success only when a row was written. */
  const announce = (result: LeadResult, name: string, email: string) => {
    if (result.ok) {
      toast.success("Message received.", {
        description: `Thanks ${name} — the studio will reply to ${email} soon.`,
      });
      return true;
    }
    toast.error(
      result.reason === "not-configured"
        ? "The contact form is not live yet."
        : "Message could not be sent.",
      { description: FAILED_DESCRIPTION }
    );
    return false;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const message = String(data.get("message") ?? "").trim();
    // Honeypot: bots fill hidden fields; humans never see them. Silently drop.
    const honeypot = String(data.get("website") ?? "").trim();
    if (honeypot) return;
    if (!name || !email || !message) return;

    setSending(true);
    try {
      const result = await submitContactMessage({ name, email, message }, turnstileToken);
      // Clear only on a real write — a failed send must keep what was typed.
      if (announce(result, name, email)) form.reset();
    } finally {
      setSending(false);
    }
  };

  return (
    <section
      id="contact"
      className="relative scroll-mt-20 overflow-hidden border-b border-steel/40 bg-coal"
    >
      <div className="mx-auto grid max-w-[1600px] gap-10 px-4 py-16 sm:px-6 lg:grid-cols-12 lg:gap-16 lg:px-10 lg:py-24">
        {/* Left — intro + details */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="lg:col-span-5"
        >
          <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-acid">
            Contact
          </span>
          <h2 className="mt-5 font-display text-4xl leading-[0.92] text-bone sm:text-5xl">
            Say something.
            <br />
            <span className="text-outline">We read everything.</span>
          </h2>
          <p className="mt-7 max-w-md text-sm leading-relaxed text-fog sm:text-base">
            Questions about a piece, sizing, an order or a collaboration? Send a
            signal and the studio will get back to you.
          </p>

          <ul className="mt-10 space-y-5">
            <li className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-steel text-acid">
                <Mail className="h-4 w-4" />
              </span>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-silver">
                  Email
                </p>
                {HAS_EMAIL ? (
                  <a
                    href={`mailto:${CONTACT_EMAIL}`}
                    className="text-sm text-bone transition-colors hover:text-acid"
                  >
                    {CONTACT_EMAIL}
                  </a>
                ) : (
                  <p className="text-sm text-ash">
                    Studio email not published yet — set{" "}
                    <code className="text-fog">VITE_CONTACT_EMAIL</code> to show
                    it here.
                  </p>
                )}
              </div>
            </li>
            <li className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-steel text-acid">
                <MapPin className="h-4 w-4" />
              </span>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-silver">
                  Studio
                </p>
                <p className="text-sm text-bone">{CONTACT_PLACE}</p>
              </div>
            </li>
          </ul>
        </motion.div>

        {/* Right — form */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          className="lg:col-span-7"
        >
          <form
            onSubmit={handleSubmit}
            className="grid gap-5 border border-steel/40 bg-ink/40 p-6 sm:p-8"
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="contact-name" className={label}>
                  Name
                </label>
                <input
                  id="contact-name"
                  name="name"
                  type="text"
                  required
                  placeholder="Your name"
                  className={field}
                />
              </div>
              <div>
                <label htmlFor="contact-email" className={label}>
                  Email
                </label>
                <input
                  id="contact-email"
                  name="email"
                  type="email"
                  required
                  placeholder="your@email.com"
                  className={field}
                />
              </div>
            </div>

            <div>
              <label htmlFor="contact-message" className={label}>
                Message
              </label>
              <textarea
                id="contact-message"
                name="message"
                required
                rows={5}
                placeholder="Tell us what you need."
                className={`${field} resize-y`}
              />
            </div>

            {/* Honeypot — hidden from humans, filled by bots. */}
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="hidden"
            />

            <TurnstileWidget onToken={setTurnstileToken} />
            <button
              type="submit"
              disabled={sending}
              className="group inline-flex w-fit items-center justify-center gap-2 bg-acid px-6 py-3.5 text-[11px] font-bold uppercase tracking-[0.18em] text-ink transition-colors hover:bg-bone focus:outline-none focus-visible:ring-2 focus-visible:ring-acid/40 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {sending ? "Sending…" : "Send message"}
              <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </button>

            {!CAN_STORE && (
              <p className="text-xs leading-relaxed text-ash">
                Form ini belum terhubung ke database studio — pesan yang dikirim
                dari sini tidak akan tersimpan.{" "}
                {HAS_EMAIL && (
                  <>
                    Untuk sekarang, tulis langsung ke{" "}
                    <a
                      href={`mailto:${CONTACT_EMAIL}`}
                      className="text-bone underline underline-offset-4"
                    >
                      {CONTACT_EMAIL}
                    </a>
                    .
                  </>
                )}
              </p>
            )}
          </form>
        </motion.div>
      </div>
    </section>
  );
}
