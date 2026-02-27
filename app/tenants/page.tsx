import type { Metadata } from "next"
import { TenantsPageClient } from "./page-client"

export const metadata: Metadata = {
  title: "Tenants | Edara Dashboard",
  description: "Manage your tenants",
}

export default function TenantsPage() {
  return <TenantsPageClient />
}
