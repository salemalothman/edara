"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Users, PenToolIcon as Tool, CreditCard, BarChart, MessageSquare } from "lucide-react"
import { useRouter } from "next/navigation"
import { useLanguage } from "@/hooks/use-language"

export function ModuleCards() {
  const router = useRouter()
  const { t } = useLanguage()

  const modules = [
    {
      title: "Tenant & Contract Management",
      description:
        "Create, renew, and manage tenant contracts with flexible terms, digital signatures, and electronic records.",
      icon: FileText,
      action: "Manage Contracts",
      path: "/tenants",
    },
    {
      title: "Financial Management",
      description:
        "Track payments, manage invoices, and process rent collections through secure payment gateways with Visa and MasterCard integration.",
      icon: CreditCard,
      action: "Financial Dashboard",
      path: "/invoices",
    },
    {
      title: "Reporting & Analytics",
      description:
        "View real-time financial analytics, monthly reports, and portfolio performance overviews directly on the dashboard.",
      icon: BarChart,
      action: "View Dashboard",
      path: "/",
    },
    {
      title: "Communication & Notifications",
      description:
        "Send automated alerts and reminders via SMS, Email, and WhatsApp for payments, maintenance, and other important updates.",
      icon: MessageSquare,
      action: "Communication Center",
      path: "/communications",
    },
    {
      title: "Maintenance Management",
      description:
        "Handle service requests, track maintenance progress, and generate work orders for vendors or in-house service providers.",
      icon: Tool,
      action: "Maintenance Portal",
      path: "/maintenance",
    },
    {
      title: "User & Access Management",
      description:
        "Configure role-based access control, manage user permissions, and track user actions with detailed audit logs.",
      icon: Users,
      action: "User Settings",
      path: "/settings/users",
    },
  ]

  const handleNavigate = (path: string) => {
    router.push(path)
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {modules.map((module, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-md">{module.title}</CardTitle>
            <module.icon className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <CardDescription className="min-h-[80px]">{module.description}</CardDescription>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" onClick={() => handleNavigate(module.path)}>
              {module.action}
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
