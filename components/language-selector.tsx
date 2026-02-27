"use client"

import { useLanguage } from "@/contexts/language-context"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Globe, Check } from "lucide-react"
import { useState } from "react"

export function LanguageSelector() {
  const { language, setLanguage, t } = useLanguage()
  const [isChanging, setIsChanging] = useState(false)

  const handleLanguageChange = async (newLanguage: "en" | "ar") => {
    if (language === newLanguage) return

    setIsChanging(true)

    try {
      // Simulate a delay for language resources loading
      await new Promise((resolve) => setTimeout(resolve, 300))
      setLanguage(newLanguage)
    } finally {
      setIsChanging(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-9 w-9 rounded-full transition-all duration-200 hover:bg-muted",
            isChanging && "animate-pulse",
          )}
          disabled={isChanging}
          aria-label={t("common.language")}
        >
          <Globe className={cn("h-5 w-5", isChanging && "animate-spin")} />
          <span className="sr-only">{t("common.language")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-40 rounded-md border border-border shadow-md animate-in fade-in-80 zoom-in-95"
      >
        <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground border-b">
          {t("common.selectLanguage")}
        </div>
        <LanguageOption
          language="en"
          currentLanguage={language}
          flag="🇺🇸"
          name={t("common.english")}
          onChange={handleLanguageChange}
        />
        <LanguageOption
          language="ar"
          currentLanguage={language}
          flag="🇰🇼"
          name={t("common.arabic")}
          onChange={handleLanguageChange}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Add this new component for language options
interface LanguageOptionProps {
  language: "en" | "ar"
  currentLanguage: string
  flag: string
  name: string
  onChange: (language: "en" | "ar") => void
}

function LanguageOption({ language, currentLanguage, flag, name, onChange }: LanguageOptionProps) {
  const isActive = language === currentLanguage

  return (
    <DropdownMenuItem
      onClick={() => onChange(language)}
      className={cn(
        "flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors duration-200",
        isActive ? "bg-primary/10 text-primary font-medium" : "hover:bg-accent",
      )}
    >
      <span className="flex items-center justify-center w-6 h-6 rounded-full overflow-hidden text-lg">{flag}</span>
      <span className="flex-1">{name}</span>
      {isActive && <Check className="h-4 w-4 text-primary" />}
    </DropdownMenuItem>
  )
}

// Helper function to conditionally join class names
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ")
}
