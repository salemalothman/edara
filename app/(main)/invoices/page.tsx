import type { Metadata } from "next"
import { InvoicesPageClient } from "./page-client"

export const metadata: Metadata = {
  title: "Invoices | Edara Dashboard",
  description: "Manage your invoices and payments",
}

export default function InvoicesPage() {
  return <InvoicesPageClient />
}
