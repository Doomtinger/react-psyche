"use client";

import { createContext, useContext, useEffect, useState } from "react";

/**
 * Single source of truth for "phone mode". CSS uses the same 768px breakpoint
 * for layout (so the first paint is already correct), while this hook drives
 * behaviour that CSS cannot express: touch interactions, default views,
 * copy wording and GPU budget.
 *
 * `null` means "not measured yet" (SSR or before hydration) — components
 * should treat it as desktop and switch once the client has measured.
 */
export const MOBILE_BREAKPOINT = 768;

export type IsMobileState = boolean | null;

const IsMobileContext = createContext<IsMobileState>(null);

export function IsMobileProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobile, setIsMobile] = useState<IsMobileState>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`);
    const sync = () => {
      const mobile = mq.matches;
      setIsMobile(mobile);
      // Expose the same decision to CSS/debugging without waiting for React.
      document.documentElement.dataset.mobile = mobile ? "true" : "false";
    };
    sync();
    mq.addEventListener("change", sync);
    return () => {
      mq.removeEventListener("change", sync);
      delete document.documentElement.dataset.mobile;
    };
  }, []);

  return (
    <IsMobileContext.Provider value={isMobile}>
      {children}
    </IsMobileContext.Provider>
  );
}

/** `true` on phones, `false` on larger screens, `null` before measurement. */
export function useIsMobile(): IsMobileState {
  return useContext(IsMobileContext);
}
