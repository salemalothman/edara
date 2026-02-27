"use client"

import { CalendarDateRangePicker } from "@/components/date-range-picker"
import { MainNav } from "@/components/main-nav"
import { Search } from "@/components/search"
import { UserNav } from "@/components/user-nav"
import { Logo } from "@/components/logo"
import { useLanguage } from "@/hooks/use-language"
import { Button } from "@/components/ui/button"
import { ExportButton } from "@/components/ui/export-button"
import { Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { useState } from "react"

interface DashboardHeaderProps {
  showDatePicker?: boolean
  showExport?: boolean
  showAddButton?: boolean
  addButtonLabel?: string
  addButtonRoute?: string
  onAddButtonClick?: () => void
  onExport?: () => Promise<void>
}

export function DashboardHeader({
  showDatePicker = true,
  showExport = true,
  showAddButton = true,
  addButtonLabel,
  addButtonRoute = "/properties/add",
  onAddButtonClick,
  onExport,
}: DashboardHeaderProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const { toast } = useToast()
  const [isExporting, setIsExporting] = useState(false)

  const handleAddButtonClick = () => {
    if (onAddButtonClick) {
      onAddButtonClick()
    } else if (addButtonRoute) {
      router.push(addButtonRoute)
    }
  }

  const handleExport = async () => {
    setIsExporting(true)

    try {
      if (onExport) {
        await onExport()
      } else {
        // Default export behavior
        await new Promise((resolve) => setTimeout(resolve, 1500))
        toast({
          title: "Export Successful",
          description: "Dashboard data has been exported successfully.",
        })
      }
    } catch (error) {
      console.error("Export error:", error)
      toast({
        title: "Export Failed",
        description: "There was an error exporting the dashboard data.",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="border-b">
      <div className="flex h-16 items-center px-4">
        <Logo size="md" className="mr-4 rtl:ml-4 rtl:mr-0" />
        <MainNav className="mx-6" />
        <div className="ml-auto rtl:mr-auto rtl:ml-0 flex items-center space-x-4 rtl:space-x-reverse">
          <Search />

          {showAddButton && (
            <Button onClick={handleAddButtonClick}>
              <Plus className="mr-2 rtl:ml-2 rtl:mr-0 h-4 w-4" />
              {addButtonLabel || t("properties.addProperty")}
            </Button>
          )}

          <UserNav />
        </div>
      </div>

      {(showDatePicker || showExport) && (
        <div className="flex items-center justify-between px-4 py-2 border-t">
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            {showDatePicker && <CalendarDateRangePicker />}
          </div>

          {showExport && (
            <ExportButton
              onExport={onExport}
              successMessage="Dashboard data has been exported successfully."
              errorMessage="There was an error exporting the dashboard data."
            />
          )}
        </div>
      )}
    </div>
  )
}
