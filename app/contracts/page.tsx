import type { Metadata } from "next"
import { ContractsPageClient } from "./page-client"

export const metadata: Metadata = {
  title: "Contracts | Edara Dashboard",
  description: "Manage your lease contracts",
}

export default function ContractsPage() {
  return <ContractsPageClient />
}
