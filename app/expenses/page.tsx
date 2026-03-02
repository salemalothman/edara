import type { Metadata } from "next"
import { ExpensesPageClient } from "./page-client"

export const metadata: Metadata = {
  title: "Expenses | Edara Dashboard",
  description: "Track and manage property-related expenses",
}

export default function ExpensesPage() {
  return <ExpensesPageClient />
}
