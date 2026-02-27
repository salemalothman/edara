"use client"

import type * as React from "react"
import { Button, type ButtonProps } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface TooltipButtonProps extends ButtonProps {
  tooltipContent: React.ReactNode
  tooltipSide?: "top" | "right" | "bottom" | "left"
  tooltipAlign?: "start" | "center" | "end"
  tooltipDelayDuration?: number
}

/**
 * TooltipButton - A button with a tooltip for additional context
 */
export function TooltipButton({
  tooltipContent,
  tooltipSide = "top",
  tooltipAlign = "center",
  tooltipDelayDuration = 300,
  children,
  ...props
}: TooltipButtonProps) {
  return (
    <TooltipProvider delayDuration={tooltipDelayDuration}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button {...props}>{children}</Button>
        </TooltipTrigger>
        <TooltipContent side={tooltipSide} align={tooltipAlign}>
          {tooltipContent}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
