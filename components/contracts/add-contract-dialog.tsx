"use client"

import type React from "react"

import { useState, useRef } from "react"
import { FileText, Upload, Loader2, X } from "lucide-react"
import { useLanguage } from "@/hooks/use-language"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { uploadContractForTenant } from "@/lib/services/contracts"
import { fetchTenants } from "@/lib/services/tenants"
import { useSupabaseQuery } from "@/hooks/use-supabase-query"

interface AddContractDialogProps {
  onSuccess?: () => void
  defaultTenantId?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: React.ReactNode
}

export function AddContractDialog({ onSuccess, defaultTenantId, open: controlledOpen, onOpenChange, trigger }: AddContractDialogProps = {}) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen
  const setOpen = (value: boolean) => {
    if (isControlled) {
      onOpenChange?.(value)
    } else {
      setInternalOpen(value)
    }
  }
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { t } = useLanguage()
  const { toast } = useToast()

  const { data: tenantsData } = useSupabaseQuery(fetchTenants)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0])
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0]
      if (droppedFile.type === "application/pdf") {
        setFile(droppedFile)
      } else {
        toast({
          title: t("common.error"),
          description: t("contracts.pdfOnly"),
          variant: "destructive",
        })
      }
    }
  }

  const handleSubmit = async () => {
    if (!file) {
      toast({
        title: t("common.error"),
        description: t("contracts.selectPdfFirst"),
        variant: "destructive",
      })
      return
    }

    const tenantId = defaultTenantId
    if (!tenantId) {
      toast({
        title: t("common.error"),
        description: t("contracts.addError"),
        variant: "destructive",
      })
      return
    }

    const tenant = tenantsData.find((t: any) => t.id === tenantId)

    setIsSubmitting(true)
    try {
      await uploadContractForTenant(
        tenantId,
        tenant?.property_id || "",
        tenant?.unit_id || "",
        file
      )
      onSuccess?.()
      toast({
        title: t("contracts.addSuccess"),
        description: t("contracts.contractAdded"),
      })
      setFile(null)
      setOpen(false)
    } catch (error) {
      toast({
        title: t("common.error"),
        description: t("contracts.addError"),
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen)
      if (!isOpen) {
        setFile(null)
      }
    }}>
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : !isControlled ? (
        <DialogTrigger asChild>
          <Button>
            <FileText className="mr-2 rtl:ml-2 rtl:mr-0 h-4 w-4" /> {t("contracts.addContract")}
          </Button>
        </DialogTrigger>
      ) : null}
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t("contracts.addContract")}</DialogTitle>
          <DialogDescription>{t("contracts.uploadContractDesc")}</DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {file ? (
            <Alert variant="outline" className="border-primary/50">
              <FileText className="h-4 w-4" />
              <AlertTitle>{t("contracts.fileSelected")}</AlertTitle>
              <AlertDescription className="flex items-center justify-between">
                <span className="truncate pe-4">{file.name}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setFile(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          ) : (
            <div
              className="border-2 border-dashed rounded-md p-8 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
            >
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".pdf"
                onChange={handleFileChange}
              />
              <Upload className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">{t("contracts.uploadContract")}</p>
              <p className="text-sm text-muted-foreground text-center mb-4">{t("contracts.supportedFormats")}</p>
              <Button variant="outline" type="button">
                {t("contracts.selectFile")}
              </Button>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
            {t("common.cancel")}
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isSubmitting || !file}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("common.saving")}
              </>
            ) : (
              t("common.save")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
