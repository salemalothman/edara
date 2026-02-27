"use client"

import { Input } from "@/components/ui/input"
import { SearchIcon } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

export function Search() {
  const { t } = useLanguage()

  return (
    <div className="relative w-full md:w-auto">
      <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground rtl:left-auto rtl:right-2" />
      <Input
        type="search"
        placeholder={t("common.search")}
        className="pl-8 rtl:pl-4 rtl:pr-8 md:w-[300px] lg:w-[400px]"
      />
    </div>
  )
}
