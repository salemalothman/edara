import type { Metadata } from "next"
import { ReportsPageClient } from "./page-client"

export const metadata: Metadata = {
  title: "Reports | Edara Dashboard",
  description: "Generate and view property management reports",
}

export default function ReportsPage() {
  return <ReportsPageClient />
}
