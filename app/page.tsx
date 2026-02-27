import type { Metadata } from "next"
import DashboardPage from "./dashboard-page"

export const metadata: Metadata = {
  title: "Edara Dashboard",
  description: "Property Management and Rent Collection Platform",
}

export default function Page() {
  return <DashboardPage />
}
