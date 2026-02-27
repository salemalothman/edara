"use client"

import { useLanguage } from "@/hooks/use-language"
import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
  size?: "sm" | "md" | "lg"
  variant?: "full" | "icon"
}

export function Logo({ className, size = "md", variant = "full" }: LogoProps) {
  const { language } = useLanguage()
  const isRtl = language === "ar"

  // Size mappings
  const sizes = {
    sm: {
      container: "h-6",
      icon: "h-6 w-6",
      text: "text-sm",
    },
    md: {
      container: "h-8",
      icon: "h-8 w-8",
      text: "text-xl",
    },
    lg: {
      container: "h-12",
      icon: "h-12 w-12",
      text: "text-2xl",
    },
  }

  return (
    <div className={cn("flex items-center gap-2 rtl:flex-row-reverse", sizes[size].container, className)}>
      {/* Logo Icon */}
      <div className={cn("relative", sizes[size].icon)}>
        <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
          {/* Base shape */}
          <rect x="4" y="12" width="32" height="24" rx="2" fill="#E2E8F0" />

          {/* Building elements */}
          <rect x="8" y="16" width="8" height="8" rx="1" fill="#64748B" />
          <rect x="8" y="26" width="8" height="6" rx="1" fill="#64748B" />
          <rect x="20" y="16" width="12" height="16" rx="1" fill="#3B82F6" />

          {/* Roof/top element */}
          <path d="M4 10C4 8.89543 4.89543 8 6 8H34C35.1046 8 36 8.89543 36 10V12H4V10Z" fill="#3B82F6" />
        </svg>
      </div>

      {/* Logo Text - only show if variant is full */}
      {variant === "full" && (
        <span className={cn("font-bold tracking-tight text-primary", sizes[size].text)}>Edara</span>
      )}
    </div>
  )
}
