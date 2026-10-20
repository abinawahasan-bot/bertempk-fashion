import { useEffect, useRef, useState } from "react";
import useReducedMotion from "../lib/useReducedMotion";
import { cn } from "../lib/utils";

/**
 * VideoGarment — the hero garment, rendered from the real hoodie recording
 * (a seamless ping-pong loop of the user's own 3D model).
 *
 * The WebM carries a real alpha channel (VP9, alpha_mode=1), so the garment is
 * composited NORMALLY and stays fully opaque — the page background must never
 * show through it. `mix-blend-screen` is therefore NOT used on the normal path;
 * it is only a last-resort repair for a source without a usable alpha channel
 * (the H.264 fallback, or a browser that ignores VP9 alpha), where the black
 * background would otherwise become an opaque black box. That case is detected
 * at runtime by probing the alpha of the decoded frame's corner pixel, so the
 * normal path never pays for it.
 *
 * IMPORTANT (paint order): the halo below is `absolute`, so a static media node
 * would be painted UNDER it (a positioned box always paints above in-flow
 * content) and the white glow would wash the garment. `relative` — with NO
 * z-index — lifts the media into the same paint layer, after the halo in DOM
 * order. Do NOT add a z-index or opacity to this layer: either one creates a
 * nested stacking context, which would break the blend fallback and bring the
 * black box back. The parent section provides the blend group via `isolate`.
 *
 * The clip itself is recoloured by the SOURCE's own tones — shaded blue -> black,
 * lit/white -> grey — so no page background can read through it.
 *
 * With prefers-reduced-motion the still poster (an RGBA PNG) is shown instead.
 */
export default function VideoGarment() {
  const reduced = useReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);
  // Only true when the decoded source has no usable alpha (black-box repair).
  const [needsScreenBlend, setNeedsScreenBlend] = useState(false);

  useEffect(() => {
    if (reduced) return;
    const video = videoRef.current;
    if (!video) return;

    const detectAlpha = () => {
      const w = video.videoWidth;
      const h = video.videoHeight;
      if (!w || !h) return;
      try {
        // The top-left corner of this clip is always backdrop, so its alpha
        // tells us whether the browser actually decoded an alpha channel.
        const canvas = document.createElement("canvas");
        canvas.width = 8;
        canvas.height = 8;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return;
        ctx.drawImage(video, 0, 0, 8, 8, 0, 0, 8, 8);
        const alpha = ctx.getImageData(0, 0, 1, 1).data[3];
        setNeedsScreenBlend(alpha === 255);
      } catch {
        // Tainted canvas (cross-origin): use the box-free fallback.
        setNeedsScreenBlend(true);
      }
    };

    if (video.readyState >= 2) detectAlpha();
    video.addEventListener("loadeddata", detectAlpha);
    return () => video.removeEventListener("loadeddata", detectAlpha);
  }, [reduced]);

  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      {/* Soft halo so the garment separates from the dark hero backdrop. */}
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-1/2 h-[62%] w-[54%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.10),rgba(255,255,255,0)_70%)] blur-2xl"
      />
      {reduced ? (
        <img
          src="/hoodie-poster.png"
          alt=""
          aria-hidden="true"
          className="relative h-full w-full object-contain"
        />
      ) : (
        <video
          ref={videoRef}
          className={cn(
            "relative h-full w-full object-contain",
            needsScreenBlend && "mix-blend-screen",
          )}
          poster="/hoodie-poster.png"
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          aria-hidden="true"
        >
          <source src="/hoodie.webm" type="video/webm" />
          <source src="/hoodie.mp4" type="video/mp4" />
        </video>
      )}
    </div>
  );
}
