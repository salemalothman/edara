"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useFormatter } from "@/hooks/use-formatter"
import { useLanguage } from "@/hooks/use-language"

export function RecentInvoices() {
  const { t } = useLanguage()
  const { formatCurrency } = useFormatter()

  return (
    <div className="space-y-8">
      <div className="flex items-center">
        <Avatar className="h-9 w-9">
          <AvatarImage src="/placeholder.svg?height=36&width=36" alt="Avatar" />
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
        <div className="ml-4 rtl:mr-4 rtl:ml-0 space-y-1">
          <p className="text-sm font-medium leading-none">John Doe</p>
          <p className="text-sm text-muted-foreground">Apartment 301, Tower A</p>
        </div>
        <div className="ml-auto rtl:mr-auto rtl:ml-0 font-medium">
          <Badge variant="outline" className="ml-2 rtl:mr-2 rtl:ml-0 bg-green-50 text-green-700 border-green-200">
            {t("status.paid")}
          </Badge>
          <p className="mt-1 text-sm">{formatCurrency(1250)}</p>
        </div>
      </div>
      <div className="flex items-center">
        <Avatar className="h-9 w-9">
          <AvatarImage src="/placeholder.svg?height=36&width=36" alt="Avatar" />
          <AvatarFallback>MS</AvatarFallback>
        </Avatar>
        <div className="ml-4 rtl:mr-4 rtl:ml-0 space-y-1">
          <p className="text-sm font-medium leading-none">Maria Smith</p>
          <p className="text-sm text-muted-foreground">Apartment 205, Tower B</p>
        </div>
        <div className="ml-auto rtl:mr-auto rtl:ml-0 font-medium">
          <Badge variant="outline" className="ml-2 rtl:mr-2 rtl:ml-0 bg-yellow-50 text-yellow-700 border-yellow-200">
            {t("status.pending")}
          </Badge>
          <p className="mt-1 text-sm">{formatCurrency(950)}</p>
        </div>
      </div>
      <div className="flex items-center">
        <Avatar className="h-9 w-9">
          <AvatarImage src="/placeholder.svg?height=36&width=36" alt="Avatar" />
          <AvatarFallback>RJ</AvatarFallback>
        </Avatar>
        <div className="ml-4 rtl:mr-4 rtl:ml-0 space-y-1">
          <p className="text-sm font-medium leading-none">Robert Johnson</p>
          <p className="text-sm text-muted-foreground">Villa 12, Seaside Complex</p>
        </div>
        <div className="ml-auto rtl:mr-auto rtl:ml-0 font-medium">
          <Badge variant="outline" className="ml-2 rtl:mr-2 rtl:ml-0 bg-red-50 text-red-700 border-red-200">
            {t("status.overdue")}
          </Badge>
          <p className="mt-1 text-sm">{formatCurrency(1800)}</p>
        </div>
      </div>
      <div className="flex items-center">
        <Avatar className="h-9 w-9">
          <AvatarImage src="/placeholder.svg?height=36&width=36" alt="Avatar" />
          <AvatarFallback>AL</AvatarFallback>
        </Avatar>
        <div className="ml-4 rtl:mr-4 rtl:ml-0 space-y-1">
          <p className="text-sm font-medium leading-none">Amanda Lee</p>
          <p className="text-sm text-muted-foreground">Office 405, Business Center</p>
        </div>
        <div className="ml-auto rtl:mr-auto rtl:ml-0 font-medium">
          <Badge variant="outline" className="ml-2 rtl:mr-2 rtl:ml-0 bg-green-50 text-green-700 border-green-200">
            {t("status.paid")}
          </Badge>
          <p className="mt-1 text-sm">{formatCurrency(2500)}</p>
        </div>
      </div>
      <div className="flex items-center">
        <Avatar className="h-9 w-9">
          <AvatarImage src="/placeholder.svg?height=36&width=36" alt="Avatar" />
          <AvatarFallback>DW</AvatarFallback>
        </Avatar>
        <div className="ml-4 rtl:mr-4 rtl:ml-0 space-y-1">
          <p className="text-sm font-medium leading-none">David Wilson</p>
          <p className="text-sm text-muted-foreground">Shop 3, Market Square</p>
        </div>
        <div className="ml-auto rtl:mr-auto rtl:ml-0 font-medium">
          <Badge variant="outline" className="ml-2 rtl:mr-2 rtl:ml-0 bg-yellow-50 text-yellow-700 border-yellow-200">
            {t("status.pending")}
          </Badge>
          <p className="mt-1 text-sm">{formatCurrency(1100)}</p>
        </div>
      </div>
    </div>
  )
}
