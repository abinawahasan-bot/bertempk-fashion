import { RoundedBox } from "@react-three/drei";

/**
 * HoodieModel — a stylised low-poly hoodie built from primitives.
 *
 * Why: the reference video (Bajuku.mp4) shows a HOODIE on a turntable, but no
 * free/CC0 standalone hoodie GLB exists (Poly Pizza/CC0 sources only ship
 * hoodie *characters*, caps, or folded tees). So we model the silhouette
 * directly: torso (+chest panel) -> prominent hood with a peak and a visible
 * opening -> sleeves + cuffs -> contrasting kangaroo pocket with seams ->
 * waistband -> drawstrings.
 *
 * To swap in a real garment GLB instead, set USE_GLB = true in GarmentTurntable.
 *
 * Scaled + shifted so it sits centred on the origin (fits the hero camera).
 */
export default function HoodieModel() {
  const fabric = (
    <meshStandardMaterial color="#34343b" roughness={0.78} metalness={0.05} />
  );
  const fabricPanel = (
    <meshStandardMaterial color="#4a4a55" roughness={0.7} metalness={0.05} />
  );
  const fabricDark = (
    <meshStandardMaterial color="#161618" roughness={0.9} metalness={0.03} />
  );

  return (
    <group scale={0.82} position={[0, -0.35, 0]}>
      {/* Torso */}
      <RoundedBox args={[1.5, 1.7, 0.82]} radius={0.22} smoothness={4} position={[0, 0, 0]}>
        {fabric}
      </RoundedBox>

      {/* Chest panel (adds shape / breaks the flat slab) */}
      <RoundedBox args={[1.52, 0.72, 0.86]} radius={0.24} smoothness={4} position={[0, 0.34, 0]}>
        {fabric}
      </RoundedBox>

      {/* Shoulder yoke */}
      <RoundedBox args={[1.58, 0.5, 0.84]} radius={0.24} smoothness={4} position={[0, 0.66, 0]}>
        {fabric}
      </RoundedBox>

      {/* ---- Hood ---- */}
      {/* Back / top dome */}
      <mesh position={[0, 1.18, -0.26]} scale={[1.06, 1.16, 0.96]}>
        <sphereGeometry args={[0.62, 32, 24]} />
        {fabric}
      </mesh>
      {/* Peak (subtle point at the top-back) */}
      <mesh position={[0, 1.6, -0.3]} scale={[0.82, 1.0, 0.86]}>
        <sphereGeometry args={[0.32, 24, 18]} />
        {fabric}
      </mesh>
      {/* Opening rim (tilted ring at the front) */}
      <mesh position={[0, 1.14, 0.26]} rotation={[Math.PI / 2 - 0.45, 0, 0]}>
        <torusGeometry args={[0.45, 0.15, 18, 44]} />
        {fabric}
      </mesh>
      {/* Opening interior (dark) */}
      <mesh position={[0, 1.12, 0.16]} scale={[0.95, 0.95, 0.7]}>
        <sphereGeometry args={[0.42, 24, 18]} />
        {fabricDark}
      </mesh>

      {/* Sleeves */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 0.84, 0.34, 0]} rotation={[0, 0, s * -0.62]}>
          <mesh>
            <cylinderGeometry args={[0.3, 0.25, 1.2, 24]} />
            {fabric}
          </mesh>
          <mesh position={[0, -0.63, 0]}>
            <cylinderGeometry args={[0.26, 0.26, 0.18, 24]} />
            {fabricDark}
          </mesh>
        </group>
      ))}

      {/* Kangaroo pocket (lighter panel + seams so it reads) */}
      <RoundedBox args={[1.08, 0.64, 0.24]} radius={0.08} smoothness={3} position={[0, -0.42, 0.44]}>
        {fabricPanel}
      </RoundedBox>
      {/* Pocket top seam */}
      <mesh position={[0, -0.11, 0.47]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.022, 0.022, 1.06, 10]} />
        {fabricDark}
      </mesh>
      {/* Pocket side seams */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.53, -0.42, 0.4]} rotation={[0, 0, s * 0.2]}>
          <cylinderGeometry args={[0.022, 0.022, 0.62, 10]} />
          {fabricDark}
        </mesh>
      ))}

      {/* Waistband */}
      <RoundedBox args={[1.54, 0.24, 0.86]} radius={0.08} smoothness={3} position={[0, -0.94, 0]}>
        {fabricDark}
      </RoundedBox>

      {/* Drawstrings */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.15, 0.74, 0.42]}>
          <cylinderGeometry args={[0.03, 0.03, 0.46, 12]} />
          {fabricDark}
        </mesh>
      ))}
    </group>
  );
}
