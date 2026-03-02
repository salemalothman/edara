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
      title: t("modules.tenantContract.title"),
      description: t("modules.tenantContract.description"),
      icon: FileText,
      action: t("modules.tenantContract.action"),
      path: "/tenants",
    },
    {
      title: t("modules.financial.title"),
      description: t("modules.financial.description"),
      icon: CreditCard,
      action: t("modules.financial.action"),
      path: "/invoices",
    },
    {
      title: t("modules.reporting.title"),
      description: t("modules.reporting.description"),
      icon: BarChart,
      action: t("modules.reporting.action"),
      path: "/",
    },
    {
      title: t("modules.communication.title"),
      description: t("modules.communication.description"),
      icon: MessageSquare,
      action: t("modules.communication.action"),
      path: "/communications",
    },
    {
      title: t("modules.maintenance.title"),
      description: t("modules.maintenance.description"),
      icon: Tool,
      action: t("modules.maintenance.action"),
      path: "/maintenance",
    },
    {
      title: t("modules.userAccess.title"),
      description: t("modules.userAccess.description"),
      icon: Users,
      action: t("modules.userAccess.action"),
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
