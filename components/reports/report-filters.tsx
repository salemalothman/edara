"use client"

import { useLanguage } from "@/hooks/use-language"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Filter } from "lucide-react"

export function ReportFilters() {
  const { t } = useLanguage()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <Filter className="mr-2 rtl:ml-2 rtl:mr-0 h-4 w-4" />
          {t("common.filter")}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>
          {t("common.filter")} {t("reports.title")}
        </DropdownMenuLabel>
        {/* Dropdown content */}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
