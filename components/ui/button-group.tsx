"use client"

import type * as React from "react"
import { cn } from "@/lib/utils"

interface ButtonGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "horizontal" | "vertical"
  spacing?: "default" | "compact" | "none"
  fullWidth?: boolean
  children: React.ReactNode
}

/**
 * ButtonGroup - A component for grouping related buttons with consistent spacing
 */
export function ButtonGroup({
  orientation = "horizontal",
  spacing = "default",
  fullWidth = false,
  className,
  children,
  ...props
}: ButtonGroupProps) {
  return (
    <div
      className={cn(
        "flex",
        orientation === "horizontal" ? "flex-row" : "flex-col",
        spacing === "default" && orientation === "horizontal" && "space-x-2 rtl:space-x-reverse",
        spacing === "default" && orientation === "vertical" && "space-y-2",
        spacing === "compact" && orientation === "horizontal" && "space-x-1 rtl:space-x-reverse",
        spacing === "compact" && orientation === "vertical" && "space-y-1",
        fullWidth && "w-full",
        fullWidth && orientation === "horizontal" && "[&>*]:flex-1",
        className,
      )}
      role="group"
      {...props}
    >
      {children}
    </div>
  )
}
