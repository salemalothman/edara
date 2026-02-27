"use client"
import { useRouter } from "next/navigation"
import { Button, type ButtonProps } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import { useLanguage } from "@/hooks/use-language"

interface BackButtonProps extends Omit<ButtonProps, "onClick"> {
  route?: string
  onBack?: () => void
  label?: string
}

/**
 * BackButton - A consistent button for navigation back to previous pages
 */
export function BackButton({ route, onBack, label, ...props }: BackButtonProps) {
  const router = useRouter()
  const { t } = useLanguage()

  const handleClick = () => {
    if (onBack) {
      onBack()
    } else if (route) {
      router.push(route)
    } else {
      router.back()
    }
  }

  return (
    <Button variant="outline" size="sm" className="mb-4" onClick={handleClick} {...props}>
      <ChevronLeft className="mr-2 rtl:ml-2 rtl:mr-0 h-4 w-4" />
      {label || t("common.back")}
    </Button>
  )
}
