import { Component, Suspense, lazy, useState, type ReactNode } from "react";
import MannequinSvg from "./MannequinSvg";
import type { MannequinProps } from "../types";

/**
 * Mannequin — the fitting-room stage.
 *
 * Renders the real 3D mannequin (Mannequin3D) and degrades to the flat vector
 * one (MannequinSvg) when WebGL is missing or the 3D chunk fails to load, so
 * the stage is never blank.
 */
const Mannequin3D = lazy(() => import("./Mannequin3D"));

/* Probed once per session: creating a context is not free, and StrictMode
   would otherwise run the initialiser twice on mount. */
let webglProbe: boolean | null = null;

function hasWebGL(): boolean {
  if (webglProbe !== null) return webglProbe;
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    if (!gl) {
      webglProbe = false;
      return false;
    }
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    webglProbe = true;
    return true;
  } catch {
    webglProbe = false;
    return false;
  }
}

/** Catches a failed WebGL context (or 3D chunk) and falls back to the SVG. */
class StageBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    // A silent fallback hides real regressions — always leave a trace.
    console.error("[Mannequin] 3D stage failed; using the SVG fallback:", error);
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export default function Mannequin(props: MannequinProps) {
  const [webgl] = useState(hasWebGL);

  if (!webgl) return <MannequinSvg {...props} />;

  return (
    <StageBoundary fallback={<MannequinSvg {...props} />}>
      <Suspense fallback={<MannequinSvg {...props} />}>
        <Mannequin3D {...props} />
      </Suspense>
    </StageBoundary>
  );
}
