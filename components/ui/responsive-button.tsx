"use client"

import type * as React from "react"
import { Button, type ButtonProps } from "@/components/ui/button"
import { useMediaQuery } from "@/hooks/use-media-query"
import { TooltipButton } from "@/components/ui/tooltip-button"

interface ResponsiveButtonProps extends ButtonProps {
  iconOnly?: boolean // Force icon-only mode regardless of screen size
  responsiveBreakpoint?: string // CSS media query string
  icon: React.ReactNode
  label: React.ReactNode
  tooltipContent?: React.ReactNode
}

/**
 * ResponsiveButton - A button that adapts between icon-only and full label based on screen size
 */
export function ResponsiveButton({
  iconOnly = false,
  responsiveBreakpoint = "(max-width: 640px)", // Default to small screens
  icon,
  label,
  tooltipContent,
  ...props
}: ResponsiveButtonProps) {
  const isSmallScreen = useMediaQuery(responsiveBreakpoint)
  const showIconOnly = iconOnly || isSmallScreen

  // If we have tooltip content and we're showing icon only, use TooltipButton
  if (tooltipContent && showIconOnly) {
    return (
      <TooltipButton tooltipContent={tooltipContent} {...props}>
        {icon}
      </TooltipButton>
    )
  }

  return (
    <Button {...props}>
      {icon}
      {!showIconOnly && <span className="ml-2 rtl:mr-2 rtl:ml-0">{label}</span>}
    </Button>
  )
}
