import { Asterisk } from "lucide-react";

interface MarqueeProps {
  items: string[];
  /** "acid" = lime band, "signal" = red band, "ink" = dark band with outline text */
  variant?: "acid" | "signal" | "ink";
  reverse?: boolean;
}

export default function Marquee({ items, variant = "ink", reverse = false }: MarqueeProps) {
  const loop = [...items, ...items];

  const band =
    variant === "acid"
      ? "bg-acid text-ink"
      : variant === "signal"
        ? "bg-signal text-ink"
        : "border-y border-steel/40 bg-ink text-bone";

  return (
    <div className={`marquee-paused overflow-hidden ${band}`} aria-hidden="true">
      <div
        className={`flex w-max items-center gap-8 py-4 ${
          reverse ? "animate-marquee-fast" : "animate-marquee"
        }`}
        style={reverse ? { animationDirection: "reverse" } : undefined}
      >
        {loop.map((item, i) => (
          <div key={i} className="flex shrink-0 items-center gap-8">
            <span className="font-display text-2xl leading-none sm:text-3xl">
              {item}
            </span>
            <Asterisk className="h-5 w-5 shrink-0 opacity-60" />
          </div>
        ))}
      </div>
    </div>
  );
}
