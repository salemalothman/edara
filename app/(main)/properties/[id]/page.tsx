import type { Metadata } from "next"
import { LanguageProvider } from "@/contexts/language-context"
import { PropertyDetailContent } from "./property-detail-content"

export const metadata: Metadata = {
  title: "Property Details | Edara Dashboard",
  description: "View property details",
}

export default async function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <LanguageProvider>
      <PropertyDetailContent propertyId={id} />
    </LanguageProvider>
  )
}
