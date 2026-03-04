"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { FileText, FileSpreadsheet } from "lucide-react"
import { useLanguage } from "@/hooks/use-language"
import type { ExportFormat } from "@/utils/export"

interface ExportFormatDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (format: ExportFormat) => void
  loading?: boolean
}

export function ExportFormatDialog({ open, onOpenChange, onSelect, loading }: ExportFormatDialogProps) {
  const { t } = useLanguage()
  const [selected, setSelected] = useState<ExportFormat>("csv")

  const formats: { value: ExportFormat; label: string; description: string; icon: React.ReactNode }[] = [
    {
      value: "csv",
      label: t("export.csv"),
      description: t("export.csvDesc"),
      icon: <FileSpreadsheet className="h-6 w-6" />,
    },
    {
      value: "pdf",
      label: t("export.pdf"),
      description: t("export.pdfDesc"),
      icon: <FileText className="h-6 w-6" />,
    },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("export.chooseFormat")}</DialogTitle>
          <DialogDescription>{t("export.chooseFormatDesc")}</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 py-4">
          {formats.map((fmt) => (
            <button
              key={fmt.value}
              onClick={() => setSelected(fmt.value)}
              className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors hover:bg-accent ${
                selected === fmt.value ? "border-primary bg-accent" : "border-muted"
              }`}
            >
              {fmt.icon}
              <span className="font-medium">{fmt.label}</span>
              <span className="text-xs text-muted-foreground text-center">{fmt.description}</span>
            </button>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            {t("common.cancel")}
          </Button>
          <Button
            onClick={() => {
              onSelect(selected)
              onOpenChange(false)
            }}
            disabled={loading}
          >
            {loading ? t("financial.exporting") : t("export.download")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
