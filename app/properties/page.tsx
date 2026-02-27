import type { Metadata } from "next"
import { LanguageProvider } from "@/contexts/language-context"
import PropertiesContent from "./properties-content"

export const metadata: Metadata = {
  title: "Properties | Edara Dashboard",
  description: "Manage your properties",
}

export default function PropertiesPage() {
  return (
    <LanguageProvider>
      <PropertiesContent />
    </LanguageProvider>
  )
}
