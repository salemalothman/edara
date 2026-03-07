import type { Metadata } from "next"
import { AccountsPageClient } from "./page-client"

export const metadata: Metadata = {
  title: "Accounts | Edara Dashboard",
  description: "Detailed financial accounts overview",
}

export default function AccountsPage() {
  return <AccountsPageClient />
}
