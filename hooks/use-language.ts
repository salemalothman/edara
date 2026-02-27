"use client"

import { useLanguage as useLanguageContext } from "@/contexts/language-context"

export function useLanguage() {
  return useLanguageContext()
}
