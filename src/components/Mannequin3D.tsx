import {
  Suspense,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { ContactShadows, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { layerOrder, resolveFit } from "../constants/fit";
import {
  bonePoints,
  buildGarment,
  extractBody,
  type BodySurface,
} from "../lib/avatar";
import type { Gender, MannequinProps } from "../types";

declare global {
  interface Window {
    /** Dev-only probe: the measured avatar fit and the garments built from it. */
    __avatarFit?: unknown;
  }
}

/** Stage metrics (world units): feet land on the floor, head near +0.95. */
const TARGET_HEIGHT = 1.9;
const FLOOR_Y = -0.95;

const BODY_URL: Record<Gender, string> = {
  male: "/model/cogan.glb",
  female: "/model/cecan.glb",
};

/*
 * No module-scope `useGLTF.preload`: cogan.glb is 4.4 MB and cecan.glb 3.4 MB,
 * so preloading both pulled 7.8 MB on every fitting-room open to display one of
 * them. `useGLTF` inside `GlbBody` fetches the avatar that is actually worn and
 * caches it; switching gender fetches the other then, which is the only moment
 * it is needed.
 */
interface NavigatorHints {
  /** Non-standard, but shipped by Chrome/Edge. Absent elsewhere. */
  deviceMemory?: number;
}

/**
 * Multisampling is the expensive part of the WebGL setup on a phone-sized
 * canvas; the fitting room is a 290 px panel that is never animated, so a
 * constrained device gets the cheaper pipeline. Reported honestly as a hint —
 * a device that lies about its memory still renders, just without MSAA.
 */
function isConstrainedDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  if (typeof window !== "undefined" && window.matchMedia?.("(max-width: 640px)").matches) {
    return true;
  }
  const hints = navigator as Navigator & NavigatorHints;
  const memory = hints.deviceMemory;
  const cores = navigator.hardwareConcurrency;
  return memory !== undefined && memory <= 4 && cores !== undefined && cores <= 4;
}

/**
 * Cloth materials, cached by tone. A garment is an offset copy of the body
 * surface (see `lib/avatar.ts`), rendered double-sided and nudged toward the
 * camera with a polygon offset so it never z-fights the skin underneath.
 */
const clothMaterials = new Map<string, THREE.MeshStandardMaterial>();
function clothMaterial(tone: string): THREE.MeshStandardMaterial {
  let material = clothMaterials.get(tone);
  if (!material) {
    material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(tone),
      roughness: 0.9,
      metalness: 0.05,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
    clothMaterials.set(tone, material);
  }
  return material;
}

interface WornLayer {
  id: string;
  geometry: THREE.BufferGeometry;
  material: THREE.MeshStandardMaterial;
}

function GlbBody({ gender = "male", picks, colors, sizes }: MannequinProps) {
  const { scene } = useGLTF(BODY_URL[gender]);

  const root = useMemo(() => {
    scene.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      // The rig is authored so its bounding box does not track the skinned
      // pose — keep it out of frustum culling or it can pop out of view.
      mesh.frustumCulled = false;
      const geometry = mesh.geometry as THREE.BufferGeometry;
      if (!geometry.attributes.normal) geometry.computeVertexNormals();
    });
    return scene;
  }, [scene]);

  /**
   * These avatars are authored Y-up with the feet at y≈0 (unlike the old
   * Z-up primitive), so we can't reuse `bodyMetrics`' bespoke scale/offset.
   * Instead we measure the loaded model once and place it deterministically:
   * scale to the stage height, centre X/Z, and sit the feet on the floor.
   */
  const fit = useMemo(() => {
    root.updateWorldMatrix(true, true);
    const box = new THREE.Box3().setFromObject(root);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const scale = TARGET_HEIGHT / (size.y || 1);
    return {
      scale,
      position: [
        -center.x * scale,
        FLOOR_Y - box.min.y * scale,
        -center.z * scale,
      ] as [number, number, number],
    };
  }, [root]);

  const groupRef = useRef<THREE.Group>(null);
  const [surface, setSurface] = useState<BodySurface | null>(null);

  /* Measure the *rendered* (skinned) body once it is attached to the stage.
     A retry on the next frame covers the case where the skeleton's world
     matrices are not current yet on the very first layout pass. */
  useLayoutEffect(() => {
    const group = groupRef.current;
    if (!group) return;
    let raf = 0;
    const measure = () => {
      const measured = extractBody(root, group);
      if (measured) setSurface(measured);
      else raf = requestAnimationFrame(measure);
    };
    measure();
    return () => cancelAnimationFrame(raf);
  }, [root]);

  const layers = useMemo<WornLayer[]>(() => {
    if (!surface) return [];
    return layerOrder(picks).flatMap((product, layer) => {
      const spec = resolveFit(product, colors[product.id] ?? 0);
      const geometry = buildGarment(surface, spec, sizes?.[product.id], layer);
      return geometry
        ? [{ id: product.id, geometry, material: clothMaterial(spec.tone) }]
        : [];
    });
  }, [surface, picks, colors, sizes]);

  /* Rebuilt geometries are discarded as soon as the set of layers changes. */
  useEffect(
    () => () => {
      for (const layer of layers) layer.geometry.dispose();
    },
    [layers]
  );

  /* Dev-only probe so the measured fit can be inspected without a rebuild. */
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const group = groupRef.current;
    const LANDMARK =
      /^(spine|spine\d{3}|face|(shoulder|upper_arm|forearm|hand|pelvis|thigh|shin|foot|toe|breast)[LR])$/;
    const bones = group
      ? Object.fromEntries(
          bonePoints(root, group)
            .filter((b) => LANDMARK.test(b.name))
            .map((b) => [b.name, +b.y.toFixed(4)])
        )
      : undefined;
    window.__avatarFit = surface
      ? {
          gender,
          height: +surface.fit.height.toFixed(4),
          hipY: +surface.fit.hipY.toFixed(4),
          collarY: +surface.fit.collarY.toFixed(4),
          shoulderY: +surface.fit.shoulderY.toFixed(4),
          wristY: +surface.fit.wristY.toFixed(4),
          ankleY: +surface.fit.ankleY.toFixed(4),
          kneeY: +surface.fit.kneeY.toFixed(4),
          centerX: +surface.fit.centerX.toFixed(4),
          outwardXZ: (() => {
            /* Mean dot of each normal with the outward radial in the XZ plane:
               a standing body's normals point away from its vertical axis, so
               a positive value means normals are oriented outward. */
            const P = surface.positions;
            const Nn = surface.normals;
            let cx = 0;
            let cz = 0;
            const n = P.length / 3;
            for (let i = 0; i < P.length; i += 3) {
              cx += P[i];
              cz += P[i + 2];
            }
            cx /= n;
            cz /= n;
            let sum = 0;
            for (let i = 0; i < P.length; i += 3) {
              const dx = P[i] - cx;
              const dz = P[i + 2] - cz;
              const dl = Math.hypot(dx, dz) || 1;
              sum += (Nn[i] * dx + Nn[i + 2] * dz) / dl;
            }
            return { cx: +cx.toFixed(3), cz: +cz.toFixed(3), dot: +(sum / n).toFixed(3) };
          })(),
          windingDotRadial: (() => {
            /* Same radial test but using normals derived from triangle winding.
               Comparing the two reveals whether winding and authored normals
               agree. */
            const P = surface.positions;
            const I = surface.indices;
            let cx = 0;
            let cz = 0;
            const n = P.length / 3;
            for (let i = 0; i < P.length; i += 3) {
              cx += P[i];
              cz += P[i + 2];
            }
            cx /= n;
            cz /= n;
            let sum = 0;
            let cnt = 0;
            for (let t = 0; t < I.length; t += 3) {
              const i0 = I[t] * 3;
              const i1 = I[t + 1] * 3;
              const i2 = I[t + 2] * 3;
              const abx = P[i1] - P[i0];
              const aby = P[i1 + 1] - P[i0 + 1];
              const abz = P[i1 + 2] - P[i0 + 2];
              const acx = P[i2] - P[i0];
              const acy = P[i2 + 1] - P[i0 + 1];
              const acz = P[i2 + 2] - P[i0 + 2];
              const nx = aby * acz - abz * acy;
              const nz = abx * acy - aby * acx;
              const mx = (P[i0] + P[i1] + P[i2]) / 3 - cx;
              const mz = (P[i0 + 2] + P[i1 + 2] + P[i2 + 2]) / 3 - cz;
              const nl = Math.hypot(nx, nz) || 1;
              const ml = Math.hypot(mx, mz) || 1;
              sum += (nx * mx + nz * mz) / (nl * ml);
              cnt += 1;
            }
            return +(sum / cnt).toFixed(3);
          })(),
          vertices: surface.positions.length / 3,
          triangles: surface.indices.length / 3,
          halfX: Array.from(surface.fit.halfX).map((v) => +v.toFixed(3)),
          layers: layers.map((layer) => {
            /* Bounds over the triangles actually kept, not the whole vertex pool. */
            const g = layer.geometry;
            const pos = g.attributes.position as THREE.BufferAttribute;
            const idx = g.index!;
            let minY = Infinity;
            let maxY = -Infinity;
            let minX = Infinity;
            let maxX = -Infinity;
            for (let k = 0; k < idx.count; k++) {
              const i = idx.getX(k);
              const x = pos.getX(i);
              const y = pos.getY(i);
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
            }
            return {
              id: layer.id,
              tris: idx.count / 3,
              y: [+minY.toFixed(3), +maxY.toFixed(3)],
              x: [+minX.toFixed(3), +maxX.toFixed(3)],
            };
          }),
          bones,
        }
      : { gender, error: "measure failed", bones };
  }, [surface, layers, gender, root]);

  return (
    <group ref={groupRef} scale={fit.scale} position={fit.position}>
      <primitive object={root} />
      {layers.map((layer) => (
        <mesh key={layer.id} geometry={layer.geometry} material={layer.material} />
      ))}
    </group>
  );
}

export default function Mannequin3D(props: MannequinProps) {
  const { gender = "male" } = props;
  return (
    <Canvas
      gl={{ antialias: !isConstrainedDevice(), alpha: true }}
      // 2× on a 290 px panel is fill-rate nobody can see; 1.5 still reads crisp.
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 5.15], fov: 30 }}
      // Nothing in this scene animates (no useFrame, no controls), so an
      // "always" loop redrew an identical image 60×/s for as long as the
      // fitting room stayed open. "demand" renders only when something really
      // changes — and `DemandInvalidator` below guarantees that is true for a
      // pick, size, colour or gender change, not just a reconciled instance.
      frameloop="demand"
    >
      <ambientLight intensity={0.52} />
      <hemisphereLight args={["#ffffff", "#2b2b2b", 0.42]} />
      <directionalLight position={[3.4, 5, 4]} intensity={1.75} />
      <directionalLight position={[-4, 2.2, -4]} intensity={0.75} />
      <pointLight
        position={[-2.6, 1.3, -2.2]}
        intensity={22}
        color="#d8f808"
        distance={13}
      />
      <pointLight
        position={[2.4, -1.6, 2.2]}
        intensity={9}
        color="#f84848"
        distance={13}
      />
      <Suspense fallback={null}>
        <GlbBody {...props} gender={gender} />
      </Suspense>
      {/*
        Inside the boundary, not outside it: `frames={1}` bakes the shadow on
        its first frame, and that frame must already contain the avatar or the
        bake would be an empty plane. The shadow's frame counter lives in the
        component body, so a later pick/size/colour change re-renders this and
        re-bakes once against the new silhouette — never per frame.
      */}
      <Suspense fallback={null}>
        <ContactShadows
          position={[0, -0.958, 0]}
          opacity={0.5}
          scale={4.2}
          blur={2.4}
          frames={1}
        />
      </Suspense>
      {/*
        `frameloop="demand"` only renders when invalidate() is called. React
        prop diffs do that for some changes, but a size/colour swap rebuilds
        garment geometry behind an otherwise-identical mesh, so tick the frame
        on every real user change explicitly.
      */}
      <DemandInvalidator
        picks={props.picks}
        colors={props.colors}
        sizes={props.sizes}
        gender={gender}
      />
    </Canvas>
  );
}

/**
 * A `frameloop="demand"` canvas is only correct if every state change actually
 * requests a frame. React reconciliation already does this for added/removed
 * instances, but a size or colour swap rebuilds garment geometry behind a mesh
 * whose props are otherwise identical, so ask for the frame explicitly rather
 * than relying on the renderer noticing.
 */
function DemandInvalidator({
  picks,
  colors,
  sizes,
  gender,
}: Pick<MannequinProps, "picks" | "colors" | "sizes"> & { gender: Gender }) {
  const invalidate = useThree((state) => state.invalidate);
  useEffect(() => {
    invalidate();
  }, [invalidate, picks, colors, sizes, gender]);
  return null;
}
