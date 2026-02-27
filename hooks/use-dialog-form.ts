"use client"

import type React from "react"

import { useState } from "react"
import { useToast } from "@/hooks/use-toast"

interface UseDialogFormOptions<T> {
  initialData: T
  validationFn?: (data: T) => boolean
  onSubmit?: (data: T) => Promise<void>
  successMessage?: string
  errorMessage?: string
}

export function useDialogForm<T>({
  initialData,
  validationFn,
  onSubmit,
  successMessage = "Operation completed successfully",
  errorMessage = "An error occurred. Please try again.",
}: UseDialogFormOptions<T>) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<T>(initialData)
  const { toast } = useToast()

  const resetForm = () => {
    setFormData(initialData)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  const handleSelectChange = (id: string, value: string) => {
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  const handleSubmit = async () => {
    // Validate form if validation function is provided
    if (validationFn && !validationFn(formData)) {
      return
    }

    setIsSubmitting(true)

    try {
      // If custom onSubmit is provided, use it
      if (onSubmit) {
        await onSubmit(formData)
      } else {
        // Default behavior: simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1500))
      }

      toast({
        title: "Success",
        description: successMessage,
      })

      // Reset form and close dialog
      resetForm()
      setOpen(false)
    } catch (error) {
      console.error("Form submission error:", error)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    open,
    setOpen,
    isSubmitting,
    formData,
    setFormData,
    handleInputChange,
    handleSelectChange,
    handleSubmit,
    resetForm,
  }
}
