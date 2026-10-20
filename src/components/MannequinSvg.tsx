import { motion } from "motion/react";
import { layerOrder, resolveFit, wornLabel, type FitShape } from "../constants/fit";
import useReducedMotion from "../lib/useReducedMotion";
import type { MannequinProps } from "../types";

/**
 * MannequinSvg — the flat, vector mannequin.
 *
 * Kept as the fallback whenever WebGL is unavailable (or the 3D chunk fails to
 * load), so the fitting room never shows an empty stage.
 */

const BODY = "#171717";
const BODY_EDGE = "#2c2c2c";

/** One garment silhouette, drawn in the piece's own tone. */
function Garment({
  shape,
  tone,
  shade,
}: {
  shape: FitShape;
  tone: string;
  shade: string;
}) {
  const shell = { fill: tone, stroke: shade, strokeWidth: 2, strokeLinejoin: "round" as const };
  const seam = { fill: "none", stroke: shade, strokeWidth: 2.4 } as const;

  switch (shape) {
    case "trousers":
      return (
        <>
          <path
            d="M124 252 L196 252 L202 312 L192 480 L166 480 L160 338 L154 480 L128 480 L118 312 Z"
            {...shell}
          />
          <path d="M124 268 L196 268" {...seam} />
          <path d="M160 268 L160 320" {...seam} />
        </>
      );
    case "tee":
      return (
        <>
          <path
            d="M120 120 L200 120 L210 136 L230 170 L211 185 L202 160 L200 266 L120 266 L118 160 L109 185 L90 170 L110 136 Z"
            {...shell}
          />
          <path d="M140 120 Q160 136 180 120" {...seam} />
          <path d="M120 258 L200 258" {...seam} />
        </>
      );
    case "crop":
      return (
        <>
          <path
            d="M120 120 L200 120 L210 136 L230 170 L211 185 L202 160 L200 210 L120 210 L118 160 L109 185 L90 170 L110 136 Z"
            {...shell}
          />
          <path d="M140 120 Q160 136 180 120" {...seam} />
          <path d="M120 202 L200 202" {...seam} />
        </>
      );
    case "hoodie":
      return (
        <>
          <path
            d="M120 120 L200 120 L210 136 L230 170 L211 185 L202 160 L200 266 L120 266 L118 160 L109 185 L90 170 L110 136 Z"
            {...shell}
          />
          <path
            d="M136 116 Q160 86 184 116 Q188 148 160 152 Q132 148 136 116 Z"
            {...shell}
          />
          <path d="M150 154 L147 184" {...seam} />
          <path d="M170 154 L173 184" {...seam} />
          <path d="M134 216 L186 216 L182 248 L138 248 Z" {...seam} />
        </>
      );
    case "jacket":
      return (
        <>
          <path
            d="M120 120 L200 120 L212 138 L234 172 L213 189 L202 162 L202 278 L118 278 L118 162 L107 189 L86 172 L108 138 Z"
            {...shell}
          />
          <path d="M140 120 L160 154 L180 120 Z" fill={shade} stroke={shade} strokeWidth={2} strokeLinejoin="round" />
          <path d="M160 154 L160 278" {...seam} />
          <path d="M118 196 L202 196" {...seam} />
        </>
      );
    case "vest":
      return (
        <>
          <path d="M122 120 L198 120 L194 266 L126 266 Z" {...shell} />
          <path d="M140 120 Q160 146 180 120" {...seam} />
          <path d="M129 128 Q121 160 127 200" {...seam} />
          <path d="M191 128 Q199 160 193 200" {...seam} />
          <path d="M160 150 L160 266" {...seam} />
        </>
      );
  }
}

export default function MannequinSvg({ picks, colors, gender = "male" }: MannequinProps) {
  const reduced = useReducedMotion();
  const worn = layerOrder(picks);

  return (
    <svg
      viewBox="0 0 320 520"
      className="h-full w-full"
      role="img"
      aria-label={wornLabel(worn, gender)}
    >
      {/* floor shadow */}
      <ellipse cx="160" cy="492" rx="96" ry="12" fill="#000000" opacity="0.55" />

      {/* body */}
      <g fill={BODY} stroke={BODY_EDGE} strokeWidth={2} strokeLinejoin="round">
        <path d="M130 306 L156 306 L150 480 L132 480 Z" />
        <path d="M164 306 L190 306 L188 480 L170 480 Z" />
        <path d="M126 256 L194 256 L198 310 L122 310 Z" />
        <path d="M120 118 Q160 102 200 118 L194 264 L126 264 Z" />
        <path d="M120 120 L103 127 L87 264 L104 270 Z" />
        <path d="M200 120 L217 127 L233 264 L216 270 Z" />
        <rect x="150" y="86" width="20" height="24" rx="6" />
        <circle cx="160" cy="62" r="27" />
      </g>

      {/* garments, base layer first */}
      {worn.map((product) => {
        const fit = resolveFit(product, colors[product.id] ?? 0);
        return (
          <motion.g
            key={product.id}
            initial={reduced ? { opacity: 1 } : { opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 240, damping: 26 }}
            style={{ transformOrigin: "160px 120px" }}
          >
            <Garment shape={fit.shape} tone={fit.tone} shade={fit.shade} />
          </motion.g>
        );
      })}
    </svg>
  );
}
