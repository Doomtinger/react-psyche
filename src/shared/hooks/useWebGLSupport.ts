"use client";

import { useEffect, useState } from "react";

/**
 * Detect WebGL availability once on the client. The Mind Atlas is only mounted
 * client-side (dynamic import, ssr:false), so this is safe to use there.
 */
export function useWebGLSupport(): boolean | null {
  const [supported, setSupported] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      if (typeof document === "undefined") {
        setSupported(null);
        return;
      }
      const canvas = document.createElement("canvas");
      const gl =
        canvas.getContext("webgl") ||
        canvas.getContext("experimental-webgl");
      setSupported(Boolean(gl));
    } catch {
      setSupported(false);
    }
  }, []);

  return supported;
}
