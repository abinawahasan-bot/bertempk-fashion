import * as THREE from "three";
import type { FitShape, FitSpec } from "../constants/fit";

/**
 * Fitting-room garment builder.
 *
 * The avatar is a rigged GLB whose real (skinned) silhouette is only known at
 * runtime. Rather than guess a parametric body, we measure the *rendered*
 * surface with three (`SkinnedMesh.applyBoneTransform`) and turn that surface
 * into a cloth layer: duplicate the body's triangles, push every vertex along
 * its normal by a cloth thickness, and keep only the faces a given garment
 * covers. The result wraps the body exactly — no clipping, and it follows the
 * avatar's pose.
 *
 * Body landmarks (hip, neck, shoulder, wrist, ankle…) are read straight off the
 * rig's named joints, so a garment lands where anatomy says it should instead
 * of relying on silhouette guesswork. Only the torso/arm split still uses a
 * width profile, because arms sit *outside* the torso in an A-pose.
 *
 * All positions are expressed in the coordinate space of the `<group>` that
 * holds the avatar, so a garment mesh placed next to the avatar lines up.
 */

/** Base cloth thickness (world units) added on top of the skin. */
export const CLOTH = 0.011;
/** Extra thickness per garment layer (bottom → top → outer → accessory). */
export const CLOTH_STEP = 0.011;

/** How much a size nudges the cloth out. Kept gentle; the shape still reads. */
const SIZE_SCALE: Record<string, number> = {
  XS: 0.82,
  S: 0.91,
  M: 1,
  L: 1.09,
  XL: 1.18,
};

const BINS = 96;
const CLUSTER_GAP = 0.035;

export interface AvatarFit {
  /** Lowest point of the body (world of the group). */
  feetY: number;
  /** Highest point (top of the head). */
  crownY: number;
  height: number;
  /** Hip joint: where a trouser waist sits. */
  hipY: number;
  /** Base of the neck: the top of a torso garment. */
  collarY: number;
  /** Shoulder joint: where a sleeve begins. */
  shoulderY: number;
  /** Wrist: where a long sleeve ends. */
  wristY: number;
  /** Ankle: where a trouser hem ends. */
  ankleY: number;
  /** Knee. */
  kneeY: number;
  /** Mid-line of the body in x (the rig is not centred on the origin). */
  centerX: number;
  /** Per-bin half-width of the body core, for the torso/arm split. */
  halfX: Float32Array;
  binY0: number;
  binH: number;
}

export interface BodySurface {
  /** Skinned vertex positions in group space, xyz per vertex. */
  positions: Float32Array;
  /** Triangle indices into `positions`. */
  indices: Uint32Array;
  /** Outward per-vertex normals (area-weighted). */
  normals: Float32Array;
  fit: AvatarFit;
}

/** A named skeleton joint, in the space of the avatar's `<group>`. */
export interface BonePoint {
  name: string;
  x: number;
  y: number;
  z: number;
}

interface Cluster {
  min: number;
  max: number;
}

function clusterSorted(xs: number[]): Cluster[] {
  const out: Cluster[] = [];
  let min = NaN;
  let max = NaN;
  for (const x of xs) {
    if (Number.isNaN(min)) {
      min = max = x;
    } else if (x - max > CLUSTER_GAP) {
      out.push({ min, max });
      min = max = x;
    } else {
      max = x;
    }
  }
  if (!Number.isNaN(min)) out.push({ min, max });
  return out;
}

/** Every joint's position in `group` space — used to read real body landmarks. */
export function bonePoints(
  root: THREE.Object3D,
  group: THREE.Object3D
): BonePoint[] {
  group.updateMatrixWorld(true);
  const out: BonePoint[] = [];
  const v = new THREE.Vector3();
  root.traverse((o) => {
    if (!(o as THREE.Bone).isBone) return;
    v.setFromMatrixPosition(o.matrixWorld);
    group.worldToLocal(v);
    out.push({ name: o.name, x: v.x, y: v.y, z: v.z });
  });
  return out;
}

/**
 * glTF node names are sanitised on load (`spine.005` → `spine005`,
 * `shoulder.L` → `shoulderL`), so match on a de-punctuated, lower-cased form.
 */
function normalise(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** Mean Y of every joint whose normalised name satisfies `match`. */
function landmarkY(
  points: BonePoint[],
  match: (name: string) => boolean
): number | undefined {
  let sum = 0;
  let count = 0;
  for (const point of points) {
    if (match(normalise(point.name))) {
      sum += point.y;
      count += 1;
    }
  }
  return count ? sum / count : undefined;
}

function measureFit(p: Float32Array, bones: BonePoint[]): AvatarFit {
  let feetY = Infinity;
  let crownY = -Infinity;
  let minX = Infinity;
  let maxX = -Infinity;
  for (let i = 0; i < p.length; i += 3) {
    const y = p[i + 1];
    if (y < feetY) feetY = y;
    if (y > crownY) crownY = y;
    const x = p[i];
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
  }
  const height = Math.max(crownY - feetY, 1e-3);
  const binH = height / BINS;
  /* The rig is not centred on the origin, so the width profile must be measured
     from the body's own mid-line, not from x = 0. */
  const centerX = (minX + maxX) / 2;

  /* Width profile of the body core: the innermost cluster per height band.
     Arms sit in their own (outer) cluster while separated in the A-pose, so
     this separates the torso from the arms. */
  const bands: number[][] = Array.from({ length: BINS }, () => []);
  for (let i = 0; i < p.length; i += 3) {
    let b = Math.floor((p[i + 1] - feetY) / binH);
    if (b < 0) b = 0;
    if (b >= BINS) b = BINS - 1;
    bands[b].push(Math.abs(p[i] - centerX));
  }
  const halfX = new Float32Array(BINS);
  for (let b = 0; b < BINS; b++) {
    const xs = bands[b].sort((a, c) => a - c);
    if (xs.length) halfX[b] = clusterSorted(xs)[0].max;
  }

  /* A low-poly mesh leaves some bins with no samples at all (e.g. a long shin
     triangle between ankle and knee), which would read as a zero half-width and
     drop the garment there. Interpolate the gaps so the profile stays usable. */
  let first = -1;
  let last = -1;
  for (let b = 0; b < BINS; b++) {
    if (halfX[b] <= 0) continue;
    if (first < 0) first = b;
    if (last >= 0) {
      const a = halfX[last];
      const c = halfX[b];
      for (let k = last + 1; k < b; k++) {
        halfX[k] = a + (c - a) * ((k - last) / (b - last));
      }
    }
    last = b;
  }
  if (first >= 0) {
    /* Leading and trailing gaps borrow the nearest measured value. */
    for (let b = 0; b < first; b++) halfX[b] = halfX[first];
    for (let b = last + 1; b < BINS; b++) halfX[b] = halfX[last];
  }

  /* Real anatomy from the rig. Each landmark falls back to a fraction of the
     stature so a nameless rig still dresses sensibly. */
  const hipY = landmarkY(bones, (n) => n.startsWith("pelvis")) ?? feetY + 0.52 * height;
  const collarY = landmarkY(bones, (n) => n === "spine005") ?? feetY + 0.86 * height;
  const shoulderY =
    landmarkY(bones, (n) => n.startsWith("upperarm")) ?? feetY + 0.82 * height;
  const wristY = landmarkY(bones, (n) => n.startsWith("hand")) ?? feetY + 0.5 * height;
  const ankleY = landmarkY(bones, (n) => n.startsWith("foot")) ?? feetY + 0.04 * height;
  const kneeY = landmarkY(bones, (n) => n.startsWith("shin")) ?? feetY + 0.28 * height;

  return {
    feetY,
    crownY,
    height,
    hipY,
    collarY,
    shoulderY,
    wristY,
    ankleY,
    kneeY,
    centerX,
    halfX,
    binY0: feetY,
    binH,
  };
}

/** Body half-width at a height, interpolated from the measured bins. */
export function halfXAt(fit: AvatarFit, y: number): number {
  const t = (y - fit.binY0) / fit.binH - 0.5;
  const i = Math.max(0, Math.min(fit.halfX.length - 1, Math.round(t)));
  return fit.halfX[i];
}

/**
 * Measure the rendered (skinned) body surface, in the space of `group`.
 * Must be called after the avatar is mounted so the skeletons' world matrices
 * (and each `SkinnedMesh.bindMatrixInverse`) are current.
 */
export function extractBody(
  root: THREE.Object3D,
  group: THREE.Object3D
): BodySurface | null {
  group.updateMatrixWorld(true);

  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];
  const v = new THREE.Vector3();
  const nv = new THREE.Vector3();
  const nm = new THREE.Matrix3();
  const gm = new THREE.Matrix3().getNormalMatrix(group.matrixWorld).invert();

  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    const geom = mesh.geometry as THREE.BufferGeometry;
    const pos = geom.attributes.position as THREE.BufferAttribute | undefined;
    if (!pos) return;
    const nrm = geom.attributes.normal as THREE.BufferAttribute | undefined;
    const skinned = (mesh as THREE.SkinnedMesh).isSkinnedMesh
      ? (mesh as THREE.SkinnedMesh)
      : null;
    nm.getNormalMatrix(mesh.matrixWorld);
    const base = positions.length / 3;
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      if (skinned) skinned.applyBoneTransform(i, v);
      v.applyMatrix4(mesh.matrixWorld);
      group.worldToLocal(v);
      positions.push(v.x, v.y, v.z);
      /* Authored normals are oriented outward; carry them into group space so
         the cloth offset grows away from the skin. */
      if (nrm) {
        nv.fromBufferAttribute(nrm, i).applyMatrix3(nm).applyMatrix3(gm).normalize();
        normals.push(nv.x, nv.y, nv.z);
      } else {
        normals.push(0, 0, 0);
      }
    }
    const idx = geom.index;
    if (idx) {
      for (let k = 0; k < idx.count; k++) indices.push(base + idx.getX(k));
    } else {
      for (let k = 0; k < pos.count; k++) indices.push(base + k);
    }
  });

  if (positions.length < 9 || indices.length < 3) return null;

  const P = new Float32Array(positions);
  const I = new Uint32Array(indices);
  const N = new Float32Array(normals);

  /* Fall back to area-weighted normals only when the mesh shipped none. */
  let hasNormals = false;
  for (let i = 0; i < N.length; i += 3) {
    if (N[i] || N[i + 1] || N[i + 2]) {
      hasNormals = true;
      break;
    }
  }
  if (!hasNormals) {
    const a = new THREE.Vector3();
    const b = new THREE.Vector3();
    const c = new THREE.Vector3();
    const ab = new THREE.Vector3();
    const ac = new THREE.Vector3();
    const n = new THREE.Vector3();
    for (let t = 0; t < I.length; t += 3) {
      const i0 = I[t] * 3;
      const i1 = I[t + 1] * 3;
      const i2 = I[t + 2] * 3;
      a.set(P[i0], P[i0 + 1], P[i0 + 2]);
      b.set(P[i1], P[i1 + 1], P[i1 + 2]);
      c.set(P[i2], P[i2 + 1], P[i2 + 2]);
      ab.subVectors(b, a);
      ac.subVectors(c, a);
      n.crossVectors(ab, ac);
      for (const i of [i0, i1, i2]) {
        N[i] += n.x;
        N[i + 1] += n.y;
        N[i + 2] += n.z;
      }
    }
    for (let i = 0; i < N.length; i += 3) {
      const len = Math.hypot(N[i], N[i + 1], N[i + 2]) || 1;
      N[i] /= len;
      N[i + 1] /= len;
      N[i + 2] /= len;
    }
  }

  /* This avatar GLB is authored inside-out: its winding and its normals both
     face the body interior. Signed volume is positive for an outward-facing
     hull, so flip the normals when it comes out negative — the cloth offset
     then grows away from the skin instead of sinking into it. */
  let volume = 0;
  for (let t = 0; t < I.length; t += 3) {
    const i0 = I[t] * 3;
    const i1 = I[t + 1] * 3;
    const i2 = I[t + 2] * 3;
    volume +=
      P[i0] * (P[i1 + 1] * P[i2 + 2] - P[i1 + 2] * P[i2 + 1]) -
      P[i0 + 1] * (P[i1] * P[i2 + 2] - P[i1 + 2] * P[i2]) +
      P[i0 + 2] * (P[i1] * P[i2 + 1] - P[i1 + 1] * P[i2]);
  }
  if (volume < 0) {
    for (let i = 0; i < N.length; i++) N[i] = -N[i];
  }

  return {
    positions: P,
    indices: I,
    normals: N,
    fit: measureFit(P, bonePoints(root, group)),
  };
}

/** Height bands a shape covers, and whether it wraps the arms. */
function coverage(shape: FitShape, fit: AvatarFit) {
  const h = fit.height;
  switch (shape) {
    case "trousers":
      return {
        kind: "legs" as const,
        top: fit.hipY + 0.08 * h,
        bottom: fit.ankleY + 0.03 * h,
      };
    case "crop":
      return {
        kind: "torso" as const,
        top: fit.collarY,
        bottom: fit.hipY + 0.12 * h,
        sleeveTo: fit.shoulderY - 0.14 * h,
      };
    case "tee":
      return {
        kind: "torso" as const,
        top: fit.collarY,
        bottom: fit.hipY - 0.02 * h,
        sleeveTo: fit.shoulderY - 0.09 * h,
      };
    case "vest":
      return {
        kind: "torso" as const,
        top: fit.collarY,
        bottom: fit.hipY,
        sleeveTo: null,
      };
    case "hoodie":
    case "jacket":
      return {
        kind: "torso" as const,
        top: fit.collarY,
        bottom: fit.hipY - 0.06 * h,
        sleeveTo: fit.wristY + 0.02 * h,
      };
  }
}

/**
 * Build one garment layer for a shape, as an offset copy of the body surface.
 * Returns null when the layer covers nothing.
 */
export function buildGarment(
  surface: BodySurface,
  spec: FitSpec,
  size: string | undefined,
  layer: number
): THREE.BufferGeometry | null {
  const { positions: P, indices: I, normals: N, fit } = surface;
  const pad = (CLOTH + layer * CLOTH_STEP) * (SIZE_SCALE[size ?? "M"] ?? 1);
  const cov = coverage(spec.shape, fit);

  const Q = new Float32Array(P.length);
  for (let i = 0; i < P.length; i += 3) {
    Q[i] = P[i] + N[i] * pad;
    Q[i + 1] = P[i + 1] + N[i + 1] * pad;
    Q[i + 2] = P[i + 2] + N[i + 2] * pad;
  }

  const keep = (cx: number, cy: number): boolean => {
    if (cy < cov.bottom || cy > cov.top) return false;
    const dx = Math.abs(cx - fit.centerX);
    if (cov.kind === "legs") {
      return dx <= halfXAt(fit, cy) + 0.03;
    }
    const onTorso = dx <= halfXAt(fit, cy) + 0.022;
    if (onTorso) return true;
    return cov.sleeveTo !== null && cy >= cov.sleeveTo;
  };

  const out: number[] = [];
  for (let t = 0; t < I.length; t += 3) {
    const i0 = I[t] * 3;
    const i1 = I[t + 1] * 3;
    const i2 = I[t + 2] * 3;
    const cx = (P[i0] + P[i1] + P[i2]) / 3;
    const cy = (P[i0 + 1] + P[i1 + 1] + P[i2 + 1]) / 3;
    if (!keep(cx, cy)) continue;
    out.push(I[t], I[t + 1], I[t + 2]);
  }
  if (out.length < 3) return null;

  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(Q, 3));
  g.setIndex(out);
  g.computeVertexNormals();
  return g;
}
