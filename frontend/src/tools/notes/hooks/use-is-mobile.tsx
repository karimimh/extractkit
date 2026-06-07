import { useEffect, useState } from "react";

export function useIsMobile(): boolean {
  const MOBILE_BREAKPOINT = 640;

  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;

    // Check both window.innerWidth and media query for better DevTools support
    const mediaQuery = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    return mediaQuery.matches || window.innerWidth < MOBILE_BREAKPOINT;
  });

  useEffect(() => {
    function checkIsMobile() {
      const mediaQuery = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
      setIsMobile(mediaQuery.matches || window.innerWidth < MOBILE_BREAKPOINT);
    }

    // Check on mount and whenever the window resizes
    checkIsMobile();

    window.addEventListener("resize", checkIsMobile);
    window.addEventListener("orientationchange", checkIsMobile);

    // Additional listener for DevTools viewport changes
    const mediaQuery = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const handleMediaQueryChange = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
    };

    mediaQuery.addEventListener("change", handleMediaQueryChange);

    return () => {
      window.removeEventListener("resize", checkIsMobile);
      window.removeEventListener("orientationchange", checkIsMobile);
      mediaQuery.removeEventListener("change", handleMediaQueryChange);
    };
  }, []);

  return isMobile;
}
