import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import useReducedMotion from "../lib/useReducedMotion";
import HoodieModel from "./HoodieModel";

/**
 * GarmentTurntable — hero element matching Bajuku.mp4 (t≈0–1.5s):
 * a dark garment slowly rotating in-place on a studio "turntable".
 *
 * Default garment = procedural hoodie (HoodieModel), because the video shows a
 * hoodie and no free/CC0 standalone hoodie GLB exists.
 *
 * To use a real garment GLB instead, drop it at public/model/garment.glb and
 * set USE_GLB = true — no other change required.
 *
 * The reference photos (bajuku 1/2) are used only as STUDY material.
 */
const USE_GLB = false;
const MODEL_URL = "/model/garment.glb";

/** Real garment GLB: recoloured matte-black, recentred and normalised. */
function GlbModel() {
  const { scene } = useGLTF(MODEL_URL);
  return useMemo(() => {
    const inner = scene.clone(true);
    const dark = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#141416"),
      roughness: 0.8,
      metalness: 0.1,
    });
    inner.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.isMesh) mesh.material = dark;
    });
    const box = new THREE.Box3().setFromObject(inner);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    inner.position.sub(center);
    const wrapper = new THREE.Group();
    wrapper.add(inner);
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    wrapper.scale.setScalar(2.4 / maxDim);
    return <primitive object={wrapper} />;
  }, [scene]);
}

function RotatingGarment({ spin }: { spin: boolean }) {
  const group = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (spin && group.current) group.current.rotation.y += delta * 0.45;
  });
  return (
    <group ref={group} rotation={[0, -0.35, 0]}>
      {USE_GLB ? <GlbModel /> : <HoodieModel />}
    </group>
  );
}

export default function GarmentTurntable() {
  const reduced = useReducedMotion();
  return (
    <Canvas
      dpr={[1, 1.8]}
      gl={{ antialias: true, alpha: true }}
      camera={{ position: [0, 0.05, 4.9], fov: 34 }}
    >
      <ambientLight intensity={0.55} />
      <directionalLight position={[4, 5, 6]} intensity={2.1} />
      <directionalLight position={[-4, 2, -5]} intensity={1} />
      <pointLight position={[-4.5, 1.5, -3]} intensity={40} color="#d8f808" distance={16} />
      <pointLight position={[3.5, -1, 3]} intensity={12} color="#f84848" distance={16} />
      <RotatingGarment spin={!reduced} />
      <ContactShadows
        position={[0, -1.25, 0]}
        opacity={0.55}
        scale={6}
        blur={2.6}
        far={3}
        color="#000000"
      />
    </Canvas>
  );
}

if (USE_GLB) useGLTF.preload(MODEL_URL);
