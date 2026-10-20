import { ImageOff } from "lucide-react";
import { cn } from "../lib/utils";

interface LineImageProps {
  /** May be "" for a pre-Wave-0 row that never stored an image. */
  src: string;
  /** The product name — also the placeholder's accessible name. */
  alt: string;
  className?: string;
}

/**
 * Thumbnail for a cart/order line.
 *
 * `<img src="">` is not a blank box: React logs a DOM error and the browser
 * renders a broken-image glyph, which is what every legacy row (persisted
 * before images were recorded) used to show. An empty or whitespace-only URL
 * gets a neutral placeholder instead — still named for screen readers, so no
 * information is lost.
 */
export default function LineImage({ src, alt, className }: LineImageProps) {
  if (src.trim()) {
    return <img src={src} alt={alt} className={className} />;
  }
  return (
    <span
      role="img"
      aria-label={`${alt} — no image available`}
      className={cn(
        "flex h-full w-full items-center justify-center bg-smoke text-ash",
        className
      )}
    >
      <ImageOff className="h-5 w-5" aria-hidden="true" />
    </span>
  );
}