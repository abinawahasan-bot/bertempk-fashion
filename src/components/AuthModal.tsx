import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Mail, Lock, User } from "lucide-react";
import { useAuthStore } from "../store/auth";
import { useUIStore } from "../store/ui";
import { cn } from "../lib/utils";

type View = "signin" | "signup";

export default function AuthModal() {
  const [view, setView] = useState<View>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { loading, signIn, signUp, signInWithProvider } = useAuthStore();
  const { authModalOpen, closeAuthModal } = useUIStore();

  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!authModalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeAuthModal();
    };
    window.addEventListener("keydown", onKey);
    closeRef.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [authModalOpen, closeAuthModal]);

  useEffect(() => {
    if (authModalOpen) {
      setError(null);
      setSuccess(null);
      setEmail("");
      setPassword("");
      setName("");
    }
  }, [authModalOpen, view]);

  const handleSubmit = async (e: React.FormEvent) => {
    console.log("[AuthModal] handleSubmit called");
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (view === "signin") {
      const { error } = await signIn(email, password);
      if (error) {
        setError(error);
      } else {
        closeAuthModal();
      }
    } else {
      if (password.length < 6) {
        setError("Password must be at least 6 characters");
        return;
      }
      const { error } = await signUp(email, password, name);
      if (error) {
        setError(error);
      } else {
        setSuccess("Account created! Check your email to confirm.");
      }
    }
  };

  const handleProvider = async (provider: "google" | "github") => {
    setError(null);
    const { error } = await signInWithProvider(provider);
    if (error) setError(error);
  };

  return (
    <AnimatePresence>
      {authModalOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeAuthModal}
            className="fixed inset-0 z-50 bg-ink/70 backdrop-blur-sm"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={view === "signin" ? "Sign in" : "Create account"}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 border border-steel/50 bg-coal"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-steel/40 px-6 py-5">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-acid">
                  {view === "signin" ? "Welcome back" : "Join BERTEMPK"}
                </span>
                <h2 className="mt-1 font-display text-2xl text-bone">
                  {view === "signin" ? "Sign in" : "Create account"}
                </h2>
              </div>
              <button
                ref={closeRef}
                onClick={closeAuthModal}
                aria-label="Close"
                className="p-2 text-fog transition-colors hover:bg-smoke hover:text-bone"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4 px-6 py-6">
              {view === "signup" && (
                <div>
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.15em] text-fog">
                    Name
                  </label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ash" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      className="w-full border border-steel bg-smoke py-3 pl-10 pr-4 text-sm text-bone placeholder:text-ash focus:border-acid focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.15em] text-fog">
                  Email
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ash" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full border border-steel bg-smoke py-3 pl-10 pr-4 text-sm text-bone placeholder:text-ash focus:border-acid focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.15em] text-fog">
                  Password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ash" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="w-full border border-steel bg-smoke py-3 pl-10 pr-4 text-sm text-bone placeholder:text-ash focus:border-acid focus:outline-none"
                  />
                </div>
              </div>

              {error && (
                <p className="border border-signal/30 bg-signal/10 px-3 py-2 text-xs text-signal">
                  {error}
                </p>
              )}

              {success && (
                <p className="border border-acid/30 bg-acid/10 px-3 py-2 text-xs text-acid">
                  {success}
                </p>
              )}

              <button
                type="submit"
                onClick={() => console.log("[AuthModal] button clicked")}
                disabled={loading}
                className={cn(
                  "w-full py-3.5 text-[11px] font-bold uppercase tracking-[0.18em] transition-colors",
                  loading
                    ? "cursor-wait bg-steel/50 text-ash"
                    : "bg-acid text-ink hover:bg-bone"
                )}
              >
                {loading
                  ? "Loading..."
                  : view === "signin"
                    ? "Sign in"
                    : "Create account"}
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-steel/40" />
                <span className="text-[10px] uppercase tracking-[0.15em] text-ash">
                  or
                </span>
                <div className="h-px flex-1 bg-steel/40" />
              </div>

              {/* Social login */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleProvider("google")}
                  className="flex items-center justify-center gap-2 border border-steel py-2.5 text-[11px] font-bold uppercase tracking-[0.15em] text-fog transition-colors hover:border-bone hover:text-bone"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Google
                </button>
                <button
                  type="button"
                  onClick={() => handleProvider("github")}
                  className="flex items-center justify-center gap-2 border border-steel py-2.5 text-[11px] font-bold uppercase tracking-[0.15em] text-fog transition-colors hover:border-bone hover:text-bone"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  GitHub
                </button>
              </div>
            </form>

            {/* Switch view */}
            <div className="border-t border-steel/40 px-6 py-4 text-center">
              <p className="text-xs text-fog">
                {view === "signin" ? "New to BERTEMPK?" : "Already have an account?"}{" "}
                <button
                  type="button"
                  onClick={() => setView(view === "signin" ? "signup" : "signin")}
                  className="font-semibold text-acid hover:underline"
                >
                  {view === "signin" ? "Create account" : "Sign in"}
                </button>
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
