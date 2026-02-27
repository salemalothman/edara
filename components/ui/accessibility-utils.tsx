"use client"

import * as React from "react"

/**
 * VisuallyHidden - Component for screen reader text that's visually hidden
 */
export function VisuallyHidden({ children }: { children: React.ReactNode }) {
  return <span className="sr-only">{children}</span>
}

/**
 * FocusTrap - Component to trap focus within a container
 */
export function FocusTrap({ children }: { children: React.ReactNode }) {
  const containerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Find all focusable elements
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    )

    if (focusableElements.length === 0) return

    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

    // Focus the first element
    firstElement.focus()

    // Handle tab key to cycle through elements
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return

      if (e.shiftKey) {
        // If shift+tab on first element, move to last
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement.focus()
        }
      } else {
        // If tab on last element, move to first
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement.focus()
        }
      }
    }

    container.addEventListener("keydown", handleKeyDown)
    return () => container.removeEventListener("keydown", handleKeyDown)
  }, [])

  return <div ref={containerRef}>{children}</div>
}

/**
 * KeyboardShortcut - Component to display keyboard shortcuts
 */
export function KeyboardShortcut({
  keys,
  separator = "+",
  className = "text-xs text-muted-foreground ml-2",
}: {
  keys: string[]
  separator?: string
  className?: string
}) {
  return (
    <kbd className={className}>
      {keys.map((key, index) => (
        <React.Fragment key={index}>
          {index > 0 && <span className="mx-0.5">{separator}</span>}
          <span className="rounded border border-input px-1.5 py-0.5 font-mono text-[10px] font-medium">{key}</span>
        </React.Fragment>
      ))}
    </kbd>
  )
}
