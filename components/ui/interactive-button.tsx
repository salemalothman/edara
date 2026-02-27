"use client"

import * as React from "react"
import { Button, type ButtonProps } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

interface InteractiveButtonProps extends ButtonProps {
  onAction: () => Promise<void> | void
  loadingText?: string
  successText?: string
  errorText?: string
  showToast?: boolean
  successToastTitle?: string
  successToastDescription?: string
  errorToastTitle?: string
  errorToastDescription?: string
  resetAfter?: number // ms to reset to original state after success
}

/**
 * InteractiveButton - A button that handles loading states, success/error states,
 * and provides feedback to the user during async operations.
 */
export function InteractiveButton({
  onAction,
  loadingText,
  successText,
  errorText,
  showToast = true,
  successToastTitle = "Success",
  successToastDescription,
  errorToastTitle = "Error",
  errorToastDescription = "An error occurred. Please try again.",
  resetAfter = 2000,
  children,
  ...props
}: InteractiveButtonProps) {
  const [state, setState] = React.useState<"idle" | "loading" | "success" | "error">("idle")
  const { toast } = useToast()
  const originalChildren = React.useRef(children)

  // Reset to idle state after success/error
  React.useEffect(() => {
    let timeout: NodeJS.Timeout
    if (state === "success" || state === "error") {
      timeout = setTimeout(() => {
        setState("idle")
      }, resetAfter)
    }
    return () => clearTimeout(timeout)
  }, [state, resetAfter])

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (state === "loading") return

    try {
      setState("loading")
      await onAction()
      setState("success")

      if (showToast) {
        toast({
          title: successToastTitle,
          description: successToastDescription,
        })
      }
    } catch (error) {
      console.error("Button action error:", error)
      setState("error")

      if (showToast) {
        toast({
          title: errorToastTitle,
          description: errorToastDescription || String(error),
          variant: "destructive",
        })
      }
    }
  }

  // Determine button content based on state
  const getButtonContent = () => {
    switch (state) {
      case "loading":
        return loadingText || children
      case "success":
        return successText || children
      case "error":
        return errorText || children
      default:
        return children
    }
  }

  // Determine button variant based on state
  const getButtonVariant = (): ButtonProps["variant"] => {
    switch (state) {
      case "success":
        return "default" // You could use a custom success variant if defined
      case "error":
        return props.variant === "destructive" ? "destructive" : "outline"
      default:
        return props.variant
    }
  }

  return (
    <Button
      {...props}
      variant={getButtonVariant()}
      loading={state === "loading"}
      onClick={handleClick}
      disabled={props.disabled || state === "loading"}
      data-state={state}
    >
      {getButtonContent()}
    </Button>
  )
}
