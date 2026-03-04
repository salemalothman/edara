"use client"

import { MainNav } from "@/components/main-nav"
import { Search } from "@/components/search"
import { UserNav } from "@/components/user-nav"
import { Logo } from "@/components/logo"
import { useLanguage } from "@/hooks/use-language"
import { Button } from "@/components/ui/button"
import { Download, Bell, Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { fetchUnreadCount } from "@/lib/services/notifications"

interface DashboardHeaderProps {
  showDatePicker?: boolean
  showExport?: boolean
  showAddButton?: boolean
  addButtonLabel?: string
  addButtonRoute?: string
  onAddButtonClick?: () => void
  onExport?: () => Promise<void>
  selectedPeriod?: string
  onPeriodChange?: (period: string) => void
}

export function DashboardHeader({
  showDatePicker = true,
  showExport = true,
  showAddButton = true,
  addButtonLabel,
  addButtonRoute = "/properties/add",
  onAddButtonClick,
  onExport,
  selectedPeriod = "6m",
  onPeriodChange,
}: DashboardHeaderProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    fetchUnreadCount().then(setUnreadCount)
  }, [])

  const handleAddButtonClick = () => {
    if (onAddButtonClick) {
      onAddButtonClick()
    } else if (addButtonRoute) {
      router.push(addButtonRoute)
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

          <Button variant="ghost" size="icon" className="relative" onClick={() => {
            const tabsTrigger = document.querySelector('[data-value="notifications"]') as HTMLElement
            tabsTrigger?.click()
          }}>
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge variant="destructive" className="absolute -top-1 -right-1 rtl:right-auto rtl:-left-1 h-5 min-w-[20px] px-1 text-xs flex items-center justify-center">
                {unreadCount > 99 ? "99+" : unreadCount}
              </Badge>
            )}
          </Button>

          <UserNav />
        </div>
      </div>

      {(showDatePicker || showExport) && (
        <div className="flex items-center justify-between px-4 py-2 border-t">
          <div className="flex items-center space-x-1 rtl:space-x-reverse">
            {showDatePicker && (
              <>
                {[
                  { key: "1m", label: t("dashboard.period1m") },
                  { key: "3m", label: t("dashboard.period3m") },
                  { key: "6m", label: t("dashboard.period6m") },
                ].map((period) => (
                  <Button
                    key={period.key}
                    size="sm"
                    variant={selectedPeriod === period.key ? "default" : "outline"}
                    onClick={() => onPeriodChange?.(period.key)}
                  >
                    {period.label}
                  </Button>
                ))}
              </>
            )}
          </div>

          {showExport && (
            <Button variant="outline" size="sm" onClick={() => onExport?.()}>
              <Download className="mr-2 rtl:ml-2 rtl:mr-0 h-4 w-4" />
              {t("common.export")}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
