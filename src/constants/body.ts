import type { Gender } from "../types";

/**
 * Body model for the fitting-room mannequin.
 *
 * The rendered body is the rigged GLB at `public/model/mannequin-{male,female}.glb`,
 * produced by `tools/generate_reference_mannequins.py`. Its volumes are simple
 * primitives authored in the file's *own* metre space (Z-up, +Y to the back) at
 * canonical heights 1.80 m (male) / 1.70 m (female).
 *
 * We mirror those exact primitives here, mapped into the stage's world units
 * (Y-up, feet near −0.95, +Z to the front), so the procedural garments can be
 * built to *wrap* the body without clipping. Keep this in sync with the
 * generator if the GLB is ever regenerated.
 */

/** The generated body stands 1.992 m tall; the stage is 1.9 units tall. */
const K = 1.9 / 1.992;

/** Generator per-gender scale (`height / 1.80`). */
const S: Record<Gender, number> = { male: 1, female: 1.7 / 1.8 };

type V3 = [number, number, number];

export interface BodyMetrics {
  /** glb metre → world unit. */
  k: number;
  /** world-Y shift that puts the body's lowest point at −0.95. */
  ty: number;
  /** Pelvis sphere: centre and half-extents [width, up, depth]. */
  pelvisC: V3;
  pelvisR: V3;
  /** Waist→chest cylinder. */
  torsoBottom: number;
  torsoTop: number;
  torsoR: number;
  /** Chest sphere. */
  chestC: V3;
  chestR: V3;
  /** Head sphere. */
  headC: V3;
  headR: V3;
  crownY: number;
  /** Neck joint (base of the collar). */
  neckY: number;
  /** Upper-arm root / elbow / wrist, +X side (mirror with −1). */
  shoulder: V3;
  elbow: V3;
  wrist: V3;
  /** Upper-arm tilt from vertical (radians), +X side. */
  armTilt: number;
  /** Lower-arm tilt from vertical (radians), +X side. */
  foreArmTilt: number;
  upperArmR: number;
  foreArmR: number;
  /** Leg anchors. */
  hipX: number;
  legTopY: number;
  ankleY: number;
  legR: number;
  shinR: number;
  /** Foot sphere. */
  footC: V3;
  footR: V3;
}

function buildMetrics(gender: Gender): BodyMetrics {
  const s = S[gender];
  const armR = (gender === "female" ? 0.075 : 0.083) * s;
  const legR = (gender === "female" ? 0.115 : 0.125) * s;
  const pelvis = gender === "female" ? [0.25, 0.15, 0.22] : [0.22, 0.15, 0.22];
  const chest = gender === "female" ? [0.29, 0.17, 0.3] : [0.34, 0.17, 0.3];

  /* Lowest point of the generated body: the rounded cap at the base of the
     shin cylinder. Anchoring on it keeps every body standing on −0.95. */
  const lowest = 0.09 * s - legR * 0.83 * 1.03;
  const ty = -0.95 - K * lowest;

  /* glb metres (Z-up, +Y back) → world (Y-up, +Z front). */
  const p = (g: V3): V3 => [g[0] * K, g[2] * K + ty, -g[1] * K];
  const r = (v: number) => v * K;

  return {
    k: K,
    ty,
    pelvisC: p([0, 0, 0.95 * s]),
    pelvisR: [r(pelvis[0] * s), r(pelvis[2] * s), r(pelvis[1] * s)],
    torsoBottom: p([0, 0, 1.03 * s])[1],
    torsoTop: p([0, 0, 1.47 * s])[1],
    torsoR: r(0.2 * s),
    chestC: p([0, 0, 1.47 * s]),
    chestR: [r(chest[0] * s), r(chest[2] * s), r(chest[1] * s)],
    headC: p([0, 0, 1.76 * s]),
    headR: [r(0.145 * s), r(0.19 * s), r(0.14 * s)],
    crownY: p([0, 0, 1.975 * s])[1],
    neckY: p([0, 0, 1.64 * s])[1],
    shoulder: p([-0.27 * s, 0, 1.51 * s]),
    elbow: p([-0.49 * s, 0, 1.25 * s]),
    wrist: p([-0.62 * s, 0, 1.02 * s]),
    armTilt: Math.atan2(0.22 * s, 0.26 * s),
    foreArmTilt: Math.atan2(0.13 * s, 0.23 * s),
    upperArmR: r(armR),
    foreArmR: r(armR * 0.86),
    hipX: r(0.15 * s),
    legTopY: p([0, 0, 0.91 * s])[1],
    ankleY: p([0, -0.03 * s, 0.09 * s])[1],
    legR: r(legR),
    shinR: r(legR * 0.83),
    footC: p([0, -0.105 * s, 0.055 * s]),
    footR: [r(0.12 * s), r(0.065 * s), r(0.23 * s)],
  };
}

const CACHE: Partial<Record<Gender, BodyMetrics>> = {};

/** Cached metrics for a gender. Pure; safe to call per render. */
export function bodyMetrics(gender: Gender): BodyMetrics {
  return (CACHE[gender] ??= buildMetrics(gender));
}

export type EProfile = [y: number, rx: number, rz: number][];

/**
 * Body half-extents at a height: the union of pelvis, waist cylinder, chest and
 * head spheres. Head is included so a collar clears it near the neck.
 */
export function bodySection(m: BodyMetrics, y: number): [number, number] {
  let rx = 0;
  let rz = 0;
  const sphere = (c: V3, e: V3) => {
    const t = (y - c[1]) / e[1];
    if (Math.abs(t) >= 1) return;
    const f = Math.sqrt(1 - t * t);
    rx = Math.max(rx, e[0] * f);
    rz = Math.max(rz, e[2] * f);
  };
  sphere(m.pelvisC, m.pelvisR);
  sphere(m.chestC, m.chestR);
  sphere(m.headC, m.headR);
  if (y >= m.torsoBottom && y <= m.torsoTop) {
    rx = Math.max(rx, m.torsoR);
    rz = Math.max(rz, m.torsoR);
  }
  return [rx, rz];
}

/**
 * A smooth torso shell profile from `hem` up to `top`, sampled so the wrap never
 * dips inside the body it covers. `pad` is cloth thickness (+ per-layer lift).
 */
export function torsoShellProfile(
  m: BodyMetrics,
  hem: number,
  pad: number,
  top = 0.715,
  steps = 10
): EProfile {
  const prof: EProfile = [];
  for (let i = 0; i < steps; i++) {
    const y = hem + ((top - hem) * i) / (steps - 1);
    const [rx, rz] = bodySection(m, y);
    prof.push([y, rx + pad, rz + pad]);
  }
  return prof;
}
