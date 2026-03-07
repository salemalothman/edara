import type { Metadata } from "next"
import { LanguageProvider } from "@/contexts/language-context"
import { EditPropertyContent } from "./edit-property-content"

export const metadata: Metadata = {
  title: "Edit Property | Edara Dashboard",
  description: "Edit property details",
}

export default async function EditPropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <LanguageProvider>
      <EditPropertyContent propertyId={id} />
    </LanguageProvider>
  )
}
