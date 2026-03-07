import type { Metadata } from "next"
import { LanguageProvider } from "@/contexts/language-context"
import { PropertyTenantsContent } from "./property-tenants-content"

export const metadata: Metadata = {
  title: "Property Tenants | Edara Dashboard",
  description: "View and manage property tenants",
}

export default async function PropertyTenantsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <LanguageProvider>
      <PropertyTenantsContent propertyId={id} />
    </LanguageProvider>
  )
}
