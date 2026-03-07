import type { Metadata } from "next"
import PropertiesContent from "./properties-content"

export const metadata: Metadata = {
  title: "Properties | Edara Dashboard",
  description: "Manage your properties",
}

export default function PropertiesPage() {
  return <PropertiesContent />
}
