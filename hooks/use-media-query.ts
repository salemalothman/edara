"use client"

import { useState, useEffect } from "react"

/**
 * Hook to check if a media query matches
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    // Default to true for SSR
    if (typeof window === "undefined") {
      return
    }

    const mediaQuery = window.matchMedia(query)
    setMatches(mediaQuery.matches)

    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
    }

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", listener)
      return () => mediaQuery.removeEventListener("change", listener)
    }
    // Older browsers
    else {
      mediaQuery.addListener(listener)
      return () => mediaQuery.removeListener(listener)
    }
  }, [query])

  return matches
}
