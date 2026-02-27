"use client"

import type * as React from "react"
import { Button, type ButtonProps } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

interface LoadingButtonProps extends ButtonProps {
  isLoading: boolean
  loadingText?: string
  spinner?: React.ReactNode
}

/**
 * LoadingButton - A button with loading state
 */
export function LoadingButton({ isLoading, loadingText, spinner, children, disabled, ...props }: LoadingButtonProps) {
  return (
    <Button disabled={disabled || isLoading} {...props}>
      {isLoading ? (
        <>
          {spinner || <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {loadingText || children}
        </>
      ) : (
        children
      )}
    </Button>
  )
}
