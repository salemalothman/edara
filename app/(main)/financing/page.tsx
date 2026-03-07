import type { Metadata } from "next"
import { FinancingPageClient } from "./page-client"

export const metadata: Metadata = {
  title: "Financing & Debt | Edara Dashboard",
  description: "Manage property financing, debt service, and investment data",
}

export default function FinancingPage() {
  return <FinancingPageClient />
}
