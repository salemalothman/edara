"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Filter } from "lucide-react"
import { useLanguage } from "@/hooks/use-language"

export interface PropertyFilterState {
  types: {
    residential: boolean
    commercial: boolean
    mixed: boolean
  }
}

interface PropertyFiltersProps {
  filters: PropertyFilterState
  onFiltersChange: (filters: PropertyFilterState) => void
}

export function PropertyFilters({ filters, onFiltersChange }: PropertyFiltersProps) {
  const { t } = useLanguage()

  const toggleType = (type: keyof PropertyFilterState["types"]) => {
    onFiltersChange({
      ...filters,
      types: {
        ...filters.types,
        [type]: !filters.types[type],
      },
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Filter className="mr-2 rtl:ml-2 rtl:mr-0 h-4 w-4" />
          {t("common.filter")}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>{t("properties.filterProperties")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          {t("properties.type")}
        </DropdownMenuLabel>
        <DropdownMenuCheckboxItem
          checked={filters.types.residential}
          onCheckedChange={() => toggleType("residential")}
        >
          {t("properties.residential")}
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={filters.types.commercial}
          onCheckedChange={() => toggleType("commercial")}
        >
          {t("properties.commercial")}
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={filters.types.mixed}
          onCheckedChange={() => toggleType("mixed")}
        >
          {t("properties.mixedUse")}
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
