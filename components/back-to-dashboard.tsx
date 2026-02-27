"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ChevronLeft, Home } from "lucide-react"
import { useLanguage } from "@/hooks/use-language"
import { TooltipButton } from "@/components/ui/tooltip-button"
import { useMediaQuery } from "@/hooks/use-media-query"
import { TooltipProvider } from "@/components/ui/tooltip"

interface BackToDashboardProps {
  route?: string
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg"
  className?: string
}

export function BackToDashboard({ route = "/", variant = "outline", size = "sm", className }: BackToDashboardProps) {
  const router = useRouter()
  const { t } = useLanguage()
  const isSmallScreen = useMediaQuery("(max-width: 640px)")

  const handleClick = () => {
    router.push(route)
  }

  // On small screens, show icon-only button with tooltip
  if (isSmallScreen) {
    return (
      <TooltipProvider>
        <TooltipButton
          tooltipContent={t("common.backToDashboard")}
          variant={variant}
          size={size}
          className={className}
          onClick={handleClick}
        >
          <Home className="h-4 w-4" />
        </TooltipButton>
      </TooltipProvider>
    )
  }

  return (
    <Button variant={variant} size={size} className={className} onClick={handleClick}>
      <ChevronLeft className="mr-2 rtl:ml-2 rtl:mr-0 h-4 w-4" />
      {t("common.backToDashboard")}
    </Button>
  )
}
