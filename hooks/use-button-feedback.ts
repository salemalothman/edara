"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"

interface ButtonFeedbackOptions {
  successMessage?: string
  errorMessage?: string
  resetDelay?: number
}

/**
 * A hook for managing button feedback states during async operations
 */
export function useButtonFeedback(options: ButtonFeedbackOptions = {}) {
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle")
  const { toast } = useToast()

  const {
    successMessage = "Operation completed successfully",
    errorMessage = "An error occurred. Please try again.",
    resetDelay = 2000,
  } = options

  useEffect(() => {
    let timeout: NodeJS.Timeout

    if (state === "success" || state === "error") {
      timeout = setTimeout(() => {
        setState("idle")
      }, resetDelay)
    }

    return () => clearTimeout(timeout)
  }, [state, resetDelay])

  const handleAction = async (action: () => Promise<void>) => {
    try {
      setState("loading")
      await action()
      setState("success")

      if (successMessage) {
        toast({
          title: "Success",
          description: successMessage,
        })
      }

      return true
    } catch (error) {
      console.error("Action error:", error)
      setState("error")

      toast({
        title: "Error",
        description: errorMessage || String(error),
        variant: "destructive",
      })

      return false
    }
  }

  return {
    state,
    isLoading: state === "loading",
    isSuccess: state === "success",
    isError: state === "error",
    handleAction,
    reset: () => setState("idle"),
  }
}
