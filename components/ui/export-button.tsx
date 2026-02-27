"use client"

import { useState } from "react"
import { Button, type ButtonProps } from "@/components/ui/button"
import { Download } from "lucide-react"
import { useLanguage } from "@/hooks/use-language"
import { useToast } from "@/hooks/use-toast"

interface ExportButtonProps extends Omit<ButtonProps, "onClick"> {
  onExport?: () => Promise<void>
  successMessage?: string
  errorMessage?: string
  exportingLabel?: string
  exportLabel?: string
}

export function ExportButton({
  onExport,
  successMessage = "Data has been exported successfully.",
  errorMessage = "There was an error exporting the data.",
  exportingLabel,
  exportLabel,
  ...props
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)
  const { t } = useLanguage()
  const { toast } = useToast()

  // Use provided labels or default to translations
  const exportingText = exportingLabel || t("financial.exporting")
  const exportText = exportLabel || t("common.export")

  const handleExport = async () => {
    setIsExporting(true)

    try {
      if (onExport) {
        await onExport()
      } else {
        // Default behavior: simulate export process
        await new Promise((resolve) => setTimeout(resolve, 1500))
      }

      toast({
        title: "Export Successful",
        description: successMessage,
      })
    } catch (error) {
      console.error("Export error:", error)
      toast({
        title: "Export Failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleExport} disabled={isExporting} loading={isExporting} {...props}>
      <Download className="mr-2 rtl:ml-2 rtl:mr-0 h-4 w-4" />
      <span>{isExporting ? exportingText : exportText}</span>
    </Button>
  )
}
