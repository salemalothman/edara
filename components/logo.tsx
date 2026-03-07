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
      {/* Sailboat Logo Icon */}
      <div className={cn("relative", sizes[size].icon)}>
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
          {/* Main sail */}
          <path
            d="M52 8C52 8 78 45 78 70C78 70 52 62 52 62V8Z"
            stroke="currentColor"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            className="text-primary"
          />
          {/* Jib sail */}
          <path
            d="M48 18C48 18 30 50 28 70C28 70 48 62 48 62V18Z"
            stroke="currentColor"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            className="text-primary"
          />
          {/* Hull */}
          <path
            d="M38 72C38 72 42 82 50 82C58 82 62 72 62 72"
            stroke="currentColor"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            className="text-primary"
          />
          {/* Waterline */}
          <line
            x1="30"
            y1="86"
            x2="74"
            y2="86"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            className="text-primary"
          />
        </svg>
      </div>

      {/* Logo Text - only show if variant is full */}
      {variant === "full" && (
        <span className={cn("font-bold tracking-tight text-primary", sizes[size].text)}>Edara</span>
      )}
    </div>
  )
}
