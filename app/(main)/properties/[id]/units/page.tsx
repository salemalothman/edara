import type { Metadata } from "next"
import { LanguageProvider } from "@/contexts/language-context"
import { PropertyUnitsContent } from "./property-units-content"

export const metadata: Metadata = {
  title: "Property Units | Edara Dashboard",
  description: "View and manage property units",
}

export default async function PropertyUnitsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <LanguageProvider>
      <PropertyUnitsContent propertyId={id} />
    </LanguageProvider>
  )
}
