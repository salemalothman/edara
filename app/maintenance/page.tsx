import type { Metadata } from "next"
import { MaintenancePageClient } from "./page-client"

export const metadata: Metadata = {
  title: "Maintenance | Edara Dashboard",
  description: "Manage maintenance requests and work orders",
}

export default function MaintenancePage() {
  return <MaintenancePageClient />
}
