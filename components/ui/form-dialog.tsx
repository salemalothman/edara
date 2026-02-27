"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/hooks/use-language"
import { ButtonGroup } from "@/components/ui/button-group"

interface FormDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  title: React.ReactNode
  description?: React.ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
  trigger?: React.ReactNode
  onSubmit?: () => void
  isSubmitting?: boolean
  submitLabel?: string
  cancelLabel?: string
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full"
  preventClose?: boolean
}

export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  trigger,
  onSubmit,
  isSubmitting = false,
  submitLabel,
  cancelLabel,
  maxWidth = "md",
  preventClose = false,
}: FormDialogProps) {
  const { t } = useLanguage()
  const [internalOpen, setInternalOpen] = React.useState(false)

  // Use controlled or uncontrolled open state
  const isOpen = open !== undefined ? open : internalOpen
  const setIsOpen = onOpenChange || setInternalOpen

  // Handle dialog close attempt
  const handleOpenChange = (newOpen: boolean) => {
    if (preventClose && isSubmitting && !newOpen) {
      return // Prevent closing during submission
    }
    setIsOpen(newOpen)
  }

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (onSubmit) {
      onSubmit()
    }
  }

  // Determine max width class
  const maxWidthClass = React.useMemo(() => {
    switch (maxWidth) {
      case "sm":
        return "sm:max-w-sm"
      case "md":
        return "sm:max-w-md"
      case "lg":
        return "sm:max-w-lg"
      case "xl":
        return "sm:max-w-xl"
      case "2xl":
        return "sm:max-w-2xl"
      case "full":
        return "sm:max-w-full"
      default:
        return "sm:max-w-md"
    }
  }, [maxWidth])

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className={maxWidthClass}>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>

          <div className="py-4">{children}</div>

          <DialogFooter>
            {footer || (
              <ButtonGroup>
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isSubmitting}>
                  {cancelLabel || t("common.cancel")}
                </Button>
                {onSubmit && (
                  <Button type="submit" disabled={isSubmitting} loading={isSubmitting}>
                    {submitLabel || t("common.save")}
                  </Button>
                )}
              </ButtonGroup>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
